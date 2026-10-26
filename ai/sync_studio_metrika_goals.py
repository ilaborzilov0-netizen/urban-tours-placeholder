#!/usr/bin/env python3
"""Add only missing Studio JavaScript goals to Metrika; never edit/delete older goals."""
import json,os,time,sys,urllib.request,urllib.error
from pathlib import Path
cfg=json.loads(Path("ai/studio-goals.json").read_text("utf-8"))
goals=cfg["goals"]
token=os.environ.get("YANDEX_METRIKA_OAUTH","").strip()
mode=os.environ.get("METRIKA_SYNC_MODE","check")
if not token:sys.exit("MISSING_YANDEX_METRIKA_OAUTH")
if mode not in ("check","apply"):sys.exit("INVALID_MODE")
if len(goals)!=33 or len(set(g["id"] for g in goals))!=33 or len(set(g["name"] for g in goals))!=33:sys.exit("INVALID_STUDIO_CATALOG")
if any(not g["id"].startswith("studio_") or not g["name"].startswith("СТУДИЯ — ") for g in goals):sys.exit("INVALID_STUDIO_PREFIX")
url=f'https://api-metrika.yandex.net/management/v1/counter/{cfg["counter_id"]}/goals'
def api(method,payload=None):
    data=json.dumps(payload,ensure_ascii=False).encode("utf8") if payload else None
    headers={"Authorization":"OAuth "+token,"Accept":"application/json"}
    if data:headers["Content-Type"]="application/json"
    for attempt in range(5):
        req=urllib.request.Request(url,data=data,headers=headers,method=method)
        try:
            with urllib.request.urlopen(req,timeout=30) as f:return json.load(f)
        except urllib.error.HTTPError as ex:
            if ex.code in (429,500,502,503,504) and attempt<4:
                time.sleep(2*(attempt+1));continue
            raise RuntimeError("METRIKA_HTTP_"+str(ex.code)) from None
        except (TimeoutError,urllib.error.URLError):
            if attempt<4:
                time.sleep(2*(attempt+1));continue
            raise RuntimeError("METRIKA_UNREACHABLE") from None
def inventory():
    return api("GET").get("goals",[])
def event_matches(g,id):
    return g.get("type")=="action" and any(c.get("type")=="exact" and c.get("url")==id for c in g.get("conditions",[]))
current=inventory()
missing=[];reused=[];conflicts=[]
for g in goals:
    same_id=[v for v in current if event_matches(v,g["id"])]
    same_name=[v for v in current if v.get("name")==g["name"]]
    if len(same_id)==1 and len(same_name)==1 and same_id[0].get("id")==same_name[0].get("id"):
        reused.append(g);continue
    if same_id or same_name:conflicts.append(g["id"])
    else:missing.append(g)
print("STUDIO_GOALS",mode,"existing",len(current),"missing",len(missing),"reused",len(reused),"conflicts",len(conflicts),"free",200-len(current),flush=True)
if conflicts:sys.exit("STUDIO_GOAL_CONFLICT_ABORT:"+",".join(conflicts))
if len(current)+len(missing)>200:sys.exit("NOT_ENOUGH_FREE_GOAL_SLOTS")
if mode=="check":
    print("STUDIO_DRY_RUN_PASS",flush=True)
    sys.exit(0)
for i,g in enumerate(missing,1):
    try:
        result=api("POST",{"goal":{"name":g["name"],"type":"action","conditions":[{"type":"exact","url":g["id"]}]}})
        if not result.get("goal",{}).get("id"):raise RuntimeError("BAD_GOAL_CREATE_RESULT")
        print("STUDIO_CREATED",i,len(missing),g["id"],result["goal"]["id"],flush=True)
    except Exception as ex:
        matches=[v for v in inventory() if event_matches(v,g["id"]) and v.get("name")==g["name"]]
        if len(matches)==1:
            print("STUDIO_ALREADY_CREATED_AFTER_ERROR",g["id"],flush=True)
        else:sys.exit("STUDIO_CREATE_FAILED:"+g["id"]+":"+str(ex))
    time.sleep(.3)
final=inventory()
unverified=[g["id"] for g in goals if len([v for v in final if event_matches(v,g["id"]) and v.get("name")==g["name"]])!=1]
print("STUDIO_FINAL_TOTAL",len(final),"GOALS_VERIFIED",len(goals)-len(unverified),"EXPECTED",len(goals),"MISSING",unverified,flush=True)
if unverified:sys.exit("STUDIO_SYNC_INCOMPLETE")
print("STUDIO_SYNC_SUCCESS",flush=True)
