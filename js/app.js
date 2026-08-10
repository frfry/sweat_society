// Populated by main.js after data.json files are fetched.
let DAYS = [];
let IMAGES = {};
let IMAGES_HI = {};
let EXERCISE_INDEX = {};

const APP_TITLE = "Sweat Society";

let historyReturnDay = null;
let saveTimer = null;

const app = document.getElementById("app");

function buildExerciseIndex() {
  EXERCISE_INDEX = {};
  DAYS.forEach((day) => {
    day.exercises.forEach((ex, ei) => {
      const add = (key) => {
        if (!EXERCISE_INDEX[key]) EXERCISE_INDEX[key] = [];
        EXERCISE_INDEX[key].push({
          dayNum: day.num,
          title: day.title,
          ei,
          goals: ex.goals,
          img: ex.img,
        });
      };
      add(ex.name);
      if (ex.alt) add(ex.alt);
    });
  });
}

function imgSrc(key) {
  if (!key || !IMAGES[key]) return "";
  return "data:image/jpeg;base64," + IMAGES[key];
}
function imgSrcHi(key) {
  if (!key || !IMAGES_HI[key]) return imgSrc(key);
  return "data:image/jpeg;base64," + IMAGES_HI[key];
}

function titleCase(s) {
  return s.replace(/\w\S*/g, (t) => t.charAt(0) + t.substr(1).toLowerCase());
}

function openLightbox(key, name) {
  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.className = "lightbox";
    lb.onclick = closeLightbox;
    document.body.appendChild(lb);
  }
  lb.innerHTML = `
    <img src="${imgSrcHi(key)}">
    <div class="lb-name">${titleCase(name)}</div>
    <div class="lb-hint">Tap anywhere to close</div>
  `;
  lb.classList.add("open");
}
function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.remove("open");
}

