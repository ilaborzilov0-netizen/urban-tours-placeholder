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
  const goal = name => { try { window.ym(110906734, 'reachGoal', 'hypno_malahov_' + name, { variant: 'malahov_tv_990' }); } catch (_) {} };
  const dialog = document.getElementById('order-dialog');
  let opener;
  document.querySelectorAll('[data-order]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    goal('cta');
  }));
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (opener) opener.focus();
  });
  const video = document.getElementById('expert-video');
  let started = false;
  video.addEventListener('play', () => { if (!started) { goal('video_play'); started = true; } });
  video.addEventListener('ended', () => goal('video_complete'));
  const showError = () => { document.getElementById('video-error').hidden = false; };
  video.addEventListener('error', showError);
  video.querySelector('source').addEventListener('error', showError);
  document.querySelector('.tv-watch').addEventListener('click', () => goal('video_link'));
  document.querySelectorAll('.faq-list details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.open) document.querySelectorAll('.faq-list details').forEach(other => { if (other !== detail) other.open = false; });
  }));
  document.getElementById('year').textContent = new Date().getFullYear();
})();
