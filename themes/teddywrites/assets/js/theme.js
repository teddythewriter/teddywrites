(() => {
  const button = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-nav');
  if (!button || !navigation) return;
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    navigation.classList.toggle('is-open', !open);
  });
})();
(() => {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const key = 'teddywrites-theme';
  const render = () => {
    const light = root.dataset.theme === 'light';
    toggle.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    if (meta) meta.content = light ? '#EFEBD4' : '#232A2E';
  };
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(key, root.dataset.theme); } catch (_) {}
    render();
  });
  toggle.hidden = false;
  render();
})();
