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
# Verify current funnel's actual JavaScript event targets (read-only).
catalog=json.load(open("ai/goals.json",encoding="utf-8"))["goals"]
active_ids=[
  "ai_demo_view","ai_guitar_play","ai_guitar_50","ai_guitar_90","ai_guitar_complete",
  "ai_estrada_play","ai_estrada_50","ai_estrada_90","ai_estrada_complete",
  "ai_modern_play","ai_modern_50","ai_modern_90","ai_modern_complete",
  "ai_pricing_view","ai_hero_tariffs_click",
  "ai_plan_1990_click","ai_plan_2990_click","ai_plan_4490_click",
  "ai_checkout_open","ai_checkout_email_valid",
  "ai_pay_click_1990","ai_pay_click_2990","ai_pay_click_4490",
  "ai_order_created_1990","ai_order_created_2990","ai_order_created_4490",
  "ai_bank_redirect_1990","ai_bank_redirect_2990","ai_bank_redirect_4490",
  "ai_purchase_1990","ai_purchase_2990","ai_purchase_4490",
  "ai_order_create_error","ai_bank_payment_failed",
  "ai_album1_tracks","ai_album2_tracks","ai_reviews_view"
]
server_ids={c.get("url") for g in goals if g.get("type")=="action" for c in g.get("conditions",[]) if isinstance(c,dict) and c.get("type")=="exact"}
configured_ids={item["id"] for item in catalog}
missing_catalog=sorted(set(active_ids)-configured_ids)
missing_server=sorted(set(active_ids)-server_ids)
print("CURRENT_FUNNEL_GOALS",len(active_ids),"CATALOG_MATCH",len(missing_catalog)==0,"METRIKA_MATCH",len(missing_server)==0,flush=True)
print("MISSING_FROM_METRIKA",missing_server,flush=True)
print("INVENTORY_COMPLETE",len(goals),flush=True)
if missing_catalog or missing_server: sys.exit("MISSING_ACTIVE_GOALS")
