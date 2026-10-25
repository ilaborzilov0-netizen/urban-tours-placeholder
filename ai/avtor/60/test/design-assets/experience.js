/* Shared presentation-only interaction across three 55+ visual concepts. */
const ALBUM_TRACKS=[
  [
    "Жизнь станет лучше",
    "О том, что отказ — не наказание и не потеря любимой части жизни. Как представить обычный день, в котором сигарета больше не занимает центральное место."
  ],
  [
    "Кофе остаётся",
    "Сигарета часто кажется частью удовольствия от кофе. Песня предлагает отделить удовольствие от напитка и самой паузы от привычки закурить."
  ],
  [
    "Не с понедельника",
    "О бесконечном откладывании решения: «после выходных», «после праздников», «когда станет спокойнее». Что происходит в этом внутреннем торге."
  ],
  [
    "Мне нужна пауза",
    "Про ощущение, что сигарета даёт отдых. Потребность в паузе реальна — но сам перекур не единственный способ её получить."
  ],
  [
    "Тише внутри",
    "О том, как напряжение и ожидание сигареты могут восприниматься как одна и та же потребность. Песня про поиск спокойствия без автоматического перекура."
  ],
  [
    "Компания остаётся",
    "Как не привязывать общение, встречи и отдых с друзьями к обязательной сигарете. Люди и разговоры остаются, даже если ритуал меняется."
  ],
  [
    "Не проверять",
    "Про опасную мысль: «Одну выкурю и проверю, зависим ли я ещё». Зачем замечать такой торг и не превращать проверку в новую привычку."
  ],
  [
    "Скука пройдёт",
    "Почему пустая минута кажется поводом закурить. О возможности прожить скуку и заполнить паузу не только сигаретой."
  ],
  [
    "Я не с нуля",
    "О личном опыте и прежних попытках бросить. Даже если получилось не сразу, человек уже многое узнал о своей привычке."
  ],
  [
    "Своим голосом",
    "Как перестать повторять внутренние оправдания сигареты и начать замечать собственное решение, потребности и причины отказаться."
  ],
  [
    "Обычный день",
    "Кофе, дорога, работа, обед и отдых без привычного перекура. Песня о том, как новым может стать самый обыкновенный день."
  ],
  [
    "Дальше",
    "О будущем после последней сигареты: не героическая борьба каждый день, а постепенное возвращение к другим интересам и обычной жизни."
  ]
];
const CHAPTERS=[["01","Иллюзии курения","Удовольствие, пауза и вечное «потом»."],["02","Внутренний торг","Стресс, привычка и оправдания."],["03","После сигареты","Новые ответы в обычной жизни."]];
const DEMO_URL="/ai/assets/life-gets-better-demo-20261008.mp3";
function safeText(s){return String(s).replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
function renderTracks(){for(const target of document.querySelectorAll('[data-tracks]')){
  let items='';for(let k=0;k<3;k++){
    const titles=ALBUM_TRACKS.slice(k*4,k*4+4).map(([name,desc],j)=>{const num=k*4+j+1;return `<details class="song-row" ${num===1?'open':''}><summary><span class="song-index">${String(num).padStart(2,'0')}</span><span class="song-title">${safeText(name)}</span><span class="song-mark" aria-hidden="true">+</span></summary><div class="song-detail"><span>О ЧЁМ ЭТОТ ТРЕК</span><p>${safeText(desc)}</p>${num===1?'<button class="song-demo js-play" type="button"><span class="play-label">▶ Послушать 30 секунд</span></button>':''}</div></details>`}).join('');
    items+=`<section class="chapter" aria-label="${CHAPTERS[k][1]}"><div class="chapter-head"><span class="chapter-num">${CHAPTERS[k][0]} / 03</span><h3>${CHAPTERS[k][1]}</h3><p>${CHAPTERS[k][2]}</p></div><div class="song-list">${titles}</div></section>`;
  }target.innerHTML=items;}
}
function wire(){
 const audio=document.getElementById('sample-audio');
 const modal=document.getElementById('order-modal');
 function render(){const isPlaying=!audio.paused&&!audio.ended;for(const el of document.querySelectorAll('.js-play')){const label=el.querySelector('.play-label');if(label)label.textContent=isPlaying?'Ⅱ Остановить':'▶ Послушать 30 секунд';el.setAttribute('aria-pressed',String(isPlaying));}}
 document.addEventListener('click',async event=>{
  const play=event.target.closest('.js-play');if(play){if(!audio.paused){audio.pause();return;}if(audio.currentTime>=29.95)audio.currentTime=0;try{await audio.play()}catch(e){const label=play.querySelector('.play-label');if(label)label.textContent='Не удалось запустить. Повторите.'}return;}
  if(event.target.closest('.js-buy')){modal?.showModal();return;}
  if(event.target.closest('.js-modal-close')){modal?.close();return;}
  if(event.target===modal)modal.close();
 });
 audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=30){audio.pause();audio.currentTime=0;}});
 for(const name of ['play','pause','ended'])audio.addEventListener(name,render);
 document.addEventListener('toggle',e=>{const details=e.target;if(details?.matches('.song-row')&&details.open){for(const other of document.querySelectorAll('.song-row[open]'))if(other!==details)other.open=false;}},true);
}
renderTracks();wire();