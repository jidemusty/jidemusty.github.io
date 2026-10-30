const replayEvents = [
  {
    minute: 49,
    title: "Shot blocked",
    detail: "Marcus Bennett",
    score: [0, 1],
    projection: 0,
  },
  {
    minute: 57,
    title: "Goal",
    detail: "Montgomery-Wells assist",
    score: [0, 2],
    projection: 2,
  },
  {
    minute: 63,
    title: "Shot saved",
    detail: "Alejandro Fernández",
    score: [0, 2],
    projection: 1,
  },
  {
    minute: 68,
    title: "Goal",
    detail: "Marcus Bennett",
    score: [1, 2],
    projection: 0,
  },
];

const playButton = document.querySelector("#play-replay");
const resetButton = document.querySelector("#reset-replay");
const feed = document.querySelector("#event-feed");
const minute = document.querySelector("#match-time");
const homeScore = document.querySelector("#home-score");
const awayScore = document.querySelector("#away-score");
const status = document.querySelector("#replay-status");
const projectionValues = Array.from(document.querySelectorAll("[data-value]"));
let currentEvent = 0;
let timer;

function renderEvent(event) {
  const row = document.createElement("div");
  row.className =
    event.title === "Goal" ? "event-row event-row--goal" : "event-row";
  row.innerHTML = `
    <span>${event.minute}′</span>
    <div>
      <strong>${event.title}</strong>
      <small>${event.detail}</small>
    </div>
  `;

  feed.querySelector(".event-feed__empty")?.remove();
  feed.prepend(row);
  minute.textContent = `${event.minute}:00`;
  homeScore.textContent = event.score[0];
  awayScore.textContent = event.score[1];

  if (event.minute === 49 || event.minute === 68) {
    projectionValues[0].textContent = String(
      Number(projectionValues[0].textContent) + 1,
    );
  }
  if (event.projection === 1) projectionValues[1].textContent = "1";
  if (event.projection === 2) projectionValues[2].textContent = "1";
}

function finishReplay() {
  window.clearInterval(timer);
  timer = undefined;
  status.textContent = "Complete";
  playButton.textContent = "Fixture complete";
  playButton.disabled = true;
  resetButton.disabled = false;
}

function playReplay() {
  if (timer || currentEvent >= replayEvents.length) return;

  status.textContent = "Playing";
  playButton.textContent = "Running";
  resetButton.disabled = true;
  renderEvent(replayEvents[currentEvent]);
  currentEvent += 1;

  if (currentEvent >= replayEvents.length) {
    finishReplay();
    return;
  }

  timer = window.setInterval(() => {
    renderEvent(replayEvents[currentEvent]);
    currentEvent += 1;
    if (currentEvent >= replayEvents.length) finishReplay();
  }, 850);
}

function resetReplay() {
  window.clearInterval(timer);
  timer = undefined;
  currentEvent = 0;
  minute.textContent = "48:00";
  homeScore.textContent = "0";
  awayScore.textContent = "1";
  status.textContent = "Ready";
  projectionValues.forEach((value) => {
    value.textContent = "0";
  });
  feed.innerHTML =
    '<p class="event-feed__empty">No accepted events. Start the fixture.</p>';
  playButton.textContent = "Run fixture";
  playButton.disabled = false;
  resetButton.disabled = true;
}

playButton.addEventListener("click", playReplay);
resetButton.addEventListener("click", resetReplay);
