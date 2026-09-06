(() => {
  const input = document.querySelector('#post-filter');
  const status = document.querySelector('#post-filter-status');
  if (!input || !status) return;

  const groups = [...document.querySelectorAll('.posts-group')];
  const items = [...document.querySelectorAll('.post-item')];

  const update = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;

    items.forEach((item) => {
      const matches = !query || item.textContent.toLocaleLowerCase().includes(query);
      item.hidden = !matches;
      if (matches) visible += 1;
    });

    groups.forEach((group) => {
      group.hidden = !group.querySelector('.post-item:not([hidden])');
    });

    status.textContent = query
      ? `${visible} ${visible === 1 ? 'entry' : 'entries'} found`
      : '';
  };

  input.addEventListener('input', update);
})();
