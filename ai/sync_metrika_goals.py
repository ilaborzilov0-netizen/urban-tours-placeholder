#!/usr/bin/env python3
"""Idempotently reconcile 68 explicitly approved /ai/ Metrika JavaScript goals.

Uses only environment-provided OAuth token, never prints credential/HTTP bodies.
Creates missing goals only, never deletes or modifies existing goals.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

GOAL_FILE = Path(__file__).resolve().with_name("goals.json")
cfg = json.loads(GOAL_FILE.read_text("utf-8"))
COUNTER = str(cfg["counter_id"])
ROOT = "https://api-metrika.yandex.net/management/v1/counter/" + COUNTER
TOKEN = os.environ.get("YANDEX_METRIKA_OAUTH", "").strip()
MODE = os.environ.get("METRIKA_SYNC_MODE", "check")
if not TOKEN:
    sys.exit("MISSING_SECRET: set YANDEX_METRIKA_OAUTH in repo Actions secrets")
if MODE not in ("check", "apply"):
    sys.exit("BAD_MODE: use check or apply")
items = cfg["goals"]
if len(items) != 68 or len({x["id"] for x in items}) != 68 or len({x["name"] for x in items}) != 68:
    sys.exit("BAD_CATALOG: expected exactly 68 distinct names and event IDs")

def request(method, endpoint, payload=None):
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode()
    headers = {"Authorization": "OAuth " + TOKEN, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    for attempt in range(5):
        req = urllib.request.Request(ROOT + endpoint, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                result = response.read()
                return json.loads(result.decode()) if result else {}
        except urllib.error.HTTPError as error:
            # Body deliberately not printed: avoid leaking auth headers / private data.
            if error.code in (429, 502, 503, 504) and attempt < 4:
                time.sleep((attempt + 1) * 2)
                continue
            raise RuntimeError(f"API {method} {endpoint.split('?')[0]} returned HTTP {error.code}") from None
        except (urllib.error.URLError, TimeoutError):
            if attempt < 4:
                time.sleep((attempt + 1) * 2)
                continue
            raise RuntimeError(f"API {method} failed: network/timeout") from None

def inventory():
    data = request("GET", "/goals")
    goals = data.get("goals", [])
    if not isinstance(goals, list):
        raise RuntimeError("Unexpected goals API response")
    return goals

def match_id(goal, identifier):
    return (goal.get("type") == "action"
            and any(cond.get("type") == "exact" and cond.get("url") == identifier
                    for cond in goal.get("conditions", []) if isinstance(cond, dict)))

initial = inventory()
print("COUNTER", COUNTER, "MODE", MODE, "GOALS_EXISTING", len(initial), "CATALOG", len(items), flush=True)
if len(initial) + len(items) > 200 and MODE == "apply":
    # Conservative check: even if some already exist, no change when worst-case above quota.
    sys.exit("QUOTA_PRECHECK_FAILED")

existing_by_id = {}
existing_by_name = {}
for goal in initial:
    for cond in goal.get("conditions", []):
        if isinstance(cond, dict) and goal.get("type") == "action" and cond.get("type") == "exact":
            existing_by_id.setdefault(cond.get("url"), []).append(goal)
    existing_by_name.setdefault(goal.get("name"), []).append(goal)

missing = []
conflicts = []
reused = []
for item in items:
    by_id = existing_by_id.get(item["id"], [])
    by_name = existing_by_name.get(item["name"], [])
    if (len(by_id) == 1 and by_id[0].get("name") == item["name"]
            and len(by_name) == 1 and by_name[0].get("id") == by_id[0].get("id")):
        reused.append(item)
    elif by_id or by_name:
        conflicts.append(item)
    else:
        missing.append(item)
print("REUSED", len(reused), "TO_CREATE", len(missing), "CONFLICTS", len(conflicts), flush=True)
if conflicts:
    for item in conflicts:
        print("CONFLICT", item["id"], "(existing name or condition differs)", flush=True)
    sys.exit("CONFLICT_ABORT: refusing to overwrite or duplicate any existing goals")
if MODE == "check":
    print("DRY_RUN_PASS", "missing", len(missing), "existing", len(reused), flush=True)
    sys.exit(0)

errors = []
created = 0
for index, item in enumerate(missing, 1):
    try:
        # POST is not guaranteed idempotent. On failure inspect inventory before retrying.
        try:
            result = request("POST", "/goals", {
                "goal": {
                    "name": item["name"],
                    "type": "action",
                    "conditions": [{"type": "exact", "url": item["id"]}]
                }
            })
        except RuntimeError as ex:
            fresh = inventory()
            found = [g for g in fresh if match_id(g, item["id"]) and g.get("name") == item["name"]]
            if len(found) == 1:
                print("CREATED_DESPITE_RESPONSE_ERROR", item["id"], "goal_id", found[0].get("id"), flush=True)
                created += 1
                continue
            raise ex
        goal = result.get("goal")
        if not isinstance(goal, dict) or not goal.get("id"):
            raise RuntimeError("POST returned unexpected goal structure")
        created += 1
        print("CREATED", str(index) + "/" + str(len(missing)), item["id"], "goal_id", goal["id"], flush=True)
        time.sleep(0.22)
    except Exception as ex:
        print("CREATE_ERROR", item["id"], str(ex), flush=True)
        errors.append(item["id"])
        # Continue with remaining goals; rerunning is safe and will create missing only.

final = inventory()
match_count = 0
for item in items:
    found = [g for g in final if match_id(g, item["id"]) and g.get("name") == item["name"]]
    if len(found) == 1:
        match_count += 1
    else:
        print("FINAL_NOT_UNIQUE", item["id"], "matching", len(found), flush=True)

print("FINAL_COUNTER", COUNTER, "FINAL_TOTAL", len(final), "VERIFIED", match_count,
      "EXPECTED", len(items), "NEW_CREATED", created, "ERRS", len(errors), flush=True)
if match_count != len(items):
    sys.exit("SYNC_INCOMPLETE; re-run is safe after fixing errors")
print("SYNC_SUCCESS: all 68 independent goals exist, correctly named, no existing goals changed.", flush=True)
