/* deferred auxiliary analytics
   Yandex.Metrica is intentionally NOT initialized here.
   Canonical Metrika owner: #bz-metrika-eager-bootstrap in index.html.
*/
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","xpsxeyxojq");

/* Only /ai/: load optional detailed journey modules after legacy scripts. */
(function(){
 if(!/^\/ai\/?$/.test(location.pathname))return;
 const files=['core','views','actions','calculator','checkout','audio'];
 function next(index){
  if(index>=files.length)return;
  const node=document.createElement('script');
  node.src='/ai/journey-'+files[index]+'.js?v=20261022-v3';
  node.async=false;
  node.onload=()=>next(index+1);
  node.onerror=()=>{console.warn('AI analytics module unavailable:',files[index]);next(index+1)};
  document.head.appendChild(node);
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',()=>next(0),{once:true});
 else next(0);
})();
