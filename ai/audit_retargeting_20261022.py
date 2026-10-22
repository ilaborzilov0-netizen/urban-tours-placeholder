#!/usr/bin/env python3
"""Read-only comparative report for two dates in Yandex Metrika. No mutations."""
import json,os,sys,urllib.request,urllib.parse,urllib.error
token=os.getenv("YANDEX_METRIKA_OAUTH","")
if not token: sys.exit("No read token available")
counter="110906734"
headers={"Authorization":"OAuth "+token,"Accept":"application/json"}
def get(url,params=None):
    if params:url+="?"+urllib.parse.urlencode(params)
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=50) as resp:
        return json.load(resp)
root="https://api-metrika.yandex.net/"
names=['ai_demo_view','ai_pricing_view','ai_checkout_open','ai_guitar_play','ai_estrada_play','ai_modern_play','ai_guitar_50','ai_estrada_50','ai_modern_50','ai_plan_1990_click','ai_plan_2990_click','ai_plan_4490_click','ai_bank_redirect_1990','ai_bank_redirect_2990','ai_hero_view']
goals=get(root+'management/v1/counter/'+counter+'/goals')['goals']
ids={c.get('url'):g.get('id') for g in goals for c in g.get('conditions',[]) if c.get('type')=='exact'}
print("METRIKA_DATES 2026-10-21 2026-10-22")
print("COUNTER_GOALS",len(goals),"MATCHED",sum(x in ids for x in names))
base={"ids":counter,"date1":"2026-10-21","date2":"2026-10-22","dimensions":"ym:s:date","accuracy":"1","limit":"15","sort":"ym:s:date","filters":"ym:s:startURLPath=='/ai/'"}
def report(label,metrics):
    try:
        data=get(root+"stat/v1/data",{**base,"metrics":",".join(metrics)})
        print("REPORT",label,"total_rows",len(data.get('data',[])))
        for row in data.get('data',[]):
            print("ROW",label,json.dumps({"date":row['dimensions'][0].get('name'),"values":dict(zip(metrics,row.get("metrics",[])))},ensure_ascii=False))
        if not data.get('data'):print("REPORT_EMPTY",label)
    except urllib.error.HTTPError as e:
        print("REPORT_ERROR",label,e.code,e.read().decode('utf8','replace')[:500])
    except Exception as e:
        print("REPORT_ERROR",label,type(e).__name__,str(e)[:250])
report("VISITS",["ym:s:visits","ym:s:users","ym:s:bounceRate","ym:s:avgVisitDurationSeconds"])
for i in range(0,len(names),5):
    group=[x for x in names[i:i+5] if x in ids]
    if not group:continue
    metrics=["ym:s:goal"+str(ids[x])+"users" for x in group]
    print("GOAL_CODES",json.dumps(dict(zip(group,metrics))))
    report("GOALS_"+str(i//5),metrics)
