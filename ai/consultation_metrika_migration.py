#!/usr/bin/env python3
"""One-time Metrika cleanup and consultation-goal installation; invoked by an approved workflow."""
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = json.loads((ROOT / "ai/consultation-goals.json").read_text(encoding="utf-8"))
CLASSIC = json.loads((ROOT / "ai/classic-goals.json").read_text(encoding="utf-8"))["goals"]
STUDIO = json.loads((ROOT / "ai/studio-goals.json").read_text(encoding="utf-8"))["goals"]
COUNT = str(CATALOG["counter_id"])
TOKEN = os.environ.get("YANDEX_METRIKA_OAUTH", "").strip()
BASE = f"https://api-metrika.yandex.net/management/v1/counter/{COUNT}/goals"
BACKUP = ROOT / "metrika-goals-before-consultation-cleanup.json"
AFTER = ROOT / "metrika-goals-after-consultation-cleanup.json"
MODE = sys.argv[1] if len(sys.argv) > 1 else "check"
if not TOKEN:
    sys.exit("MISSING_METRIKA_OAUTH")
if MODE not in {"check", "apply"}:
    sys.exit("INVALID_MODE")
if len(CLASSIC) != 36 or len(STUDIO) != 33 or len(CATALOG["goals"]) != 15:
    sys.exit("UNEXPECTED_GOAL_CATALOG_COUNTS")
classic_events = {x["id"] for x in CLASSIC}
studio_events = {x["id"] for x in STUDIO}
new = CATALOG["goals"]
if len({x["id"] for x in new}) != len(new):
    sys.exit("DUPLICATE_CONSULTATION_EVENTS")
if any(not x["id"].startswith("consultation_") for x in new):
    sys.exit("INVALID_CONSULTATION_EVENT")

def request(method, path="", payload=None):
    raw = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    headers = {"Authorization": "OAuth " + TOKEN, "Accept": "application/json"}
    if raw is not None:
        headers["Content-Type"] = "application/json; charset=utf-8"
    for attempt in range(8):
        req = urllib.request.Request(BASE + path, headers=headers, data=raw, method=method)
        try:
            with urllib.request.urlopen(req, timeout=40) as rsp:
                data = rsp.read()
                return json.loads(data.decode("utf-8")) if data else {}
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < 7:
                time.sleep(min(3 * (attempt + 1), 20))
                continue
            raise RuntimeError(f"METRIKA_HTTP_{exc.code}_{method}") from None
        except (urllib.error.URLError, TimeoutError):
            if attempt < 7:
                time.sleep(min(3 * (attempt + 1), 20))
                continue
            raise RuntimeError(f"METRIKA_UNAVAILABLE_{method}") from None

def inventory():
    return request("GET").get("goals", [])

def goal_events(g):
    return [str(c.get("url", "")) for c in g.get("conditions", []) if isinstance(c, dict)]

def protected(g):
    events = goal_events(g)
    name = str(g.get("name", "")).upper()
    return (
        "КЛАССИКА" in name
        or "СТУДИЯ" in name
        or "studio_paid" in str(g.get("name", "")).lower()
        or any(
            e in classic_events or e in studio_events
            or e.startswith("ai_classic_") or e.startswith("studio_")
            or "studio_paid" in e
            for e in events
        )
    )

def automatic(g):
    return g.get("goal_source") == "auto"

def id_set(gs):
    return {int(x["id"]) for x in gs}

def validate_protection(gs):
    p = [g for g in gs if protected(g)]
    events = {x for g in p for x in goal_events(g)}
    missing_classic = sorted(classic_events - events)
    missing_studio = sorted(studio_events - events)
    if missing_classic or missing_studio:
        sys.exit(f"PROTECTED_GOALS_MISSING: classic={missing_classic} studio={missing_studio}")
    if len(p) < 69:
        sys.exit("INSUFFICIENT_PROTECTED_GOALS")
    return p

before = inventory()
preserved = validate_protection(before)
auto = [g for g in before if automatic(g) and not protected(g)]
remove = [g for g in before if not protected(g) and not automatic(g)
          and not any(x["id"] in goal_events(g) for x in new)]
