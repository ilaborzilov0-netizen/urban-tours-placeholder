#!/usr/bin/env python3
"""Create only missing exact JavaScript goals for classic 990; never delete existing goals."""
import json,os,urllib.request,urllib.error,time,sys
from pathlib import Path
cfg=json.loads(Path("ai/classic-goals.json").read_text("utf8"))
target=cfg["goals"];token=os.getenv("YANDEX_METRIKA_OAUTH","").strip()
mode=os.getenv("METRIKA_SYNC_MODE","check")
if not token:sys.exit("MISSING_YANDEX_METRIKA_OAUTH")
if mode not in ("check","apply"):sys.exit("INVALID_MODE")
if len(target)!=36 or len({x["id"] for x in target})!=36:sys.exit("INVALID_CATALOG")
base=f'https://api-metrika.yandex.net/management/v1/counter/{cfg["counter_id"]}/goals'
headers={"Authorization":"OAuth "+token,"Accept":"application/json","Content-Type":"application/json"}
def api(method,url,payload=None):
 data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode("utf-8")
 for attempt in range(4):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,data=data,headers=headers,method=method),timeout=30) as f:
    return json.load(f)
  except urllib.error.HTTPError as e:
   if e.code in [429,502,503,504] and attempt<3:time.sleep(attempt*2+2);continue
   raise RuntimeError(f"HTTP_{e.code}_{method}")
def inventory():return api("GET",base).get("goals",[])
def event(g):
 if g.get("type")!="action":return []
 return [c.get("url") for c in g.get("conditions",[]) if c.get("type")=="exact"]
existing=inventory();by_id={}
for g in existing:
 for id in event(g):by_id.setdefault(id,[]).append(g)
missing=[];conflicts=[]
for g in target:
 old=by_id.get(g["id"],[])
 names=[e for e in existing if e.get("name")==g["name"]]
 if len(old)==1 and old[0].get("name")==g["name"] and len(names)==1:continue
 if old or names:conflicts.append(g["id"])
 else:missing.append(g)
print("CLASSIC_GOALS",mode,"existing_total",len(existing),"required",len(target),"already_correct",len(target)-len(missing)-len(conflicts),"missing",len(missing),"conflicts",conflicts,flush=True)
if conflicts:sys.exit("GOAL_CONFLICT")
if len(existing)+len(missing)>200:sys.exit("GOAL_QUOTA_EXCEEDED")
if mode=="check":sys.exit(0)
for g in missing:
 try:
  created=api("POST",base,{"goal":{"name":g["name"],"type":"action","conditions":[{"type":"exact","url":g["id"]}]}})
  if not created.get("goal",{}).get("id"):raise RuntimeError("INVALID_CREATE_RESPONSE")
  print("CREATED",g["id"],created["goal"]["id"],flush=True)
  time.sleep(.3)
 except Exception as e:
  # If server created a goal but the response failed, recheck rather than duplicate.
  if any(x.get("name")==g["name"] and g["id"] in event(x) for x in inventory()):continue
  print("ERROR",g["id"],str(e),flush=True)
  sys.exit("GOAL_CREATE_FAILED")
final=inventory()
bad=[g["id"] for g in target if len([x for x in final if x.get("name")==g["name"] and g["id"] in event(x)])!=1]
print("CLASSIC_GOALS_VERIFY",{"total":len(final),"configured":len(target),"missing":bad},flush=True)
if bad:sys.exit("GOAL_VERIFY_FAILED")
print("CLASSIC_GOALS_SYNC_SUCCESS",flush=True)
