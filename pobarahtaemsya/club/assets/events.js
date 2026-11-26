/* Only enter confirmed events here. Never put speculative dates or fake availability here.
   Each event: {id:"unique-id",product:"ludi|golos|delo|ii|zhizn|mysli",title:"...",start:"2026-12-03T19:00:00+03:00",end:"...",venue:"...",host:"...",status:"confirmed|sold_out|cancelled",price:"1 490 ₽"}
   A confirmed event needs an actual confirmed date, venue, host and price; dates are Moscow time.
   Counter ID: assign a separate real Yandex Metrika counter after creation. No smoking counter reuse.
   Contacts: set a verified club Telegram URL after creating it; empty retains the existing organizer contact.
   Payment is intentionally not configured until a real event and merchant checkout are verified. */
window.POBARAHTAEMSYA_CLUB = Object.freeze({metrikaId:null,clubTelegram:"",events:[]});