function celebrate() {
  let el = document.getElementById("celebrate");
  if (!el) {
    el = document.createElement("div");
    el.id = "celebrate";
    el.className = "celebrate";
    el.innerHTML = `
      <div class="celebrate-ring">✓</div>
      <div class="celebrate-text">Workout complete</div>
      <div class="celebrate-sub">Nice work — every exercise logged or skipped.</div>
    `;
    el.addEventListener("click", () => el.classList.remove("show"));
    document.body.appendChild(el);
  }
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

// exercise-level completion check
function exerciseDone(entry) {
  if (!entry) return false;
  if (entry.skipped) return false;
  const sets = entry.sets || {};
  return Object.values(sets).some(
    (s) => s.weight !== undefined && s.weight !== "" && s.weight !== null
  );
}
function exerciseSkipped(entry) {
  return !!(entry && entry.skipped);
}
function dayFullyHandled(dayData, exCount) {
  for (let ei = 0; ei < exCount; ei++) {
    const entry = dayData[ei];
    if (!exerciseDone(entry) && !exerciseSkipped(entry)) return false;
  }
  return true;
}

async function renderHome() {
  const user = getCurrentUser();
  let rows = DAYS.map(
    (d) => `
    <div class="day-row" onclick="location.hash='day-${d.num}'">
      <div class="day-num" id="daynum-${d.num}">${d.num}</div>
      <div class="day-info">
        <div class="t">${titleCase(d.title)}</div>
        <div class="m" id="daymeta-${d.num}">${d.exercises.length} exercises</div>
        <div class="dt" id="daydate-${d.num}"></div>
      </div>
      <div class="chev">›</div>
    </div>`
  ).join("");

  app.innerHTML = `
    <header>
      <div class="brand">${APP_TITLE}</div>
      <div class="title-row"><h1>Your Program</h1></div>
      <div class="sub">${DAYS.length} workout days · tap to log${
    user ? " · signed in as " + titleCase(user.firstName) : ""
  }</div>
    </header>
    <div class="day-list">${rows}</div>
    <div class="clear-wrap">
      <button class="backup-btn" onclick="exportBackup()">💾 Save backup</button>
      <button class="backup-btn" onclick="document.getElementById('restore-input').click()">⤴ Restore backup</button>
      <input type="file" id="restore-input" accept="application/json" style="display:none">
      <button class="clear-btn" onclick="clearAll()">Clear all logged data</button>
    </div>
    <div class="logout-wrap"><button class="logout-btn" onclick="logout()">Sign out</button></div>
    <div class="footnote">Weights save automatically as you type.</div>
  `;
  document.getElementById("restore-input").addEventListener("change", handleRestoreFile);

  DAYS.forEach(async (d) => {
    const data = await getDayData(d.num);
    const skippedCount = d.exercises.reduce(
      (n, ex, ei) => n + (exerciseSkipped(data[ei]) ? 1 : 0),
      0
    );
    const metaEl = document.getElementById("daymeta-" + d.num);
    if (metaEl && skippedCount > 0) {
      metaEl.textContent = `${d.exercises.length} exercises · ${skippedCount} skipped`;
    }
    if (dayFullyHandled(data, d.exercises.length)) {
      const el = document.getElementById("daynum-" + d.num);
      if (el) {
        el.classList.add("done");
        el.innerHTML = d.num + '<div class="day-check">✓</div>';
      }
    }
    const dateStr = await getDayDate(d.num);
    const dateEl = document.getElementById("daydate-" + d.num);
    if (dateEl && dateStr) {
      dateEl.textContent = "Completed " + formatDate(dateStr);
    }
  });
}

async function renderDay(num) {
  const day = DAYS.find((d) => d.num === num);
  if (!day) {
    renderHome();
    return;
  }
  const saved = await getDayData(num);
  const savedDate = await getDayDate(num);
  const isToday = savedDate === todayISO();

  app.innerHTML = `
    <header>
      <div class="title-row">
        <button class="back-btn" onclick="location.hash=''">‹</button>
        <div>
          <h1>${titleCase(day.title)}</h1>
          <div class="sub">Day ${day.num} of ${DAYS.length}</div>
        </div>
      </div>
      <div class="date-row">
        <div class="date-label">Date completed</div>
        <button class="today-btn ${isToday ? "active" : ""}" id="today-btn">Today</button>
        <input type="date" class="date-picker" id="date-picker" value="${savedDate}"
          min="${sixMonthsAgoISO()}" max="${todayISO()}">
      </div>
    </header>
    <div class="day-page" id="day-body"></div>
  `;
  app.dataset.rendered = "1";
  const body = document.getElementById("day-body");

  document.getElementById("today-btn").addEventListener("click", async () => {
    await setDayDate(num, todayISO());
    document.getElementById("date-picker").value = todayISO();
    document.getElementById("today-btn").classList.add("active");
  });
  document.getElementById("date-picker").addEventListener("change", async (e) => {
    await setDayDate(num, e.target.value);
    document.getElementById("today-btn").classList.toggle("active", e.target.value === todayISO());
  });

  for (let ei = 0; ei < day.exercises.length; ei++) {
    const ex = day.exercises[ei];
    const entry = saved[ei] || {};
    const sets = entry.sets || {};
    const skipped = !!entry.skipped;
    const done = exerciseDone(entry);
    const prog = await getProgress(ex.name);
    const lastChip = prog
      ? `<div class="ex-last">Last: ${prog.maxWeight} lbs</div>`
      : `<div class="ex-last none">No history yet</div>`;

    let statusBadge = "";
    if (done) statusBadge = `<div class="status-badge done">✓</div>`;
    else if (skipped) statusBadge = `<div class="status-badge skipped">⤫</div>`;

    const card = document.createElement("div");
    card.className = "ex-card" + (skipped ? " is-skipped" : "");
    card.dataset.ei = ei;
    card.innerHTML = `
      ${statusBadge}
      <div class="ex-head">
        <div class="ex-img-wrap">
          <img class="ex-img" data-imgkey="${ex.img || ""}" data-exname="${titleCase(ex.name)}"
            src="${imgSrc(ex.img)}" onerror="this.style.display='none'">
          <div class="zoom-badge">＋</div>
        </div>
        <div>
          <div class="ex-name">${titleCase(ex.name)}</div>
          ${ex.alt ? `<div class="ex-alt">Alt: ${titleCase(ex.alt)}</div>` : ""}
          <div class="chip-row">
            ${lastChip}
          </div>
        </div>
      </div>
      <div class="header-row">
        <div></div><div></div>
        <div class="col-lbl">Reps</div>
        <div class="col-lbl">Weight</div>
      </div>
      <div class="sets">
        ${ex.goals
          .map(
            (g, si) => `
          <div class="set-row">
            <div class="set-lbl">SET ${si + 1}</div>
            <div class="goal">Goal: <b>${g}</b></div>
            <input class="num reps" type="number" inputmode="numeric" placeholder="–"
              data-ei="${ei}" data-si="${si}" ${skipped ? "disabled" : ""}
              value="${(sets[si] && sets[si].reps) || ""}">
            <input class="num weight" type="number" inputmode="decimal" placeholder="–"
              data-ei="${ei}" data-si="${si}" ${skipped ? "disabled" : ""}
              value="${(sets[si] && sets[si].weight) || ""}">
          </div>
        `
          )
          .join("")}
      </div>
      <div class="sets-footer">
        <button class="history-btn" data-name="${ex.name}" data-action="view-history">
          📅 History
        </button>
        <button class="skip-btn ${skipped ? "active" : ""}" data-ei="${ei}" data-action="toggle-skip">
          ${skipped ? "↺ Undo skip" : "⤫ Skip exercise"}
        </button>
      </div>
    `;
    body.appendChild(card);
  }

  body.addEventListener("click", (e) => {
    const img = e.target.closest(".ex-img");
    if (img) {
      openLightbox(img.dataset.imgkey, img.dataset.exname);
      return;
    }
    const skipBtn = e.target.closest('[data-action="toggle-skip"]');
    if (skipBtn) {
      toggleSkip(num, parseInt(skipBtn.dataset.ei, 10));
      return;
    }
    const histBtn = e.target.closest('[data-action="view-history"]');
    if (histBtn) {
      openHistory(histBtn.dataset.name, num);
      return;
    }
  });

  body.querySelectorAll("input.num").forEach((inp) => {
    inp.addEventListener("change", () => onInputChange(num, day));
  });
}

async function toggleSkip(dayNum, ei) {
  const day = DAYS.find((d) => d.num === dayNum);
  const data = await getDayData(dayNum);
  const wasComplete = dayFullyHandled(data, day.exercises.length);
  if (!data[ei]) data[ei] = { sets: {} };
  data[ei].skipped = !data[ei].skipped;
  await setDayData(dayNum, data);
  const isComplete = dayFullyHandled(data, day.exercises.length);
  renderDay(dayNum);
  if (!wasComplete && isComplete) celebrate();
}

async function onInputChange(dayNum, day) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const body = document.getElementById("day-body");
    const data = await getDayData(dayNum);
    const wasComplete = dayFullyHandled(data, day.exercises.length);
    body.querySelectorAll(".ex-card").forEach((card, ei) => {
      const skipped = data[ei] ? !!data[ei].skipped : false;
      const sets = {};
      card.querySelectorAll(".set-row").forEach((row, si) => {
        const reps = row.querySelector(".reps").value;
        const weight = row.querySelector(".weight").value;
        sets[si] = { reps, weight };
      });
      data[ei] = { sets, skipped };
    });
    await setDayData(dayNum, data);
    const isComplete = dayFullyHandled(data, day.exercises.length);

    for (let ei = 0; ei < day.exercises.length; ei++) {
      const ex = day.exercises[ei];
      const entry = data[ei] || {};
      const sets = entry.sets || {};
      let max = null;
      Object.values(sets).forEach((s) => {
        const w = parseFloat(s.weight);
        if (!isNaN(w) && (max === null || w > max)) max = w;
      });
      if (max !== null && !entry.skipped) {
        await setProgress(ex.name, max);
        if (ex.alt) await setProgress(ex.alt, max);
      }
    }

    document.querySelectorAll(".ex-card").forEach(async (card, ei) => {
      const ex = day.exercises[ei];
      const prog = await getProgress(ex.name);
      const chip = card.querySelector(".ex-last");
      if (prog && chip) {
        chip.textContent = `Last: ${prog.maxWeight} lbs`;
        chip.classList.remove("none");
      }
      const done = exerciseDone(data[ei]);
      let badge = card.querySelector(".status-badge");
      if (done) {
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "status-badge done";
          badge.textContent = "✓";
          card.prepend(badge);
        } else {
          badge.className = "status-badge done";
          badge.textContent = "✓";
        }
      } else if (badge && !data[ei].skipped) {
        badge.remove();
      }
    });

    if (!wasComplete && isComplete) celebrate();
  }, 350);
}

