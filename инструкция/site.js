
'use strict';(()=>{
window.audioConcept={current:'instruction',get returnUrl(){return location.origin+location.pathname}};
const goal=(event,opts={})=>{try{window.ym?.(110906734,'reachGoal','instruction_'+event,opts)}catch(_){}};
const scenes={
coffee:{old:'«Без сигареты кофе уже не тот».',answer:'«Кофе остаётся. Пауза — моя».',foot:'Вкус, отдых и время для себя можно исследовать отдельно от перекура.',title:'ПАУЗА\nОСТАЁТСЯ.',index:'01 / ВАШ КОФЕ'},
stress:{old:'«Мне тяжело. Надо покурить».',answer:'«Мне нужна пауза. Сигарета — не вся пауза».',foot:'Потребность отдохнуть реальна. Можно заметить её отдельно от привычного перекура.',title:'ВРЕМЯ\nДЛЯ СЕБЯ.',index:'02 / ПОСЛЕ СТРЕССА'},
one:{old:'«Всего одну. Она не считается».',answer:'«Желание — не приказ».',foot:'Знакомая мысль не обязана становиться действием. У вас остаётся пространство для выбора.',title:'ВЫБОР\nОСТАЁТСЯ.',index:'03 / МОМЕНТ ТОРГА'}
};
document.querySelectorAll('[data-scene-widget]').forEach(w=>w.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{const c=scenes[b.dataset.scene];if(!c)return;w.querySelectorAll('[data-scene]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));w.querySelector('[data-old]').textContent=c.old;w.querySelector('[data-new]').textContent=c.answer;w.querySelector('[data-scene-foot]').textContent=c.foot;w.querySelector('[data-scene-visual]').dataset.sceneVisual=b.dataset.scene;w.querySelector('.coffee-type').textContent=c.title;w.querySelector('.scene-index').textContent=c.index;goal('hero_scene',{scene:b.dataset.scene})})));
const scripts={today:['Отказ сегодня','Прочитайте первые ключи, выберите конкретный момент без следующей сигареты и подготовьте план на тягу. Не нужно ждать идеального состояния.'],later:['Подготовка 1–3 дня','Сегодня определите триггеры и познакомьтесь со стартовыми треками. Назначьте конкретный день отказа в ближайшие дни, а затем используйте SOS.']};
document.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-start]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const d=scripts[b.dataset.start],el=document.getElementById('route-output');el.querySelector('strong').textContent='Ваш сценарий: '+d[0];el.querySelector('p').textContent=d[1];goal('schedule',{mode:b.dataset.start})}));
const sos={coffee:['02 · Кофе остаётся','Кофе и пауза могут остаться вашими без сигареты.',2],stress:['04 · Мне нужна пауза','Сделайте паузу, отойдите от привычного места перекура и выберите безопасное действие.',4],one:['07 · Не проверять','Желание «всего одну» — не приказ и не повод проверять себя никотином.',7],boredom:['08 · Скука пройдёт','Пустую минуту не обязательно заполнять сигаретой.',8]};
document.querySelectorAll('[data-sos]').forEach(b=>b.addEventListener('click',()=>{const d=sos[b.dataset.sos];if(!d)return;document.querySelectorAll('[data-sos]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const p=document.getElementById('sos-copy');p.querySelector('h3').textContent=d[0];p.querySelector('p').textContent=d[1];document.getElementById('sos-anchor').href='#key-'+d[2];goal('sos_scene',{scene:b.dataset.sos})}));
const answers={ok:'Вы проходите этот момент без сигареты. Выберите следующее маленькое действие.',hard:'Тяга может быть сильной. Смените обстановку и, если нужно, попросите поддержки.',smoked:'Один эпизод не обнуляет попытку. Отметьте триггер и продолжайте план отказа.'};
document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('feedback-message').textContent=answers[b.dataset.answer]}));
document.querySelectorAll('.faq-list details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.faq-list details').forEach(x=>{if(x!==d)x.open=false})}));
const audio=document.getElementById('demo-audio'),btn=document.getElementById('demo-button'),bar=document.getElementById('demo-line'),count=document.getElementById('demo-time');
function sync(){const sec=Math.min(10,Math.max(0,audio.currentTime||0));bar.style.width=sec*10+'%';count.textContent=String(Math.floor(sec)).padStart(2,'0')+' / 10';btn.textContent=audio.paused?(audio.dataset.fallback==='yes'?'▶ Послушать пример другого трека':'▶ Послушать 10 секунд'):'Ⅱ Пауза';btn.setAttribute('aria-pressed',String(!audio.paused))}
audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=9.98){audio.pause();audio.currentTime=0}sync()});audio.addEventListener('pause',sync);audio.addEventListener('play',sync);audio.addEventListener('ended',()=>{audio.currentTime=0;sync()});
audio.addEventListener('error',()=>{if(audio.dataset.fallback)return;
 audio.dataset.fallback='yes';
 document.getElementById('demo-track-description').textContent='Новый фрагмент «Всё происходит» пока не опубликован. Можно послушать 10 секунд другого аудиоякоря — «Жизнь станет лучше».';
 document.getElementById('demo-error').textContent='Для нового трека файл ещё не загружен. Здесь временно играет пример другого трека.';
 document.getElementById('demo-error').hidden=false;
 audio.src='/ai/assets/life-gets-better-demo-20261008.mp3';
 audio.load();sync();
});
btn.addEventListener('click',async()=>{if(!audio.paused){audio.pause();return}try{await audio.play();goal('demo_play')}catch(e){document.getElementById('demo-error').hidden=false}});
sync();goal('view');
})();