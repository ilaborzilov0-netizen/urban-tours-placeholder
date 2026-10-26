
/* Galleries use all ten user-provided images; these are presentation mockups, not verified buyer testimonials. */
(() => {
"use strict";
const assetRoot="/ai/avtor/60/test/1/assets/people/";
const people=[
 ["За домашним столом","Спокойный разговор"],
 ["Один на один с собой","Обычный день"],
 ["Вечером дома","Знакомые мысли"],
 ["В своей комнате","Другая перспектива"],
 ["У кухонного окна","Время подумать"],
 ["Дома, без спешки","Музыка рядом"],
 ["В привычной обстановке","Свой выбор"],
 ["В дороге","Несколько минут для себя"],
 ["После работы","Без лишних слов"],
 ["За чашкой чая","Новый взгляд"]
];
const galleryStories=[
 {name:"Сергей, 54",detail:"Курил 31 год · Бросал 4 раза",quote:"Слушаю по утрам за чаем. На 9-й день впервые не потянулся за сигаретой после завтрака."},
 {name:"Андрей, 39",detail:"Курю только в стрессе",quote:"Брал скептически. Через неделю заметил, что в напряжённые моменты уже не тянусь автоматически."},
 {name:"Виктор, 61",detail:"Курил с 17 лет",quote:"Думал, в моём возрасте уже поздно. Слушаю вечером. Стало спокойнее, тяга слабее."},
 {name:"Максим, 34",detail:"Бросал 6 раз",quote:"Каждый раз срывался через 2–3 недели. Сейчас слушаю уже 18 дней. Пока держусь."},
 {name:"Игорь, 47",detail:"Курю больше 20 лет",quote:"Раньше после еды — сразу на балкон. Теперь включаю трек. Уже две недели без автоматизма."},
 {name:"Артём, 28",detail:"Курю 9 лет · Хочу бросить до 30",quote:"Молодой, но уже тяжело. Слушаю в наушниках. Пока помогает не срываться по вечерам."},
 {name:"Дмитрий, 42",detail:"Скептик",quote:"Не верил в песни. Взял из интереса. На 11-й день понял, что после обеда уже не тянет."},
 {name:"Роман, 45",detail:"Курю в машине и на работе",quote:"Самое сложное было — дорога. Теперь вместо сигареты включаю альбом. Стало заметно легче."},
 {name:"Алексей, 51",detail:"Курил 27 лет",quote:"После смены всегда сразу курил. Сейчас слушаю в гараже. Уже 14 дней без сигарет."},
 {name:"Николай, 58",detail:"Бросал 3 раза",quote:"Последний раз сорвался два года назад. Решил попробовать по-другому. Слушаю утром. Пока идёт ровнее."}
];
const photo=(i)=>assetRoot+"person-"+String(i+1).padStart(2,"0")+".webp";
const safe=(str)=>str.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const config={
  1:{kicker:"ДЕСЯТЬ ИСТОРИЙ О ЗНАКОМЫХ ПРИВЫЧКАХ",headline:"У каждого своя история.<br><em>Знакомые моменты.</em>",intro:"Кофе утром, стресс, дорога, вечер дома — ситуации, в которых каждый может узнать себя. Имена, фотографии и реплики здесь собирательные, а не подтверждённые отзывы покупателей.",className:"pg-one"},
  2:{kicker:"ЛИСТАЙТЕ ФОТОГРАФИИ",headline:"Музыка рядом.<br><em>В любом возрасте.</em>",intro:"Посмотрите, как можно подать один и тот же альбом в жизни разных поколений.",className:"pg-two"},
  3:{kicker:"ФОТОАЛЬБОМ · РЕДАКЦИОННАЯ ПОДАЧА",headline:"Обычные люди.<br><em>Необычный альбом.</em>",intro:"Никакой сцены и глянцевых героев: знакомые комнаты, рабочие дни и музыкальная идея.",className:"pg-three"}
};
function heading(n){
 const c=config[n];
 return '<div class="pg-inner"><header class="pg-heading"><div><div class="pg-kicker">'+c.kicker+'</div><h2>'+c.headline+'</h2></div><p>'+c.intro+'</p></header></div>';
}
function caption(i,variant){return variant===2?'<small>'+String(i+1).padStart(2,"0")+' / 10</small>'+safe(people[i][0]):variant===3?'<small>КАДР '+String(i+1).padStart(2,"0")+'</small>'+safe(people[i][0]):safe(people[i][0]);}
function image(i,lazy=true){
 return '<img src="'+photo(i)+'" alt="Иллюстрация: '+safe(people[i][0])+', человек держит альбом с зелёной обложкой" loading="'+(lazy?'lazy':'eager')+'" width="820" height="1080">';
}
function note(){
 return '<p class="pg-note pg-inner">Фотографии иллюстрируют оформление альбома. Это не отзывы и не подтверждение покупок.</p>';
}
function renderOne(root){
 const cards=galleryStories.map((story,i)=>'<figure class="pg-item" '+(i>2?'hidden':'')+'><div class="pg-photo">'+image(i,i>2)+'</div><figcaption class="pg-caption pg-profile"><strong class="pg-person">'+safe(story.name)+'</strong><span class="pg-detail">'+safe(story.detail)+'</span><blockquote class="pg-quote">«'+safe(story.quote)+'»</blockquote></figcaption></figure>').join("");
 root.innerHTML=heading(1)+'<div class="pg-inner"><div class="pg-grid">'+cards+'</div><div class="pg-expand-wrap"><button class="pg-action pg-expand" type="button" aria-expanded="false">Показать ещё 7 историй <span aria-hidden="true">↓</span></button></div></div>';
 const button=root.querySelector(".pg-expand"),extra=[...root.querySelectorAll(".pg-item")].slice(3);
 button.addEventListener("click",()=>{
  const open=button.getAttribute("aria-expanded")!=="true";
  extra.forEach(el=>el.hidden=!open);
  button.setAttribute("aria-expanded",String(open));
  button.innerHTML=open?'Свернуть истории <span aria-hidden="true">↑</span>':'Показать ещё 7 историй <span aria-hidden="true">↓</span>';
 });
}
function renderTwo(root){
 const cards=people.map((_,i)=>'<figure class="pg-item"><div class="pg-photo">'+image(i,i>1)+'</div><figcaption class="pg-caption">'+caption(i,2)+'</figcaption></figure>').join("");
 root.innerHTML=heading(2)+'<div class="pg-rail" tabindex="0" role="region" aria-label="Листаемая фотогалерея">'+cards+'</div><div class="pg-inner"><div class="pg-rail-control"><div class="pg-counter" aria-live="polite">01 / 10</div><div style="display:flex;gap:9px"><button class="pg-prev" type="button" aria-label="Предыдущее фото">←</button><button class="pg-next" type="button" aria-label="Следующее фото">→</button></div></div></div>'+note();
 const rail=root.querySelector(".pg-rail"),items=[...rail.querySelectorAll(".pg-item")],counter=root.querySelector(".pg-counter");
 const current=()=>{const left=rail.getBoundingClientRect().left;let best=0,dist=Infinity;items.forEach((el,i)=>{const d=Math.abs(el.getBoundingClientRect().left-left-26);if(d<dist){dist=d;best=i;}});return best;};
 const scrollToIndex=index=>{items[Math.max(0,Math.min(people.length-1,index))].scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});};
 root.querySelector(".pg-prev").addEventListener("click",()=>scrollToIndex(current()-1));
 root.querySelector(".pg-next").addEventListener("click",()=>scrollToIndex(current()+1));
 let frame=0;rail.addEventListener("scroll",()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{counter.textContent=String(current()+1).padStart(2,"0")+" / 10";});},{passive:true});
}
function renderThree(root){
 const cards=people.map((_,i)=>'<button type="button" class="pg-item pg-select" data-index="'+i+'" aria-label="Увеличить фото '+(i+1)+'"><div class="pg-photo">'+image(i,i>1)+'</div><div class="pg-caption">'+caption(i,3)+'</div></button>').join("");
 root.innerHTML=heading(3)+'<div class="pg-inner"><div class="pg-masonry">'+cards+'</div></div>'+note()+
 '<dialog class="pg-viewer"><div class="pg-viewer-content"><div class="pg-viewer-top"><span class="pg-viewer-count">01 / 10</span><button class="pg-viewer-close" type="button">Закрыть ✕</button></div><img class="pg-viewer-image" alt="Фотография человека с альбомом"><div class="pg-viewer-bottom"><button type="button" class="pg-viewer-prev">← Назад</button><span class="pg-viewer-title"></span><button type="button" class="pg-viewer-next">Далее →</button></div></div></dialog>';
 const dialog=root.querySelector("dialog"),big=root.querySelector(".pg-viewer-image"),counter=root.querySelector(".pg-viewer-count"),title=root.querySelector(".pg-viewer-title");
 let index=0;
 const update=i=>{index=(i+10)%10;big.src=photo(index);big.alt="Большая фотография: "+people[index][0];title.textContent=people[index][0];counter.textContent=String(index+1).padStart(2,"0")+" / 10";};
 root.querySelectorAll(".pg-select").forEach(b=>b.addEventListener("click",()=>{update(Number(b.dataset.index));dialog.showModal();}));
 root.querySelector(".pg-viewer-close").addEventListener("click",()=>dialog.close());
 root.querySelector(".pg-viewer-prev").addEventListener("click",()=>update(index-1));
 root.querySelector(".pg-viewer-next").addEventListener("click",()=>update(index+1));
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"){e.preventDefault();update(index-1);}if(e.key==="ArrowRight"){e.preventDefault();update(index+1);}});
}
function mount(){
 document.querySelectorAll("[data-people-gallery]").forEach(root=>{
  const variant=Number(root.getAttribute("data-people-gallery"))||1;
  root.classList.add("pg-root",config[variant]?.className||"pg-one");
  if(variant===2)renderTwo(root);else if(variant===3)renderThree(root);else renderOne(root);
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();