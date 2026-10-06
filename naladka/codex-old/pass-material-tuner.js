/* owner:pass-material-tuner-0363
   Locked production material preset for the final ticket.
   Mode: slab. Level: 5/10. No tuner UI. */
(function(){
  'use strict';
  if(window.__BZPassMaterialPreset0363)return;
  window.__BZPassMaterialPreset0363=true;

  var ticket=document.querySelector('#bz1092-product-commercial-late .pricing-register__register');
  if(!ticket)return;

  function rgba(rgb,a){return 'rgba('+rgb+','+Math.max(0,Math.min(1,a)).toFixed(3)+')';}
  function px(n){return Math.round(n*10)/10+'px';}
  function styleSlab(t){
    var shadowA=.045+.13*t, contact=.025+.08*t, edge=.15+.18*t, hi=.17+.20*t;
    return {
      transform:'translate3d(0,'+px(-1.2*t)+',0)',
      border:rgba('108,110,114',.24+.16*t),
      bg:'linear-gradient(180deg,rgb(246,244,240) 0%,rgb(236,233,228) 100%)',
      shadow:'0 '+px(2+7*t)+' '+px(6+22*t)+' '+rgba('8,26,32',shadowA)+', 0 '+px(1+2*t)+' '+px(2+5*t)+' '+rgba('8,26,32',contact)+', 0 1px 0 '+rgba('255,255,255',.46+.25*t)+' inset, 0 -1px 0 '+rgba('108,110,114',.09+.13*t)+' inset',
      surface:'linear-gradient(180deg,'+rgba('255,255,255',hi)+' 0%,'+rgba('255,255,255',.02+.04*t)+' 18%,rgba(255,255,255,0) 38%,'+rgba('68,73,78',.03+.05*t)+' 100%), repeating-linear-gradient(90deg,'+rgba('255,255,255',.022+.02*t)+' 0 2px,'+rgba('94,99,104',.02+.018*t)+' 2px 4px)',
      edge:rgba('101,104,109',edge),
      edgeHeight:px(2+2.5*t),
      edgeShadow:'0 '+px(1+2*t)+' '+px(2+4*t)+' '+rgba('8,26,32',.04+.08*t),
      filter:'none'
    };
  }

  var styles=styleSlab(0.5);
  var s=ticket.style;
  s.setProperty('--bz-pass-material-transform',styles.transform);
  s.setProperty('--bz-pass-material-border',styles.border);
  s.setProperty('--bz-pass-material-bg',styles.bg);
  s.setProperty('--bz-pass-material-shadow',styles.shadow);
  s.setProperty('--bz-pass-material-surface',styles.surface);
  s.setProperty('--bz-pass-material-edge',styles.edge);
  s.setProperty('--bz-pass-material-edge-height',styles.edgeHeight);
  s.setProperty('--bz-pass-material-edge-shadow',styles.edgeShadow);
  s.setProperty('--bz-pass-material-filter',styles.filter);
  ticket.setAttribute('data-bz-pass-material-mode','slab');
  ticket.setAttribute('data-bz-pass-material-level','5');
})();
