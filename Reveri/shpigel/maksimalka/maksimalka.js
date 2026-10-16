'use strict';
(() => {
  if (typeof window.ym !== 'function') {
    window.ym = function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const tag = document.createElement('script'); tag.async = true;
    tag.src = 'https://mc.yandex.ru/metrika/tag.js?id=110906734'; document.head.appendChild(tag);
    window.ym(110906734, 'init', { webvisor: true, clickmap: true, accurateTrackBounce: true, trackLinks: true });
  }
  const goal = name => { try { window.ym(110906734, 'reachGoal', name, { variant: 'spiegel_maksimalka_990' }); } catch (_) {} };
  const dialog = document.getElementById('order-dialog');
  let opener;
  document.querySelectorAll('[data-order]').forEach(button => button.addEventListener('click', () => {
    opener = button; if (!dialog.open) dialog.showModal(); document.body.classList.add('modal-open'); goal('hypno_maximum_cta');
  }));
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (opener) opener.focus(); });
  const video = document.getElementById('sp-video');
  const play = document.getElementById('sp-play');
  const error = document.getElementById('sp-video-error');
  const shell = video.closest('.sp-video-shell');
  const badge = document.getElementById('sp-dub-badge');
  let mode = 'ru'; let tracked = false; let restore = null;
  const setTracks = () => { for (const track of video.textTracks) track.mode = mode === 'en' ? 'showing' : 'disabled'; };
  const showError = () => { error.hidden = false; };
  play.addEventListener('click', async () => {
    error.hidden = true;
    try { await video.play(); video.focus(); } catch (_) { showError(); }
  });
  video.addEventListener('loadedmetadata', async () => {
    setTracks();
    if (!restore) return;
    const saved = restore; restore = null;
    video.currentTime = Math.min(saved.time, Math.max(0, video.duration - 0.1));
    if (saved.playing) { try { await video.play(); } catch (_) { showError(); } }
  });
  video.addEventListener('play', () => {
    shell.dataset.started = 'true';
    if (!tracked) { goal('hypno_maximum_video_play'); tracked = true; }
  });
  video.addEventListener('ended', () => goal('hypno_maximum_video_complete'));
  video.addEventListener('error', showError);
  video.querySelector('source').addEventListener('error', showError);
  document.querySelectorAll('[data-video-mode]').forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.videoMode; if (next === mode) return;
    restore = { time: video.currentTime || 0, playing: !video.paused };
    video.pause(); mode = next; error.hidden = true;
    document.querySelectorAll('[data-video-mode]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    video.querySelector('source').src = mode === 'ru' ? './assets/adapted-ru.mp4' : 'https://www.reveri.com/assets/david-intro-4.mp4';
    badge.textContent = mode === 'ru' ? 'РЕКЛАМНАЯ АДАПТАЦИЯ · RU' : 'ОРИГИНАЛ · РУССКИЕ СУБТИТРЫ';
    video.load(); setTracks(); goal('hypno_maximum_video_' + mode);
  }));
  setTracks();
  document.querySelectorAll('.faq-list details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.open) document.querySelectorAll('.faq-list details').forEach(other => { if (other !== detail) other.open = false; });
  }));
  document.getElementById('year').textContent = new Date().getFullYear();
})();
