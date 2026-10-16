'use strict';
(() => {
  if (typeof window.ym !== 'function') {
    window.ym = function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://mc.yandex.ru/metrika/tag.js?id=110906734';
    document.head.appendChild(tag);
    window.ym(110906734, 'init', { webvisor: true, clickmap: true, accurateTrackBounce: true, trackLinks: true });
  }
  const dialog = document.getElementById('order-dialog');
  let opener;
  const goal = name => {
    try { if (typeof window.ym === 'function') window.ym(110906734, 'reachGoal', name, { variant: 'reveri_990' }); } catch (_) {}
  };
  function closeDialog() { dialog.close(); }
  document.querySelectorAll('[data-order]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    goal('hypno_reveri_cta');
  }));
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeDialog));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (opener) opener.focus();
  });
  document.getElementById('contact-cta').addEventListener('click', () => goal('hypno_reveri_contact'));
  document.getElementById('year').textContent = new Date().getFullYear();
  const professorVideo = document.getElementById('professor-video-player');
  const professorPlay = document.getElementById('professor-play');
  const videoError = document.getElementById('video-error');
  if (professorVideo && professorPlay) {
    let trackedPlay = false;
    const showVideoError = () => { videoError.hidden = false; };
    professorPlay.addEventListener('click', async () => {
      videoError.hidden = true;
      professorVideo.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      try {
        await professorVideo.play();
        professorVideo.focus();
      } catch (_) { showVideoError(); }
    });
    professorVideo.addEventListener('loadedmetadata', () => {
      if (professorVideo.textTracks.length) professorVideo.textTracks[0].mode = 'showing';
    });
    professorVideo.addEventListener('play', () => {
      professorPlay.textContent = 'Видео воспроизводится ↓';
      if (!trackedPlay) { goal('hypno_reveri_video_play'); trackedPlay = true; }
    });
    professorVideo.addEventListener('pause', () => { professorPlay.textContent = 'Продолжить просмотр ▶'; });
    professorVideo.addEventListener('ended', () => {
      professorPlay.textContent = 'Посмотреть ещё раз ↻';
      goal('hypno_reveri_video_complete');
    });
    professorVideo.addEventListener('error', showVideoError);
    professorVideo.querySelector('source').addEventListener('error', showVideoError);
  }
  document.querySelectorAll('.faq-list details').forEach(detail => detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.faq-list details').forEach(other => { if (other !== detail) other.open = false; });
  }));
})();
