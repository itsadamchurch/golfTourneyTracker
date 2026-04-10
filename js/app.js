const users = [
  { name: "Zac", picks: ["S Scheffler", "SW Kim", "V Hovland", "N Hojgaard"] },
  { name: "Ben", picks: ["B DeChambeau", "B Koepka", "C Gotterup", "P Cantlay"] },
  { name: "Grier", picks: ["R McIlroy", "S Lowry", "R Henley", "T Hatton"] },
  { name: "Fehrenbach", picks: ["J Rahm", "P Reed", "J Spieth", "K Kitayama"] },
  { name: "William", picks: ["H Matsuyama", "J Thomas", "S Straka", "R Gerard"] },
  { name: "Daniel", picks: ["C Young", "J Spaun", "B Griffin", "K Bradley"] },
  { name: "Adam", picks: ["X Schauffele", "C Morikawa", "A Scott", "S Burns"] },
  { name: "Renesa", picks: ["M Fitzpatrick", "M W Lee", "M McNealy", "J Day"] },
  { name: "Fronce", picks: ["L Aberg", "J Rose", "J Bridgeman", "A Noren"] },
  { name: "Hummy", picks: ["T Fleetwood", "R McIntyre", "A Bhatia", "H English"] }
];

const defaultScores = {
  "S Scheffler": "",
  "SW Kim": "",
  "V Hovland": "",
  "N Hojgaard": "",
  "B DeChambeau": "",
  "B Koepka": "",
  "C Gotterup": "",
  "P Cantlay": "",
  "R McIlroy": "",
  "S Lowry": "",
  "R Henley": "",
  "T Hatton": "",
  "J Rahm": "",
  "P Reed": "",
  "J Spieth": "",
  "K Kitayama": "",
  "H Matsuyama": "",
  "J Thomas": "",
  "S Straka": "",
  "R Gerard": "",
  "C Young": "",
  "J Spaun": "",
  "B Griffin": "",
  "K Bradley": "",
  "X Schauffele": "",
  "C Morikawa": "",
  "A Scott": "",
  "S Burns": "",
  "M Fitzpatrick": "",
  "M W Lee": "",
  "M McNealy": "",
  "J Day": "",
  "L Aberg": "",
  "J Rose": "",
  "J Bridgeman": "",
  "A Noren": "",
  "T Fleetwood": "",
  "R McIntyre": "",
  "A Bhatia": "",
  "H English": ""
};

const defaultPositions = Object.fromEntries(
  Object.keys(defaultScores).map((golfer) => [golfer, ""])
);
const defaultDetails = Object.fromEntries(
  Object.keys(defaultScores).map((golfer) => [golfer, { status: "", rounds: "" }])
);

const storageKey = "masters-2026-pick-tracker";
const positionKey = "masters-2026-pick-positions";
const detailKey = "masters-2026-pick-details";
const modeKey = "masters-2026-score-mode";
const savedState = JSON.parse(localStorage.getItem(storageKey) || "null");
const savedPositions = JSON.parse(localStorage.getItem(positionKey) || "null");
const savedDetails = JSON.parse(localStorage.getItem(detailKey) || "null");
const scores = { ...defaultScores, ...(savedState || {}) };
const positions = { ...defaultPositions, ...(savedPositions || {}) };
const details = { ...defaultDetails, ...(savedDetails || {}) };
const savedMode = localStorage.getItem(modeKey) || "toPar";
const espnLeaderboardUrl = "https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga";

const leaderboardBody = document.getElementById("leaderboardBody");
const liveScoringBody = document.getElementById("liveScoringBody");
const usersGrid = document.getElementById("usersGrid");
const scoreModeSelect = document.getElementById("scoreMode");
const lastSaved = document.getElementById("lastSaved");
const heroMode = document.getElementById("heroMode");
const loadingScreen = document.getElementById("loadingScreen");
const loadingMessage = document.getElementById("loadingMessage");
const refreshScoresButton = document.getElementById("refreshScores");
const feedStatus = document.getElementById("feedStatus");
const feedStatusText = document.getElementById("feedStatusText");
const feedDetail = document.getElementById("feedDetail");

let isInitialLoad = true;
let liveGolfers = [];

document.getElementById("userCount").textContent = users.length;
document.getElementById("golferCount").textContent = Object.keys(defaultScores).length;
scoreModeSelect.value = savedMode;

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/Ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "ae")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const allGolfers = [...new Set(users.flatMap((user) => user.picks))];
const golferAliases = Object.fromEntries(allGolfers.map((golfer) => [golfer, new Set([normalizeName(golfer)])]));
const golferOwners = users.reduce((acc, user) => {
  user.picks.forEach((golfer) => {
    if (!acc[golfer]) acc[golfer] = [];
    acc[golfer].push(user.name);
  });
  return acc;
}, {});

