(()=>{
'use strict';
// An original audiovisual, browser-rendered explainer. No external video file and
// no prerecorded/natural voice. Narration is optional browser-native Russian TTS.
// Scene timecodes are editorial guides: TTS may read at a different pace.
const DURATION=380;
const scenes=[
 {t:0,label:'01 / ВСТУПЛЕНИЕ',heading:'Не сила воли. Другой взгляд на сигарету.'},
 {t:25,label:'02 / ДВЕ СТОРОНЫ ЗАВИСИМОСТИ',heading:'Физиология — и привычные мысли.'},
 {t:52,label:'03 / АВТОМАТИЧЕСКИЕ МЫСЛИ',heading:'Один кофе. Одна привычная мысль.'},
 {t:85,label:'04 / ПРИНЦИП ДОМИНАНТЫ',heading:'Всё снова напоминает о сигарете.'},
 {t:130,label:'05 / КАК МЫСЛИ СТАНОВЯТСЯ СВОИМИ',heading:'То, что повторяется, становится знакомым.'},
 {t:165,label:'06 / ДВЕ ДОРОЖКИ',heading:'Рядом со старым появляется новый ответ.'},
 {t:220,label:'07 / ЗАЧЕМ НУЖНА МУЗЫКА',heading:'Музыка помогает возвращаться к смыслу.'},
 {t:270,label:'08 / ДВА АЛЬБОМА',heading:'До отказа. И после отказа.'},
 {t:340,label:'09 / ЗАКЛЮЧЕНИЕ',heading:'Не волшебство. Возможность ответить иначе.'}
];
const cues=[
 [0,'Если вы уже не раз пытались бросить курить и каждый раз возвращались, это не означает, что вы слабый человек.'],
 [13,'Возможно, вы просто пытались бороться не только с зависимостью, но и с привычными мыслями. Сейчас объясню идею аудиоякорей.'],
 [25,'У курения есть две стороны: физическая зависимость от никотина и привычные психологические связи.'],
 [39,'Физическая тяга часто особенно заметна в начале отказа и постепенно ослабевает. Но знакомые ситуации продолжают напоминать о сигарете.'],
 [52,'Кофе — значит сигарета. Стресс — надо закурить. Это мой отдых. Одна сигарета ничего не изменит.'],
 [65,'Такие оправдания повторялись годами. Иногда они приходят в голову ещё до того, как человек успел подумать.'],
 [78,'Кажется, будто другого ответа просто нет.'],
 [85,'Физиолог Алексей Ухтомский описывал принцип доминанты — устойчивого очага возбуждения, который организует внимание и реакцию.'],
 [102,'Если привычка курить занимает важное место в жизни, пауза, кофе и напряжение могут снова и снова напоминать именно о ней.'],
 [117,'Это полезная аналогия: привычный ответ становится первым, который вспоминается. Но он не единственный возможный.'],
 [130,'Психолог Лев Выготский изучал, как внешняя речь и культурные смыслы становятся частью внутреннего мышления человека.'],
 [143,'Идея аудиоякорей опирается на простой принцип: осмысленную фразу легче вспомнить, когда она знакома и много раз встречалась.'],
 [157,'И здесь на помощь приходит музыкальный повтор.'],
 [165,'Мы не пытаемся закодировать человека музыкой. Мы предлагаем другие ответы на старые оправдания сигареты.'],
 [179,'Раньше было так: кофе — значит нужно закурить. А новый ответ звучит иначе: мне нужна пауза, а не дым.'],
 [194,'Человек слушает, потом снова слушает. Знакомые слова постепенно легче приходят в голову.'],
 [207,'И в очередной привычный момент может появиться выбор: не идти автоматически по старой дорожке.'],
 [220,'Музыка здесь — приятный способ возвращаться к важным словам без многочасовых лекций.'],
 [234,'Вы замечали: песня, которую часто слышите, потом сама вспоминается в течение дня?'],
 [248,'Аудиоякорь устроен похоже: знакомая мелодия помогает вспомнить текст. И нужный ответ может прийти в голову даже без наушников.'],
 [263,'Но повторение само по себе не гарантирует отказ. Оно помогает работать с собственным отношением к курению.'],
 [270,'В программе два музыкальных альбома, каждый для своего этапа.'],
 [282,'Первый — «До последней сигареты». Его можно слушать, пока вы ещё курите: разбираться с убеждениями и собственным решением.'],
 [300,'Второй — «Жизнь без сигарет». К нему особенно полезно возвращаться в первые дни и в знакомые моменты: кофе, стресс, перерыв.'],
 [321,'Выбирайте трек по ситуации и музыку по своему вкусу. Никакой сложной инструкции и обязательных многочасовых занятий.'],
 [340,'Это не волшебство и не гарантия результата. Это простой способ регулярно напоминать себе другой взгляд на сигарету.'],
 [354,'Человек может перестать воспринимать её как единственную награду или способ отдохнуть. И выбирать не курить становится понятнее.'],
 [366,'На сайте можно послушать пример и оставить заявку на музыкальные альбомы. Начните с того звучания, которое вам действительно нравится.']
].map(([t,text])=>({t,text,scene:Math.max(0,scenes.findLastIndex(s=>s.t<=t))}));
const $=id=>document.getElementById(id);
const el={
 movie:$('movie'), play:$('play'),bigPlay:$('big-play'),restart:$('restart'),seek:$('seek'),
 t:$('time-current'),label:$('stage-label'),heading:$('stage-heading'),
 subs:$('subtitles'), voice:$('voice'),cc:$('captions'),full:$('fullscreen'),
 hint:$('hint'),transcript:$('transcript-body')
};
const hasSpeech=!!(window.speechSynthesis&&window.SpeechSynthesisUtterance);
let playing=false,elapsed=0,voiceEnabled=false,voiceTouched=false,startedOnce=false,currentCue=-1,lastFrame=0,raf=0;
let isVoiceUtterance=false,seekRevision=0,speechGeneration=0,actualWatch=0,watch75Reported=false;
const isReduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function notifyParent(name,details={}){
 try{window.parent?.postMessage({type:'ai-video-event',name,details},location.origin)}catch(_){}
}
function clock(n){n=Math.max(0,Math.floor(n));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function findIndex(t,arr){let i=0;for(let k=0;k<arr.length;k++)if(t>=arr[k].t)i=k;return i}
function ruVoice(){const voices=window.speechSynthesis?.getVoices?.()||[];return voices.find(v=>/^ru([-_]|$)/i.test(v.lang))||null}
function cancelVoice(){speechGeneration++;isVoiceUtterance=false;if(hasSpeech){try{speechSynthesis.cancel()}catch(_){}}}
function speakCue(index){
 if(!playing||!voiceEnabled||!hasSpeech)return;
 const voice=ruVoice();
 if(!voice){
  voiceEnabled=false;updateVoiceButton();el.hint.textContent='На устройстве нет русского голоса для браузерной озвучки. Видеоряд и субтитры продолжают работать без неё.';
  return;
 }
 const g=++speechGeneration;
 const utter=new SpeechSynthesisUtterance(cues[index].text);
 utter.lang='ru-RU';utter.voice=voice;utter.rate=.89;utter.pitch=.91;utter.volume=1;
 utter.onstart=()=>{if(g===speechGeneration)isVoiceUtterance=true};
 utter.onerror=()=>{if(g===speechGeneration){isVoiceUtterance=false;voiceEnabled=false;updateVoiceButton()}};
 utter.onend=()=>{if(g===speechGeneration)isVoiceUtterance=false};
 try{speechSynthesis.cancel();speechSynthesis.speak(utter)}catch(_){voiceEnabled=false;updateVoiceButton()}
}
function render(t,force=false){
 elapsed=Math.max(0,Math.min(DURATION,t));
 const cue=findIndex(elapsed,cues),scene=findIndex(elapsed,scenes);
 const prevScene=Number(el.movie.dataset.scene);
 if(force||prevScene!==scene){
  el.movie.dataset.scene=String(scene);
  el.label.textContent=scenes[scene].label;
  el.heading.textContent=scenes[scene].heading;
 }
 if(force||currentCue!==cue){
  currentCue=cue;
  el.subs.textContent=cues[cue].text;
  if(playing&&voiceEnabled)speakCue(cue);
 }
 el.t.textContent=clock(elapsed);
 el.seek.value=String(Math.round(elapsed));
 el.seek.style.setProperty('--progress',String(elapsed/DURATION*100)+'%');
}
function updateVoiceButton(){
 el.voice.setAttribute('aria-pressed',String(voiceEnabled));
 el.voice.innerHTML=(voiceEnabled?'◉ <span>Голос вкл.</span>':'◌ <span>Голос выкл.</span>');
}
function updatePlayButton(){
 el.movie.classList.toggle('is-playing',playing);
 el.play.innerHTML=playing?'Ⅱ <span>Пауза</span>':'▶ <span>Пуск</span>';
 el.play.setAttribute('aria-label',playing?'Пауза':'Воспроизвести видеоразбор');
}
function tick(now){
 if(!playing)return;
 if(!lastFrame)lastFrame=now;
 const delta=Math.min(.2,(now-lastFrame)/1000);
 actualWatch+=delta;
 if(!watch75Reported&&actualWatch>=285){watch75Reported=true;notifyParent('ai1414_video_75')}
 lastFrame=now;
 // A fixed editorial timeline ensures the 6:20 cut works even without TTS.
 const next=Math.min(DURATION,elapsed+delta);
 render(next);
 if(elapsed>=DURATION){if(actualWatch>=340)notifyParent('ai1414_video_complete');pause();return}
 raf=requestAnimationFrame(tick);
}
function play(){
 if(playing)return;
 if(elapsed>=DURATION)render(0,true);
 if(!startedOnce && !voiceTouched && hasSpeech && ruVoice()){
  voiceEnabled=true;updateVoiceButton();
 }
 if(!startedOnce)notifyParent('ai1414_video_start');
 startedOnce=true;
 playing=true;
 lastFrame=0;
 updatePlayButton();
 render(elapsed,true);
 raf=requestAnimationFrame(tick);
}
function pause(){
 if(!playing)return;
 playing=false;lastFrame=0;cancelAnimationFrame(raf);cancelVoice();updatePlayButton();
}
function seek(t){
 const was=playing;
 cancelVoice();
 currentCue=-1;
 render(t,true);
 if(!was)return;
 lastFrame=0;
}
el.play.addEventListener('click',()=>playing?pause():play());
el.bigPlay.addEventListener('click',()=>play());
el.restart.addEventListener('click',()=>{seek(0);if(!playing)play()});
el.seek.addEventListener('input',e=>{seek(Number(e.target.value))});
el.voice.addEventListener('click',()=>{
 voiceTouched=true;
 if(!hasSpeech){el.hint.textContent='Этот браузер не поддерживает озвучку. Используйте субтитры.';return}
 if(!voiceEnabled&&!ruVoice()){el.hint.textContent='Русский голос на устройстве не найден. Воспроизведение с субтитрами работает без него.';return}
 voiceEnabled=!voiceEnabled;cancelVoice();updateVoiceButton();
 if(playing&&voiceEnabled)speakCue(findIndex(elapsed,cues));
});
el.cc.addEventListener('click',()=>{
 const show=el.movie.classList.toggle('hide-captions')===false;
 el.cc.setAttribute('aria-pressed',String(show));
});
el.full.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else if(el.movie.requestFullscreen)await el.movie.requestFullscreen();
  else if(el.movie.webkitEnterFullscreen)el.movie.webkitEnterFullscreen();
 }catch(_){el.hint.textContent='Полноэкранный режим недоступен в этом браузере.'}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause()});
window.addEventListener('pagehide',()=>{if(playing)pause()});
try{
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  if(event.data?.type==='ai-theme'){
   const t=event.data.theme;
   el.movie.dataset.theme=typeof t==='string'?t:'dark';
  }
  if(event.data?.type==='ai-motion'){
   el.movie.classList.toggle('motion-off',!event.data.enabled);
  }
  if(event.data?.type==='ai-vision'){
   el.movie.classList.toggle('vision-mode',!!event.data.enabled);
  }
 });
}catch(_){}
let transcriptMarkup='';
for(let k=0;k<scenes.length;k++){
 const sub=cues.filter(c=>c.scene===k).map(c=>'<p>'+c.text+'</p>').join('');
 transcriptMarkup+='<h3>'+scenes[k].label+' · '+clock(scenes[k].t)+'</h3>'+sub;
}
el.transcript.innerHTML=transcriptMarkup;
if(!hasSpeech)el.hint.textContent='Видеоряд и субтитры доступны. На этом устройстве нет встроенного голосового воспроизведения.';
else el.hint.textContent='Для русской озвучки нажмите «Голос выкл.». Качество голоса зависит от настроек устройства. Текст также доступен ниже.';
render(0,true);updatePlayButton();updateVoiceButton();
})();