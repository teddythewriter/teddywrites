(() => {
  const input = document.querySelector('#post-filter');
  const status = document.querySelector('#post-filter-status');
  if (!input || !status) return;

  const groups = [...document.querySelectorAll('.year-group')];
  const items = [...document.querySelectorAll('.archive-item')];

  const update = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;

    items.forEach((item) => {
      const haystack = item.dataset.search || item.textContent;
      const matches = !query || haystack.toLocaleLowerCase().includes(query);
      item.hidden = !matches;
      if (matches) visible += 1;
    });

    groups.forEach((group) => {
      group.hidden = !group.querySelector('.archive-item:not([hidden])');
    });

    status.textContent = query
      ? `${visible} ${visible === 1 ? 'entry' : 'entries'} found`
      : '';
  };

  input.addEventListener('input', update);
})();
