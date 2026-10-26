#!/usr/bin/env python3
"""Read-only inventory for Studio funnel and Webvisor. No user details, no mutations."""
import json,os,sys,urllib.request,urllib.error
TOKEN=os.getenv("YANDEX_METRIKA_OAUTH","").strip()
if not TOKEN:
    sys.exit("MISSING_YANDEX_METRIKA_OAUTH")
BASE="https://api-metrika.yandex.net/management/v1/counter/110906734"
def request(endpoint):
    req=urllib.request.Request(BASE+endpoint,headers={"Authorization":"OAuth "+TOKEN,"Accept":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)
    except urllib.error.HTTPError as e:sys.exit("METRIKA_HTTP_"+str(e.code)+" "+endpoint)
goals=request("/goals").get("goals",[])
if not isinstance(goals,list):sys.exit("INVALID_GOALS")
print("STUDIO_INVENTORY_TOTAL",len(goals),"QUOTA_FREE",200-len(goals))
from collections import Counter
names=Counter()
for g in goals:
    n=g.get("name","")
    if "КЛАССИКА" in n.upper():names["classic"]+=1
    elif "СТУДИЯ" in n.upper():names["studio"]+=1
    elif n.startswith("AI") or str(n).startswith("АИ"):names["ai"]+=1
    else:names["other"]+=1
print("STUDIO_INVENTORY_TYPES",json.dumps(dict(names),ensure_ascii=False))
for g in goals:
    name=g.get("name","")
    if "СТУДИЯ" in name.upper() or "КЛАССИКА" in name.upper():
        ids=[c.get("url") for c in g.get("conditions",[]) if c.get("type")=="exact"]
        print("CURRENT_GOAL",json.dumps({"id":g.get("id"),"name":name,"events":ids},ensure_ascii=False))
counter=request("").get("counter",{})
safe={
    "id":counter.get("id"),"status":counter.get("status"),"site":counter.get("site"),
    "webvisor":counter.get("webvisor"),
    "visor":(counter.get("code_options") or {}).get("visor"),
    "clickmap":(counter.get("code_options") or {}).get("clickmap"),
    "code_options":{k:v for k,v in (counter.get("code_options") or {}).items() if k in ("visor","clickmap","track_links","accurate_track_bounce")},
}
print("STUDIO_COUNTER_CONFIGURATION",json.dumps(safe,ensure_ascii=False))
print("INVENTORY_PASS")
