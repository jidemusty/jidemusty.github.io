document.querySelectorAll("pre").forEach((pre) => {
  pre.tabIndex = 0;
  const block = document.createElement("div");
  block.className = "code-block";
  pre.before(block);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-code";
  button.textContent = "Copy code";
  const status = document.createElement("p");
  status.className = "code-copy-status";
  status.setAttribute("role", "status");
  status.dataset.errorMessage =
    "Could not copy. Select and copy the code instead.";
  const message = document.createElement("span");
  status.append(message);
  block.append(button, pre, status);
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Copying...";
    try {
      await navigator.clipboard.writeText(pre.textContent);
      message.textContent = "Code copied.";
    } catch (error) {
      console.error("Could not copy the code example.", error);
      message.textContent = status.dataset.errorMessage;
    } finally {
      button.disabled = false;
      button.textContent = "Copy code";
    }
  });
});
