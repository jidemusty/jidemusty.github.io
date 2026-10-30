(() => {
  const preferenceKey = "portfolio.theme";
  const root = document.documentElement;
  let preference = null;
  let storageMessage = "";

  try {
    preference = window.localStorage.getItem(preferenceKey);
    if (preference !== null && preference !== "light" && preference !== "dark") {
      console.warn("Invalid saved portfolio theme:", preference);
      storageMessage = "The saved theme was invalid. Using dark mode.";
      preference = null;
    }
  } catch (error) {
    console.warn("Could not read the portfolio theme preference.", error);
    storageMessage = "Theme preferences cannot be read. Using dark mode.";
  }

  root.dataset.theme = preference || "dark";

  function syncBrowserColor() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    context.fillStyle = getComputedStyle(root).getPropertyValue("--background");
    context.fillRect(0, 0, 1, 1);
    const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    document.querySelector('meta[name="theme-color"]').content =
      `rgb(${rgb.join(", ")})`;
  }

  syncBrowserColor();

  document.addEventListener("DOMContentLoaded", () => {
    const controls = document.querySelector(".theme-controls");
    const button = controls.querySelector(".theme-toggle");
    const buttonLabel = button.querySelector(".theme-toggle-label");
    const status = controls.querySelector(".theme-status");

    function updateButton() {
      const label = root.dataset.theme === "dark" ? "Light mode" : "Dark mode";
      const action = `Switch to ${label.toLowerCase()}`;
      buttonLabel.textContent = label;
      button.setAttribute("aria-label", action);
      button.title = action;
    }

    function applyTheme(theme) {
      root.classList.add("theme-changing");
      root.dataset.theme = theme;
      updateButton();
      syncBrowserColor();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => root.classList.remove("theme-changing")),
      );
    }

    button.addEventListener("click", () => {
      const theme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      try {
        window.localStorage.setItem(preferenceKey, theme);
        status.hidden = true;
        status.textContent = "";
      } catch (error) {
        console.warn("Could not save the portfolio theme preference.", error);
        status.hidden = false;
        status.textContent =
          "Theme changed, but your preference could not be saved in this browser.";
        status.scrollIntoView({
          behavior: "instant",
          block: "nearest",
          inline: "nearest",
        });
      }
    });

    updateButton();
    status.hidden = !storageMessage;
    status.textContent = storageMessage;
    controls.hidden = false;
  });
})();
