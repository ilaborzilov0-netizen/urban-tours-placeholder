#!/usr/bin/env python3
import os,json,urllib.request,urllib.parse,datetime
from zoneinfo import ZoneInfo
base="https://api-metrika.yandex.net"
token=os.environ["YANDEX_METRIKA_OAUTH"]
counter="110906734"
expr="ym:s:startURLPath=='/ai/' AND ym:s:bounce=='No'"
name="AI /ai/ — неотказные визиты"
def req(path,params=None,body=None):
 url=base+path+("?" + urllib.parse.urlencode(params) if params else "")
 data=json.dumps(body,ensure_ascii=False).encode() if body else None
 headers={"Authorization":"OAuth "+token,"Accept":"application/json"}
 if data:headers["Content-Type"]="application/json"
 with urllib.request.urlopen(urllib.request.Request(url,data=data,headers=headers),timeout=40) as r:return json.load(r)
today=datetime.datetime.now(ZoneInfo("Europe/Moscow")).date()
for days in (7,30):
 stats=req("/stat/v1/data",{"ids":counter,"date1":str(today-datetime.timedelta(days=days-1)),"date2":str(today),"metrics":"ym:s:users,ym:s:visits","accuracy":"1","filters":expr})
 print("WINDOW",days,"UNIQUE_VISITORS",stats.get("totals",[None,None])[0],"NONBOUNCE_VISITS",stats.get("totals",[None,None])[1],flush=True)
path="/management/v1/counter/"+counter+"/apisegment/segments"
all_segments=req(path).get("segments",[])
matched=[x for x in all_segments if x.get("expression")==expr and x.get("status")=="active"]
if matched:
 segment=matched[0]
 print("REUSED",segment.get("segment_id"),flush=True)
else:
 segment=req(path,body={"segment":{"name":name,"expression":expr}})["segment"]
 print("CREATED",segment.get("segment_id"),flush=True)
assert any(x.get("segment_id")==segment.get("segment_id") for x in req(path).get("segments",[]))
print("SUCCESS_SEGMENT_ID",segment["segment_id"],flush=True)
