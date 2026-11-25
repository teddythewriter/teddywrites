/* Homepage opening line: show a random hand-picked line, and swap it on "Show me another". */

/**
 * Pick the next entry index. Never returns `current` when there are two or more entries.
 * `current` is -1 on the first pick, when any index is allowed.
 */
function pickNext(length, current, rand) {
  if (length <= 1) return 0;
  if (current < 0 || current >= length) return Math.floor(rand() * length) % length;
  const slot = Math.floor(rand() * (length - 1)) % (length - 1);
  return slot >= current ? slot + 1 : slot;
}

if (typeof module !== "undefined") module.exports = { pickNext };

(function () {
  if (typeof document === "undefined") return;
  const data = document.getElementById("opening-lines");
  if (!data) return;
  let entries;
  try { entries = JSON.parse(data.textContent); } catch (error) { return; }
  if (!Array.isArray(entries) || entries.length === 0) return;

  const el = {};
  document.querySelectorAll("[data-ol]").forEach(function (node) { el[node.dataset.ol] = node; });
  if (!el.line || !el.read || !el.label || !el.title) return;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = entries.findIndex(function (entry) { return entry.url === el.read.getAttribute("href"); });

  function render(entry) {
    el.label.textContent = entry.form ? entry.form + " · " + entry.date : entry.date;
    el.line.textContent = entry.line;
    el.line.setAttribute("lang", entry.lang);
    el.title.setAttribute("href", entry.url);
    if (entry.lang === "si") el.title.setAttribute("lang", "si"); else el.title.removeAttribute("lang");
    el.title.replaceChildren(Object.assign(document.createElement("strong"), { textContent: entry.title }));
    el.read.setAttribute("href", entry.url);
    el.read.textContent = entry.form ? "Read the " + entry.form.toLowerCase() : "Read it";
  }

  let fading = false;

  function show(index, animate) {
    if (index === current) return;
    current = index;
    if (!animate || reduceMotion) { render(entries[index]); return; }
    fading = true;
    el.line.classList.add("is-fading");
    window.setTimeout(function () {
      render(entries[index]);
      el.line.classList.remove("is-fading");
      fading = false;
    }, 180);
  }

  show(pickNext(entries.length, -1, Math.random), false);
  // Announce swaps only after the silent first pick, so screen readers don't read the line on load.
  el.line.setAttribute("aria-live", "polite");

  if (entries.length >= 2 && el.another) {
    el.another.hidden = false;
    el.another.addEventListener("click", function () {
      if (fading) return;
      show(pickNext(entries.length, current, Math.random), true);
    });
  }
})();
