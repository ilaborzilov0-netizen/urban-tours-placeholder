#!/usr/bin/env python3
"""Read-only audit of Metrika 110906734 goals. No changes are made."""
import json,os,sys,urllib.request
counter="110906734"
token=os.environ.get("YANDEX_METRIKA_OAUTH","").strip()
if not token: sys.exit("MISSING_OAUTH")
req=urllib.request.Request("https://api-metrika.yandex.net/management/v1/counter/"+counter+"/goals",headers={"Authorization":"OAuth "+token,"Accept":"application/json"},method="GET")
with urllib.request.urlopen(req,timeout=35) as r: goals=json.load(r).get("goals",[])
print("COUNTER",counter,"TOTAL",len(goals),flush=True)
for g in sorted(goals,key=lambda x:(x.get("id") or 0)):
    cond=[{"type":c.get("type"),"url":c.get("url")} for c in g.get("conditions",[]) if isinstance(c,dict)]
    print("GOAL",json.dumps({"goal_id":g.get("id"),"name":g.get("name"),"type":g.get("type"),"conditions":cond,"goal_source":g.get("goal_source"),"status":g.get("status")},ensure_ascii=False),flush=True)
print("INVENTORY_COMPLETE",len(goals),flush=True)
