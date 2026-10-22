#!/usr/bin/env python3
"""Aggregate historical Metrika sources, Oct 13-16. Read-only, no user-level data."""
import os,json,urllib.parse,urllib.request,urllib.error
token=os.environ.get("YANDEX_METRIKA_OAUTH","").strip()
headers={"Authorization":"OAuth "+token,"Accept":"application/json"}
base="https://api-metrika.yandex.net/"
def request(path,params=None):
    url=base+path+("?" + urllib.parse.urlencode(params) if params else "")
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=35) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"error":{"http":e.code,"provider_message":e.read().decode('utf8','replace')[:220]}}
    except Exception as e:
        return {"error":{"type":type(e).__name__}}
def report(label,dimensions,metrics,filter_expr=None):
    params={"ids":"110906734","date1":"2026-10-13","date2":"2026-10-16",
        "dimensions":dimensions,"metrics":metrics,"accuracy":"1","limit":"100"}
    if filter_expr:params["filters"]=filter_expr
    data=request("stat/v1/data",params)
    if "error" in data:
        print("METRIKA_ERROR",label,json.dumps(data["error"],ensure_ascii=False));return
    out=[]
    for r in data.get("data",[]):
        dims=[{"name":d.get("name"),"id":d.get("id")} for d in r.get("dimensions",[])]
        out.append({"dimensions":dims,"metrics":r.get("metrics")})
    print("METRIKA_REPORT",label,json.dumps({"total_rows":data.get("total_rows"),"rows":out[:70]},ensure_ascii=False))
if not token:
    print("METRIKA_ERROR no token");raise SystemExit(0)
report("CAMPAIGN_DAY","ym:s:date,ym:s:lastDirectClickOrder",
       "ym:s:visits,ym:s:users")
report("CAMPAIGN_14_ADS","ym:s:lastDirectClickOrder,ym:s:lastDirectClickBanner",
       "ym:s:visits,ym:s:users","ym:s:date=='2026-10-14'")
report("CAMPAIGN_14_AI","ym:s:lastDirectClickOrder,ym:s:lastDirectClickBanner",
       "ym:s:visits,ym:s:users","ym:s:date=='2026-10-14' AND ym:s:startURLPath=='/ai/'")
report("CAMPAIGN_14_PLACEMENTS","ym:s:lastDirectClickOrder,ym:s:lastDirectPlatformType",
       "ym:s:visits,ym:s:users","ym:s:date=='2026-10-14' AND ym:s:startURLPath=='/ai/'")
report("SUCCESS_GOAL_14","ym:s:lastDirectClickOrder",
       "ym:s:visits,ym:s:goal671017826reaches","ym:s:date=='2026-10-14' AND ym:s:startURLPath=='/ai/'")
goals=request("management/v1/counter/110906734/goals")
if "error" in goals:print("METRIKA_GOALS_ERROR",goals["error"])
else:
    found=[{"id":g.get("id"),"name":g.get("name"),"type":g.get("type")} for g in goals.get("goals",[])
        if any(k in (g.get("name") or "").lower() for k in ["оплат","покуп","order","pay","банк","заказ","sale","purchase"])]
    print("METRIKA_PAYMENT_GOALS",json.dumps(found[:30],ensure_ascii=False))
