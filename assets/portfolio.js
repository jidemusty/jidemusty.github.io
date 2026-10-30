const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    root.classList.toggle(
      "pointer-navigation",
      event.detail > 0 && !link.classList.contains("skip-link"),
    );
  });
});

document.addEventListener("keydown", () => {
  root.classList.remove("pointer-navigation");
});

const copyButton = document.querySelector(".copy-email");
const copyStatus = document.querySelector(".copy-status");
const copyMessage = copyStatus.querySelector("span");
let resetTimer;
let resetRemaining = null;
let resetStartedAt = 0;

async function writeToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.opacity = "0";
  const focused = document.activeElement;
  document.body.append(field);

  try {
    field.focus({ preventScroll: true });
    field.select();
    if (!document.execCommand("copy")) {
      throw new Error("The browser rejected the clipboard operation.");
    }
  } finally {
    field.remove();
    if (focused instanceof HTMLElement) {
      focused.focus({ preventScroll: true });
    }
  }
}

function scheduleCopyReset() {
  if (document.hidden || resetRemaining === null || resetTimer !== undefined) {
    return;
  }
  resetStartedAt = performance.now();
  resetTimer = window.setTimeout(() => {
    resetTimer = undefined;
    resetRemaining = null;
    copyButton.textContent = "Copy email";
    copyMessage.textContent = "";
  }, resetRemaining);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && resetTimer !== undefined) {
    window.clearTimeout(resetTimer);
    resetTimer = undefined;
    resetRemaining = Math.max(
      0,
      resetRemaining - (performance.now() - resetStartedAt),
    );
  } else if (!document.hidden) {
    scheduleCopyReset();
  }
});

async function copyEmail() {
  const restoreFocus = document.activeElement === copyButton;
  window.clearTimeout(resetTimer);
  resetTimer = undefined;
  resetRemaining = null;
  copyButton.textContent = "Copying\u2026";
  copyMessage.textContent = "Copying email address.";
  copyButton.disabled = true;
  copyButton.setAttribute("aria-busy", "true");

  try {
    await writeToClipboard(copyButton.dataset.email);
    copyButton.textContent = "Copied";
    copyMessage.textContent = "Email address copied.";
    resetRemaining = 1800;
    scheduleCopyReset();
  } catch (error) {
    console.error("Could not copy email address.", error);
    copyButton.textContent = "Copy unavailable";
    copyMessage.textContent = copyStatus.dataset.errorMessage;
  } finally {
    copyButton.disabled = false;
    copyButton.removeAttribute("aria-busy");
    if (restoreFocus && document.activeElement === document.body) {
      copyButton.focus({ preventScroll: true });
    }
  }
}

copyButton.addEventListener("click", copyEmail);
copyButton.hidden = false;
document.querySelector(".email-fallback").hidden = true;

const projectDirectory = document.querySelector(".project-directory");

if (projectDirectory) {
  const list = projectDirectory.querySelector(".directory-list");
  const rows = [...list.children];
  const filterGroup = projectDirectory.querySelector(".project-filters");
  const filters = [...filterGroup.querySelectorAll("button")];
  const pagination = projectDirectory.querySelector(".pagination");
  const status = pagination.querySelector(".page-status");
  const previous = pagination.querySelector("[data-previous]");
  const next = pagination.querySelector("[data-next]");
  const empty = projectDirectory.querySelector(".directory-empty");
  const pageSize = 6;
  let category = "All";
  let page = 0;
  let pendingCategory = null;

  function renderProjects() {
    const matches = rows.filter(
      (row) => category === "All" || row.dataset.category === category,
    );
    const start = page * pageSize;
    const visible = matches.slice(start, start + pageSize);

    rows.forEach((row) => {
      row.hidden = !visible.includes(row);
      row.querySelector("details").open = false;
    });
    empty.hidden = matches.length > 0;
    status.textContent = matches.length
      ? `${start + 1}\u2013${Math.min(start + pageSize, matches.length)} of ${matches.length} projects`
      : "0 projects in this category";
    previous.disabled = page === 0;
    next.disabled = start + pageSize >= matches.length;
    filters.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === category),
      );
    });
  }

  function finishCategoryChange() {
    if (pendingCategory === null) return;
    category = pendingCategory;
    pendingCategory = null;
    page = 0;
    renderProjects();
    list.classList.remove("is-changing");
    list.removeAttribute("aria-busy");
  }

  function stopCategoryMotion() {
    list.classList.remove("has-filter-motion");
    finishCategoryChange();
  }

  function selectCategory(nextCategory, animate) {
    if (nextCategory === category && pendingCategory === null) return;
    pendingCategory = nextCategory;
    filters.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === nextCategory),
      );
    });

    const shouldAnimate =
      animate &&
      !reducedMotion.matches &&
      !document.hidden &&
      !root.classList.contains("theme-changing");
    list.classList.toggle("has-filter-motion", shouldAnimate);
    if (shouldAnimate && nextCategory !== category) {
      list.classList.add("is-changing");
      list.setAttribute("aria-busy", "true");
      previous.disabled = true;
      next.disabled = true;
      // Another selection can arrive before the fade-in gets its first frame.
      if (getComputedStyle(list).opacity === "0") finishCategoryChange();
    } else {
      finishCategoryChange();
    }
  }

  function finishListTransition(event) {
    if (event.target === list && event.propertyName === "opacity") {
      finishCategoryChange();
    }
  }

  list.addEventListener("transitionend", finishListTransition);
  list.addEventListener("transitioncancel", finishListTransition);
  projectDirectory.addEventListener("keydown", stopCategoryMotion);
  document
    .querySelector(".theme-toggle")
    .addEventListener("click", stopCategoryMotion);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) stopCategoryMotion();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCategoryMotion();
  });

  filters.forEach((button) => {
    button.addEventListener("click", (event) => {
      selectCategory(button.dataset.category, event.detail > 0);
    });
  });

  projectDirectory.querySelector("[data-clear]").addEventListener("click", () => {
    selectCategory("All", false);
    filters[0].focus();
  });

  function turnPage(offset) {
    page += offset;
    renderProjects();
    list.querySelector("li:not([hidden]) summary").focus({ preventScroll: true });
    list.scrollIntoView({ block: "start", behavior: "instant" });
  }

  previous.addEventListener("click", () => turnPage(-1));
  next.addEventListener("click", () => turnPage(1));
  renderProjects();
  filterGroup.hidden = false;
  pagination.hidden = false;
}
