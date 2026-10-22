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

# Dedicated campaign audience: only sessions from Oct 21 2026 onward.
campaign_id="715285670"
since="2026-10-21"
campaign_expr=(f"ym:s:startURLPath=='/ai/' AND ym:s:bounce=='No' "
               f"AND ym:s:directClickOrder=='{campaign_id}' AND ym:s:date>='{since}'")
today_str=str(today)
stats=req("/stat/v1/data",{"ids":counter,"date1":since,"date2":today_str,
    "metrics":"ym:s:users,ym:s:visits","accuracy":"1","filters":campaign_expr})
counts=stats.get("totals",[])
print("CAMPAIGN_715285670_SINCE_OCT21_UNIQUE",counts[0] if counts else None,
      "VISITS",counts[1] if len(counts)>1 else None,flush=True)
campaign_name="AI /ai/ — неотказы 21.10+ — Директ 715285670"
all_segments=req(path).get("segments",[])
matched=[x for x in all_segments if x.get("expression")==campaign_expr and x.get("status")=="active"]
if matched:
    campaign_segment=matched[0]
    print("CAMPAIGN_REUSED",campaign_segment.get("segment_id"),flush=True)
else:
    same_name=[x for x in all_segments if x.get("name")==campaign_name and x.get("status")=="active"]
    if same_name:
        existing=same_name[0]
        update_url=base+"/management/v1/counter/"+counter+"/apisegment/segment/"+str(existing["segment_id"])
        payload=json.dumps({"segment":{"name":campaign_name,"expression":campaign_expr}},ensure_ascii=False).encode()
        request=urllib.request.Request(update_url,data=payload,headers={
            "Authorization":"OAuth "+token,"Accept":"application/json","Content-Type":"application/json"
        },method="PUT")
        try:
            with urllib.request.urlopen(request,timeout=40) as response:
                campaign_segment=json.load(response)["segment"]
        except urllib.error.HTTPError as error:
            print("CAMPAIGN_UPDATE_ERROR",error.code,error.read().decode("utf-8","replace")[:1400],flush=True)
            raise
        print("CAMPAIGN_UPDATED",campaign_segment.get("segment_id"),flush=True)
    else:
        campaign_segment=req(path,body={"segment":{"name":campaign_name,"expression":campaign_expr}})["segment"]
        print("CAMPAIGN_CREATED",campaign_segment.get("segment_id"),flush=True)
assert any(x.get("segment_id")==campaign_segment.get("segment_id") and x.get("expression")==campaign_expr for x in req(path).get("segments",[]))
print("CAMPAIGN_SUCCESS_SEGMENT_ID",campaign_segment["segment_id"],flush=True)

# Diagnostics: identify whether campaign matches any visits and which landing paths are used.
checks=[
 ("DIRECT_ID_ALL", "ym:s:directID=='715285670'", None),
 ("DIRECT_ORDER_ALL", "ym:s:directClickOrder=='715285670'", None),
 ("DIRECT_ID_NONBOUNCE", "ym:s:directID=='715285670' AND ym:s:bounce=='No'", "ym:s:startURLPath"),
 ("DIRECT_ORDER_NONBOUNCE", "ym:s:directClickOrder=='715285670' AND ym:s:bounce=='No'", "ym:s:startURLPath"),
 ("AI_NONBOUNCE_CAMPAIGNS", "ym:s:startURLPath=='/ai/' AND ym:s:bounce=='No'", "ym:s:directID"),
]
for label, f, dim in checks:
 try:
  params={"ids":counter,"date1":since,"date2":today_str,"metrics":"ym:s:users,ym:s:visits","accuracy":"1","filters":f,"limit":20}
  if dim: params["dimensions"]=dim
  raw=req("/stat/v1/data",params)
  print("DIAG",label,"TOTALS",raw.get("totals"),"DATA",
     [(str(x.get("dimensions",[]))[:220],x.get("metrics")) for x in raw.get("data",[])[:12]],flush=True)
 except Exception as e:
  print("DIAG_ERROR",label,str(e)[:400],flush=True)