already_consult = [g for g in before if any(x["id"] in goal_events(g) for x in new)]
snapshot = {
    "counter_id": COUNT,
    "goals": before,
    "preserved_goal_ids": sorted(id_set(preserved)),
    "automatic_goal_ids": sorted(id_set(auto)),
    "planned_delete_ids": sorted(id_set(remove)),
    "consultation_goal_ids_present_before": sorted(id_set(already_consult)),
}
print("PRECHECK", json.dumps({
    "total": len(before), "preserve": len(preserved), "auto_keep": len(auto),
    "delete": len(remove), "already_consult": len(already_consult),
    "new_goals": len(new),
}, ensure_ascii=False), flush=True)
BACKUP.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
if MODE == "check":
    print("SAFE_BACKUP_READY", BACKUP.name, flush=True)
    sys.exit(0)

# An artifact-upload step must complete before this mode is allowed to run.
if os.environ.get("BACKUP_ARTIFACT_UPLOADED") != "yes":
    sys.exit("BACKUP_ARTIFACT_REQUIRED")
if not BACKUP.is_file():
    sys.exit("BACKUP_MISSING")
# This same job just generated the backup. Abort if goals changed meanwhile.
latest = inventory()
if id_set(latest) != id_set(before):
    sys.exit("CONCURRENT_GOAL_CHANGES_ABORT")
for g in already_consult:
    matches = [x for x in new if x["id"] in goal_events(g) and
               x["name"] == g.get("name") and g.get("type") == "action"]
    if len(matches) != 1:
        sys.exit("CONFLICTING_CONSULTATION_GOAL_ABORT")

preserved_ids = id_set(preserved)
auto_ids = id_set(auto)
for n, g in enumerate(remove, 1):
    gid = int(g["id"])
    if gid in preserved_ids or gid in auto_ids or protected(g):
        sys.exit("PROTECTED_DELETE_ATTEMPT_ABORT")
    request("DELETE", "/" + str(gid))
    if n % 10 == 0 or n == len(remove):
        print("DELETED", n, "OF", len(remove), flush=True)
    time.sleep(.25)

post_delete = inventory()
post_ids = id_set(post_delete)
if not preserved_ids.issubset(post_ids):
    sys.exit("PROTECTED_GOAL_CHANGED_ABORT")
if not auto_ids.issubset(post_ids):
    sys.exit("AUTO_GOAL_CHANGED_ABORT")
if id_set(remove) & post_ids:
    sys.exit("DELETE_INCOMPLETE_ABORT")

for g in new:
    matching = [x for x in post_delete if g["id"] in goal_events(x)]
    if matching:
        if len(matching) != 1 or matching[0].get("name") != g["name"]:
            sys.exit("CONSULTATION_GOAL_COLLISION")
        continue
    result = request("POST", payload={
        "goal": {"name": g["name"], "type": "action",
                 "conditions": [{"type": "exact", "url": g["id"]}]}
    })
    print("CREATED_CONSULTATION", g["id"], result.get("goal", {}).get("id"), flush=True)
    time.sleep(.25)

final = inventory()
events_final = {e for g in final for e in goal_events(g)}
missing = [x["id"] for x in new if x["id"] not in events_final]
if missing or not preserved_ids.issubset(id_set(final)) or not auto_ids.issubset(id_set(final)):
    sys.exit("FINAL_VERIFICATION_FAILED: " + repr(missing))
AFTER.write_text(json.dumps({
    "counter_id": COUNT, "goals": final,
    "preserved_goal_ids": sorted(preserved_ids), "auto_goal_ids": sorted(auto_ids),
    "new_goal_ids": {g["id"]: next(x["id"] for x in final if g["id"] in goal_events(x)) for g in new}
}, ensure_ascii=False, indent=2), encoding="utf-8")
print("FINAL_VERIFIED", json.dumps({
    "total": len(final), "protected": len(preserved_ids),
    "automatic": len(auto_ids), "deleted": len(remove), "consultation_goals": len(new)
}, ensure_ascii=False), flush=True)