function openHistory(name, returnDayNum) {
  historyReturnDay = returnDayNum;
  location.hash = "history-" + encodeURIComponent(name);
}

async function renderHistory(name) {
  const occurrences = (EXERCISE_INDEX[name] || []).slice().sort((a, b) => a.dayNum - b.dayNum);
  const backTarget = historyReturnDay ? "day-" + historyReturnDay : "";

  let allTimeBest = null;
  const rows = [];
  for (const occ of occurrences) {
    const data = await getDayData(occ.dayNum);
    const dateStr = await getDayDate(occ.dayNum);
    const entry = data[occ.ei];
    const skipped = exerciseSkipped(entry);
    const sets = (entry && entry.sets) || {};
    const hasAny = Object.values(sets).some((s) => s.weight || s.reps);

    let maxW = null;
    const setParts = occ.goals
      .map((g, si) => {
        const s = sets[si] || {};
        if (s.weight) {
          const w = parseFloat(s.weight);
          if (!isNaN(w) && (maxW === null || w > maxW)) maxW = w;
        }
        const repsTxt = s.reps ? s.reps : "–";
        const wTxt = s.weight ? s.weight : "–";
        return `<div class="hist-set"><span>Set ${si + 1}</span><span>${repsTxt} reps</span><span>${wTxt} lbs</span></div>`;
      })
      .join("");

    if (maxW !== null && (allTimeBest === null || maxW > allTimeBest)) allTimeBest = maxW;

    let statusTxt, statusClass;
    if (skipped) {
      statusTxt = "Skipped";
      statusClass = "skipped";
    } else if (hasAny) {
      statusTxt = dateStr ? formatDate(dateStr) : "Logged";
      statusClass = "done";
    } else {
      statusTxt = "Not logged yet";
      statusClass = "pending";
    }

    rows.push(`
      <div class="hist-card">
        <div class="hist-head">
          <div class="hist-day">Day ${occ.dayNum} · ${titleCase(occ.title)}</div>
          <div class="hist-status ${statusClass}">${statusTxt}</div>
        </div>
        ${hasAny ? `<div class="hist-sets">${setParts}</div>` : ""}
      </div>
    `);
  }

  app.innerHTML = `
    <header>
      <div class="title-row">
        <button class="back-btn" onclick="location.hash='${backTarget}'">‹</button>
        <div>
          <h1>${titleCase(name)}</h1>
          <div class="sub">${occurrences.length} time${occurrences.length === 1 ? "" : "s"} in your program
            ${allTimeBest !== null ? " · Best: " + allTimeBest + " lbs" : ""}</div>
        </div>
      </div>
    </header>
    <div class="day-page">${rows.join("") || '<div class="footnote">No occurrences found.</div>'}</div>
  `;
  app.dataset.rendered = "1";
}

function route() {
  const hash = location.hash.replace("#", "");
  if (hash.startsWith("history-")) {
    renderHistory(decodeURIComponent(hash.slice(8)));
  } else if (hash.startsWith("day-")) {
    renderDay(parseInt(hash.split("-")[1], 10));
  } else {
    renderHome();
  }
  window.scrollTo(0, 0);
}

// Called by auth.js once the user is signed in.
function startApp() {
  window.removeEventListener("hashchange", route);
  window.addEventListener("hashchange", route);
  document.title = APP_TITLE;
  route();
}
