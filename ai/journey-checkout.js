/* Checkout validation events record error state, never contacts or messages. */
(()=>{'use strict';if(!/^\/ai\/?$/.test(location.pathname))return;
const track=window.aiJourneyTrack;if(typeof track!=='function')return;
const form=document.getElementById('predfinal-checkout-form');
form?.addEventListener('submit',()=>{
 const email=form.querySelector('input[type="email"]');
 if(email&&!email.checkValidity())track('ai_checkout_email_invalid',{section:'checkout',field:'email'});
},true);
const msg=document.getElementById('predfinal-checkout-status');
if(!msg)return;
let badBefore=false;
const check=()=>{
 const bad=!msg.hidden&&!msg.classList.contains('is-success')&&Boolean(msg.textContent.trim());
 if(bad&&!badBefore)track('ai_checkout_validation_error',{section:'checkout'});
 badBefore=bad;
};
new MutationObserver(check).observe(msg,{attributes:true,attributeFilter:['hidden','class'],childList:true,characterData:true,subtree:true});
})();
