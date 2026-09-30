(() => {
  const player = document.querySelector('.ambient-player');
  if (!player) return;
  const audio = player.querySelector('audio');
  const button = player.querySelector('button');
  const volume = player.querySelector('input');
  const status = player.querySelector('[role="status"]');
  const key = 'teddywrites-rain';
  let wanted = false;
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(key)) || {}; } catch (_) {}
  audio.volume = Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume)) : .2;
  volume.value = Math.round(audio.volume * 100);
  volume.setAttribute('aria-valuetext', `${volume.value} percent`);
  const persist = () => {
    try { sessionStorage.setItem(key, JSON.stringify({ playing: wanted, volume: audio.volume })); } catch (_) {}
  };
  const render = () => {
    button.textContent = audio.paused ? 'Play rain' : 'Pause rain';
    button.setAttribute('aria-pressed', String(!audio.paused));
  };
  const play = async () => {
    try {
      await audio.play();
      if (!wanted || document.hidden) audio.pause();
      status.textContent = '';
    } catch (error) {
      if (error.name !== 'AbortError') {
        status.textContent = error.name === 'NotAllowedError' ? 'Press Play rain to resume.' : 'Rain could not load. Press Play rain to retry.';
      }
    }
    render();
  };
  button.addEventListener('click', () => {
    wanted = audio.paused;
    if (wanted) play(); else audio.pause();
    persist();
  });
  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    volume.setAttribute('aria-valuetext', `${volume.value} percent`);
    persist();
  });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('error', () => { status.textContent = 'Rain is unavailable. Please try again later.'; render(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause(); else if (wanted) play();
  });
  window.addEventListener('pagehide', () => { persist(); audio.pause(); });
  window.addEventListener('pageshow', event => { if (event.persisted && wanted && !document.hidden) play(); });
  player.hidden = false;
  render();
  // Resume only a previously opted-in session; never start for first-time visitors.
  wanted = saved.playing === true && !(navigator.connection && navigator.connection.saveData);
  if (wanted && !document.hidden) play();
})();
