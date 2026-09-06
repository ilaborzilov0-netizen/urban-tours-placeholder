window.METHOD_OS_CONFIG = Object.freeze({
  apiBase: (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? ''
    : 'https://api.ne-sila-voli.online'
});