[
  ["S Scheffler", ["scottie scheffler"]],
  ["SW Kim", ["si woo kim", "siwoo kim"]],
  ["V Hovland", ["viktor hovland"]],
  ["N Hojgaard", ["nicolai hojgaard"]],
  ["B DeChambeau", ["bryson dechambeau"]],
  ["B Koepka", ["brooks koepka"]],
  ["C Gotterup", ["chris gotterup"]],
  ["P Cantlay", ["patrick cantlay"]],
  ["R McIlroy", ["rory mcilroy"]],
  ["S Lowry", ["shane lowry"]],
  ["R Henley", ["russell henley"]],
  ["T Hatton", ["tyrrell hatton"]],
  ["J Rahm", ["jon rahm"]],
  ["P Reed", ["patrick reed"]],
  ["J Spieth", ["jordan spieth"]],
  ["K Kitayama", ["kurt kitayama"]],
  ["H Matsuyama", ["hideki matsuyama"]],
  ["J Thomas", ["justin thomas"]],
  ["S Straka", ["sepp straka"]],
  ["R Gerard", ["ryan gerard"]],
  ["C Young", ["cameron young"]],
  ["J Spaun", ["j j spaun", "jj spaun"]],
  ["B Griffin", ["ben griffin"]],
  ["K Bradley", ["keegan bradley"]],
  ["X Schauffele", ["xander schauffele"]],
  ["C Morikawa", ["collin morikawa"]],
  ["A Scott", ["adam scott"]],
  ["S Burns", ["sam burns"]],
  ["M Fitzpatrick", ["matt fitzpatrick", "matthew fitzpatrick"]],
  ["M W Lee", ["min woo lee"]],
  ["M McNealy", ["maverick mcnealy"]],
  ["J Day", ["jason day"]],
  ["L Aberg", ["ludvig aberg", "ludvig a berg"]],
  ["J Rose", ["justin rose"]],
  ["J Bridgeman", ["jacob bridgeman"]],
  ["A Noren", ["alex noren"]],
  ["T Fleetwood", ["tommy fleetwood"]],
  ["R McIntyre", ["robert macintyre", "bob macintyre"]],
  ["A Bhatia", ["akshay bhatia"]],
  ["H English", ["harris english"]]
].forEach(([golfer, aliases]) => aliases.forEach((alias) => golferAliases[golfer].add(normalizeName(alias))));

function getBestMatchingGolfer(espnName) {
  const normalized = normalizeName(espnName);
  return allGolfers.find((golfer) => golferAliases[golfer].has(normalized)) || null;
}

function showLoading(message) {
  loadingMessage.textContent = message;
  loadingScreen.classList.remove("hidden");
}

function hideLoading() {
  loadingScreen.classList.add("hidden");
}

function setFeedStatus(state, title, detail) {
  feedStatus.className = `status-badge ${state}`;
  feedStatusText.textContent = title;
  feedDetail.textContent = detail;
}

