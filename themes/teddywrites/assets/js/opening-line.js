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

  const stage = el.line.closest(".stage");
  const progress = stage && stage.querySelector(".stage-progress");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = entries.findIndex(function (entry) { return entry.url === el.read.getAttribute("href"); });

  // Each word becomes its own span so CSS can ink them in one after another.
  function inkLine(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const nodes = [];
    words.forEach(function (word, i) {
      if (i) nodes.push(document.createTextNode(" "));
      const span = document.createElement("span");
      span.className = "ink-word";
      span.style.setProperty("--i", String(i));
      span.textContent = word;
      nodes.push(span);
    });
    el.line.replaceChildren.apply(el.line, nodes);
  }

  function render(entry) {
    el.label.textContent = entry.form ? entry.form + " · " + entry.date : entry.date;
    if (reduceMotion) el.line.textContent = entry.line; else inkLine(entry.line);
    el.line.setAttribute("lang", entry.lang);
    el.title.setAttribute("href", entry.url);
    if (entry.lang === "si") el.title.setAttribute("lang", "si"); else el.title.removeAttribute("lang");
    el.title.replaceChildren(Object.assign(document.createElement("strong"), { textContent: entry.title }));
    el.read.setAttribute("href", entry.url);
    el.read.textContent = entry.form ? "Read the " + entry.form.toLowerCase() : "Read it";
  }

  let fading = false;

  function show(index, animate) {
    current = index;
    if (!animate || reduceMotion) { render(entries[index]); return; }
    fading = true;
    stage.classList.add("is-fading");
    window.setTimeout(function () {
      render(entries[index]);
      stage.classList.remove("is-fading");
      fading = false;
    }, 360);
  }

  show(pickNext(entries.length, -1, Math.random), false);
  // Announce swaps only after the silent first pick, so screen readers don't read the line on load.
  el.line.setAttribute("aria-live", "polite");

  if (entries.length < 2) return;

  // Auto-rotation: the progress bar's CSS animation is the clock. It pauses on hover,
  // focus, a hidden tab or the Pause button, and each time it ends the next line comes in.
  let paused = false;

  function restartClock() {
    if (!progress) return;
    progress.classList.remove("is-running");
    void progress.offsetWidth; // restart the CSS animation
    progress.classList.add("is-running");
  }

  function next(byUser) {
    if (fading) return;
    // Auto swaps stay quiet for screen readers; only a click is announced.
    el.line.setAttribute("aria-live", byUser ? "polite" : "off");
    show(pickNext(entries.length, current, Math.random), true);
    restartClock();
  }

  if (el.another) {
    el.another.hidden = false;
    el.another.addEventListener("click", function () { next(true); });
  }

  if (reduceMotion || !progress || !el.pause) return;

  function setPaused(value) {
    paused = value;
    stage.classList.toggle("is-paused", paused);
    el.pause.setAttribute("aria-pressed", String(paused));
    el.pause.textContent = paused ? "Resume" : "Pause";
  }

  el.pause.hidden = false;
  el.pause.addEventListener("click", function () { setPaused(!paused); });
  progress.addEventListener("animationend", function () { if (!paused) next(false); });
  document.addEventListener("visibilitychange", function () { stage.classList.toggle("is-hidden", document.hidden); });
  stage.classList.add("is-rotating");
  restartClock();
})();
