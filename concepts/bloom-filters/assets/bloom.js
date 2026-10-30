// A 32-switch bloom filter using the same hashing as the Go version:
// FNV-1a 64, h1 = low 32 bits, h2 = high 32 bits forced odd,
// position_i = (h1 + i * h2) mod m.
const M = 32;
const K = 3;
const PRELOADED = ["alice", "bob", "erin"];
const VALID_NAME = /^[a-z0-9_]{3,20}$/;

const FNV_OFFSET = 14695981039346656037n;
const FNV_PRIME = 1099511628211n;
const MASK_64 = (1n << 64n) - 1n;

const bitsEl = document.getElementById("bits");
const form = document.getElementById("filter-form");
const input = document.getElementById("name-input");
const addButton = document.getElementById("add-button");
const resetButton = document.getElementById("reset-button");
const verdictEl = document.getElementById("verdict");
const addedEl = document.getElementById("added-names");
const onCountEl = document.getElementById("on-count");
const fpChanceEl = document.getElementById("fp-chance");

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const switches = new Array(M).fill(false);
const added = [];
const bitEls = [];

function fnv1a64(text) {
  let hash = FNV_OFFSET;
  for (const byte of new TextEncoder().encode(text)) {
    hash ^= BigInt(byte);
    hash = (hash * FNV_PRIME) & MASK_64;
  }
  return hash;
}

function positions(name) {
  const sum = fnv1a64(name);
  const h1 = sum & 0xffffffffn;
  const h2 = (sum >> 32n) | 1n;
  const out = [];
  for (let i = 0n; i < BigInt(K); i++) {
    out.push(Number((h1 + i * h2) % BigInt(M)));
  }
  return out;
}

function normalize(raw) {
  const name = raw.trim().toLowerCase();
  return VALID_NAME.test(name) ? name : null;
}

function buildBits() {
  for (let i = 0; i < M; i++) {
    const bit = document.createElement("span");
    bit.className = "bit is-off";
    bit.setAttribute("aria-hidden", "true");

    const lamp = document.createElement("span");
    lamp.className = "bit__lamp";

    const index = document.createElement("span");
    index.className = "bit__index";
    index.textContent = String(i);

    bit.append(lamp, index);
    bitsEl.append(bit);
    bitEls.push(bit);
  }
}

function setSwitch(i) {
  switches[i] = true;
  bitEls[i].classList.add("is-on");
  bitEls[i].classList.remove("is-off");
}

function addName(name) {
  positions(name).forEach(setSwitch);
  if (!added.includes(name)) {
    added.push(name);
  }
}

function formatList(names) {
  return names.length ? names.join(", ") : "none yet";
}

function updateFacts() {
  const on = switches.filter(Boolean).length;
  const chance = Math.pow(on / M, K) * 100;
  onCountEl.textContent = String(on);
  fpChanceEl.textContent = `${chance < 10 ? chance.toFixed(1) : Math.round(chance)}%`;
  addedEl.textContent = formatList(added);
  bitsEl.setAttribute("aria-label", `32 switches, ${on} on`);
}

function clearTargets() {
  bitEls.forEach((bit) => bit.classList.remove("is-target"));
}

function setVerdict(html, isMaybe = false) {
  verdictEl.innerHTML = html;
  verdictEl.classList.toggle("is-maybe", isMaybe);
}

function render() {
  clearTargets();
  const raw = input.value;

  if (raw.trim() === "") {
    addButton.disabled = true;
    setVerdict(
      "Type a name to see which three switches it hashes to. Try “carol”, then “zara”.",
    );
    return;
  }

  const name = normalize(raw);
  if (!name) {
    addButton.disabled = true;
    setVerdict("Use 3 to 20 characters: letters, numbers, or underscores.");
    return;
  }

  addButton.disabled = false;
  const pos = positions(name);
  pos.forEach((i) => bitEls[i].classList.add("is-target"));
  const list = pos.join(", ");
  const off = pos.filter((i) => !switches[i]);

  if (off.length > 0) {
    setVerdict(
      `<strong>Definitely free.</strong> “${name}” hashes to switches ${list}, and switch ${off[0]} is off.`,
    );
    return;
  }

  if (added.includes(name)) {
    setVerdict(
      `<strong>Maybe taken.</strong> Switches ${list} are all on. “${name}” was added, but the filter can’t tell that apart from a coincidence, so the database decides.`,
      true,
    );
    return;
  }

  setVerdict(
    `<strong>Maybe taken, but it isn’t.</strong> Switches ${list} were all turned on by other names. That’s a false positive: it costs one database query, never a wrong answer.`,
    true,
  );
}

function reset() {
  switches.fill(false);
  added.length = 0;
  bitEls.forEach((bit) => {
    bit.classList.remove("is-on");
    bit.classList.add("is-off");
  });
  PRELOADED.forEach(addName);
  updateFacts();
  render();
}

function playIntro() {
  if (reduceMotion) {
    PRELOADED.forEach(addName);
    updateFacts();
    return;
  }

  PRELOADED.forEach((name, i) => {
    window.setTimeout(() => {
      addName(name);
      updateFacts();
    }, 500 + i * 450);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = normalize(input.value);
  if (!name) {
    return;
  }
  addName(name);
  updateFacts();
  render();
});

input.addEventListener("input", render);
resetButton.addEventListener("click", () => {
  input.value = "";
  reset();
  input.focus();
});

buildBits();
updateFacts();
render();
playIntro();