function parseScoreValue(scoreDisplay) {
  if (scoreDisplay === undefined || scoreDisplay === null) return null;
  const raw = String(scoreDisplay).trim().toUpperCase();
  if (!raw || raw === "--") return null;
  if (raw === "E") return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTotalScoreValue(competitor) {
  const scoreToPar = Array.isArray(competitor.statistics)
    ? competitor.statistics.find((stat) => stat.name === "scoreToPar")
    : null;
  const parsedLiveScore = parseScoreValue(scoreToPar?.displayValue ?? scoreToPar?.value);
  if (parsedLiveScore !== null) return parsedLiveScore;

  const totalScore =
    competitor.score?.displayValue ??
    competitor.score?.value ??
    competitor.score;

  const parsedTotal = parseScoreValue(totalScore);
  if (parsedTotal !== null) return parsedTotal;

  const linescores = Array.isArray(competitor.linescores) ? competitor.linescores : [];
  const parsedRounds = linescores
    .map((line) => parseScoreValue(line.displayValue ?? line.value))
    .filter((value) => value !== null);

  if (!parsedRounds.length) return null;
  return parsedRounds.reduce((sum, value) => sum + value, 0);
}

function parsePositionValue(competitor) {
  const statusPosition = competitor.status?.position;
  const raw =
    statusPosition?.displayValue ??
    statusPosition?.id ??
    competitor.curatedRank?.displayValue ??
    competitor.curatedRank?.current ??
    competitor.place ??
    competitor.order ??
    competitor.position?.displayValue ??
    competitor.position?.value ??
    "";

  if (raw === undefined || raw === null) return "";

  const value = String(raw).trim().toUpperCase();
  if (!value || value === "--") return "";
  if (statusPosition?.isTie && !value.startsWith("T")) return `T${value}`;
  return value;
}

function parseStatusDetail(competitor) {
  const status = competitor.status || {};
  const state = status.type?.state;
  const today = status.todayDetail ? `Today ${status.todayDetail}` : "";

  if (state === "in") {
    const hole = status.hole && status.hole > 0 ? `Hole ${status.hole}` : "";
    const thru = status.thru && status.thru > 0 ? `Thru ${status.thru}` : "";
    return [hole || thru, today].filter(Boolean).join(" | ") || "In Progress";
  }

  if (state === "pre") {
    const tee = status.detail ? `Tee ${status.detail}` : "";
    return [tee, today].filter(Boolean).join(" | ") || "Scheduled";
  }

  return [today, status.type?.shortDetail, status.detail].filter(Boolean)[0] || "";
}

function parseRoundDetails(competitor) {
  const linescores = Array.isArray(competitor.linescores) ? competitor.linescores : [];
  const roundParts = linescores.map((line) => {
    const label = `R${line.period}`;
    if (line.displayValue) return `${label} ${line.displayValue}`;
    if (line.teeTime) {
      const teeTime = new Date(line.teeTime);
      const formatted = teeTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      return `${label} Tee ${formatted}`;
    }
    return "";
  }).filter(Boolean);

  return roundParts.join(" | ");
}

function parsePositionRank(position) {
  if (!position) return Number.POSITIVE_INFINITY;
  const match = String(position).match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

async function fetchEspnScores() {
  const loadingCopy = isInitialLoad
    ? "Pulling the latest Masters numbers from ESPN and matching them to your picks."
    : "Refreshing the latest scores from ESPN.";
  showLoading(loadingCopy);
  refreshScoresButton.disabled = true;
  setFeedStatus("syncing", "Fetching ESPN feed", "Looking for the current Masters leaderboard.");

  try {
    const response = await fetch(espnLeaderboardUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`ESPN request failed with ${response.status}`);
    }

    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events : [];
    const mastersEvent =
      events.find((event) => /masters/i.test(event.name || "")) ||
      events.find((event) => /masters/i.test(event.shortName || "")) ||
      events[0];

    if (!mastersEvent || !mastersEvent.competitions || !mastersEvent.competitions[0]) {
      throw new Error("No golf competition data returned by ESPN.");
    }

    const competition = mastersEvent.competitions[0];
    const competitors = Array.isArray(competition.competitors) ? competition.competitors : [];
    let matched = 0;
    liveGolfers = [];

    competitors.forEach((competitor) => {
      const espnName = competitor.athlete && competitor.athlete.displayName;
      const pickName = espnName ? getBestMatchingGolfer(espnName) : null;
      const value = parseTotalScoreValue(competitor);
      const position = parsePositionValue(competitor);
      const statusDetail = parseStatusDetail(competitor);
      const roundDetails = parseRoundDetails(competitor);
      const owners = pickName ? (golferOwners[pickName] || []) : [];
      const liveEntry = {
        name: espnName || "Unknown Golfer",
        position: position || "-",
        positionRank: parsePositionRank(position),
        score: value,
        scoreDisplay: value === null ? "-" : formatTotal(value),
        status: statusDetail || "Status unavailable",
        rounds: roundDetails || "Round details unavailable",
        pickedBy: owners.length ? owners.join(", ") : "Nobody",
        unpickedTopTwenty: owners.length === 0 && parsePositionRank(position) <= 20
      };

      liveGolfers.push(liveEntry);

      if (!pickName || value === null) return;
      scores[pickName] = value;
      positions[pickName] = position;
      details[pickName] = {
        status: statusDetail,
        rounds: roundDetails
      };
      matched += 1;
    });

    storeState();
    render();

    const eventName = mastersEvent.name || mastersEvent.shortName || "Current PGA event";
    setFeedStatus(
      "live",
      "ESPN scores loaded",
      `${eventName}. Matched ${matched} of ${allGolfers.length} picked golfers.`
    );
  } catch (error) {
    console.error(error);
    setFeedStatus(
      "error",
      "ESPN fetch failed",
      "Keeping saved/manual scores. ESPN may be blocking browser access or not exposing the event yet."
    );
  } finally {
    refreshScoresButton.disabled = false;
    hideLoading();
    isInitialLoad = false;
  }
}

function formatTotal(value) {
  const mode = scoreModeSelect.value;
  if (Number.isNaN(value)) return "-";
  if (mode === "toPar") {
    if (value === 0) return "E";
    return value > 0 ? `+${value}` : `${value}`;
  }
  return `${value}`;
}

function storeState() {
  localStorage.setItem(storageKey, JSON.stringify(scores));
  localStorage.setItem(positionKey, JSON.stringify(positions));
  localStorage.setItem(detailKey, JSON.stringify(details));
  localStorage.setItem(modeKey, scoreModeSelect.value);
  const stamp = new Date();
  lastSaved.textContent = stamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  heroMode.textContent = scoreModeSelect.value === "toPar" ? "To Par" : "Strokes";
}

function renderUsers() {
  usersGrid.innerHTML = users.map((user) => {
    const total = user.picks.reduce((sum, golfer) => {
      const value = Number(scores[golfer]);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const picksMarkup = user.picks.map((golfer) => `
      <li class="pick-item">
        <div>
          <span class="pick-name">${golfer}</span>
          <span class="pick-owner">${positions[golfer] ? `Standing ${positions[golfer]}` : "Standing -"}</span>
          <span class="pick-detail">${details[golfer]?.status || "Status unavailable"}</span>
          <span class="pick-detail rounds">${details[golfer]?.rounds || "Round details unavailable"}</span>
        </div>
        <div class="score-field">
          <span class="score-chip-label">Total</span>
          <span class="score-chip" aria-label="${golfer} total score">${scores[golfer] === "" ? "-" : formatTotal(Number(scores[golfer]))}</span>
        </div>
      </li>
    `).join("");

    return `
      <article class="user-card">
        <div class="user-card-header">
          <h3 class="user-name">${user.name}</h3>
          <div class="user-total">
            <span class="score-meta">Pool total</span>
            <strong>${formatTotal(total)}</strong>
          </div>
        </div>
        <ol class="pick-list">${picksMarkup}</ol>
      </article>
    `;
  }).join("");
}

function renderLeaderboard() {
  const standings = users.map((user) => {
    const scoredPicks = user.picks
      .map((golfer) => ({ golfer, value: Number(scores[golfer]), position: positions[golfer] }))
      .filter((entry) => Number.isFinite(entry.value));

    const total = scoredPicks.reduce((sum, entry) => sum + entry.value, 0);
    const bestPick = scoredPicks.sort((a, b) => a.value - b.value)[0];

    return {
      name: user.name,
      total,
      updated: scoredPicks.length,
      bestPick: bestPick
        ? `${bestPick.golfer} (${formatTotal(bestPick.value)}) ${bestPick.position || "-"}`
        : "No scores yet"
    };
  }).sort((a, b) => a.total - b.total || b.updated - a.updated || a.name.localeCompare(b.name));

  leaderboardBody.innerHTML = standings.map((entry, index) => `
    <tr>
      <td><span class="rank-pill">${index + 1}</span></td>
      <td>${entry.name}</td>
      <td><span class="score-main">${formatTotal(entry.total)}</span></td>
      <td>${entry.updated}/4</td>
      <td>${entry.bestPick}</td>
    </tr>
  `).join("");
}

function renderLiveScoring() {
  const sorted = [...liveGolfers].sort((a, b) =>
    a.positionRank - b.positionRank ||
    (Number.isFinite(a.score) ? a.score : Number.POSITIVE_INFINITY) -
      (Number.isFinite(b.score) ? b.score : Number.POSITIVE_INFINITY) ||
    a.name.localeCompare(b.name)
  );

  liveScoringBody.innerHTML = sorted.map((entry) => `
    <tr class="${entry.unpickedTopTwenty ? "unpicked-threat" : ""}">
      <td>${entry.position}</td>
      <td>
        <span class="live-golfer">${entry.name}</span>
        ${entry.unpickedTopTwenty ? '<span class="live-note">Top 20 unpicked</span>' : ""}
      </td>
      <td><span class="score-main">${entry.scoreDisplay}</span></td>
      <td>${entry.status}</td>
      <td>${entry.rounds}</td>
      <td>${entry.pickedBy}</td>
    </tr>
  `).join("");
}

function render() {
  renderLeaderboard();
  renderLiveScoring();
  renderUsers();
  heroMode.textContent = scoreModeSelect.value === "toPar" ? "To Par" : "Strokes";
}

scoreModeSelect.addEventListener("change", () => {
  storeState();
  render();
});

refreshScoresButton.addEventListener("click", () => {
  fetchEspnScores();
});

storeState();
render();
fetchEspnScores();
