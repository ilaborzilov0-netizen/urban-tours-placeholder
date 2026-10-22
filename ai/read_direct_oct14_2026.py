#!/usr/bin/env python3
"""Read-only Yandex Direct availability and October 14 campaign investigation.
Never logs tokens, account identifiers or user-level visitor data.
"""
import json,os,urllib.request,urllib.error,urllib.parse
TOKEN=os.environ.get("YANDEX_METRIKA_OAUTH","").strip()
CAMPAIGNS=[715203461,715285670]
def say(kind,val):
    print(kind,json.dumps(val,ensure_ascii=False,default=str),flush=True)
def post(service,body):
    url="https://api.direct.yandex.com/json/v501/"+service
    req=urllib.request.Request(url,data=json.dumps(body).encode("utf8"),
        headers={"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json; charset=utf-8",
        "Accept-Language":"ru"},method="POST")
    try:
        with urllib.request.urlopen(req,timeout=28) as res:
            data=json.load(res)
        if isinstance(data,dict) and "error" in data:
            e=data["error"];return {"error":{"code":e.get("error_code"),"str_code":e.get("error_string")}}
        return data
    except urllib.error.HTTPError as e:
        # Deliberately omit full provider message; may include account identifiers.
        return {"error":{"http":e.code,"reason":e.reason}}
    except Exception as e:
        return {"error":{"type":type(e).__name__}}
def main():
    if not TOKEN:
        say("ACCESS",{"status":"NO_OAUTH_TOKEN_IN_GITHUB_SECRETS"});return
    body={"method":"get","params":{
      "SelectionCriteria":{"Ids":CAMPAIGNS},
      "FieldNames":["Id","Name","Type","Status","State","StartDate"],
      "UnifiedCampaignFieldNames":["CounterIds","AttributionModel","BiddingStrategy","PriorityGoals","TrackingParams"]
    }}
    result=post("campaigns",body)
    if "error" in result:
        say("DIRECT_ACCESS",{"status":"ERROR","details":result["error"]})
        return
    camps=result.get("result",{}).get("Campaigns",[])
    say("DIRECT_ACCESS",{"status":"OK","found":len(camps)})
    for item in camps:
        say("DIRECT_CAMPAIGN_CURRENT",item)
    ch=post("changes",{"method":"checkCampaigns","params":{"Timestamp":"2026-10-13T00:00:00Z"}})
    if "error" in ch:
        say("DIRECT_CHANGES",{"status":"ERROR","details":ch["error"]})
    else:
        selected=[x for x in ch.get("result",{}).get("Campaigns",[]) if x.get("CampaignId") in CAMPAIGNS]
        say("DIRECT_CHANGES_SINCE_OCT13",{"changed_campaigns":selected,"note":"Only whether changed, NOT previous parameter values."})
    # Aggregated daily performance; no visitor-level PII, no ad mutations.
    report={"params":{
        "SelectionCriteria":{"DateFrom":"2026-10-13","DateTo":"2026-10-16",
        "Filter":[{"Field":"CampaignId","Operator":"IN","Values":[str(x) for x in CAMPAIGNS]}]},
        "FieldNames":["Date","CampaignId","CampaignName","Impressions","Clicks","Cost"],
        "ReportName":"AudioAnchorsOct14Readonly",
        "ReportType":"CUSTOM_REPORT","DateRangeType":"CUSTOM_DATE","Format":"TSV",
        "IncludeVAT":"YES","IncludeDiscount":"YES"
    }}
    url="https://api.direct.yandex.com/json/v501/reports"
    req=urllib.request.Request(url,data=json.dumps(report,ensure_ascii=False).encode("utf8"),
      headers={"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json; charset=utf-8",
      "Accept-Language":"ru","returnMoneyInMicros":"false","skipReportHeader":"true",
      "skipReportSummary":"true","processingMode":"online"},method="POST")
    try:
        with urllib.request.urlopen(req,timeout=40) as res:
            raw=res.read().decode("utf8","replace")
        # Limit output to the selected campaigns and modest read-only aggregates.
        say("DIRECT_DAILY_REPORT",{"first_lines":raw.splitlines()[:18]})
    except urllib.error.HTTPError as e:
        say("DIRECT_DAILY_REPORT",{"status":"ERROR","http":e.code})
    except Exception as e:
        say("DIRECT_DAILY_REPORT",{"status":"ERROR","type":type(e).__name__})
if __name__=="__main__":main()
