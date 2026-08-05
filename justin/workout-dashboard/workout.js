(function () {
  "use strict";

  const POCKETBASE_URL = "https://tumid-kiltlike-maia.ngrok-free.dev";
  const COLLECTION = "workout_logs";
  const CACHE_KEY = "trainer-logs-cache";
  const PROFILE_KEY = "trainer-profile";
  const PROFILES = [
    { id: "justin", name: "Justin", initial: "J" },
    { id: "bridget", name: "Bridget", initial: "B" }
  ];
  const PLANS = {
    1: { title: "Chest + Arms A", focus: "Strength & control", color: "lime", estimated: "48 min", exercises: [
      { name: "Dumbbell Bench Press", sets: "4 × 8–10", cue: "Shoulders down, pause at the bottom", rest: 90, tag: "Chest" },
      { name: "Incline Dumbbell Press", sets: "3 × 10", cue: "Keep elbows about 45° from your body", rest: 75, tag: "Chest" },
      { name: "Alternating Curl", sets: "3 × 10 / side", cue: "Keep elbows pinned and lower slowly", rest: 60, tag: "Biceps" },
      { name: "Overhead Triceps Extension", sets: "3 × 12", cue: "Keep ribs down and elbows narrow", rest: 60, tag: "Triceps" },
      { name: "Push-up Finisher", sets: "2 × controlled max", cue: "Stop one rep before form breaks", rest: 60, tag: "Finisher" }
    ]},
    2: { title: "Abs + Back A", focus: "Core stability", color: "blue", estimated: "45 min", exercises: [
      { name: "One-arm Dumbbell Row", sets: "4 × 10 / side", cue: "Pull elbow toward your back pocket", rest: 75, tag: "Back" },
      { name: "Dumbbell Pullover", sets: "3 × 10–12", cue: "Move through shoulders without flaring ribs", rest: 75, tag: "Back" },
      { name: "Dead Bug", sets: "3 × 8 / side", cue: "Keep your lower back pressed down", rest: 45, tag: "Core" },
      { name: "Weighted Russian Twist", sets: "3 × 12 / side", cue: "Rotate through ribs, not just arms", rest: 45, tag: "Core" },
      { name: "Plank", sets: "3 × 35–60 sec", cue: "Squeeze glutes and breathe behind the brace", rest: 45, tag: "Core" }
    ]},
    3: { title: "Leg Day", focus: "Lower-body power", color: "orange", estimated: "52 min", exercises: [
      { name: "Goblet Squat", sets: "4 × 8–12", cue: "Brace first, sit between your hips", rest: 90, tag: "Quads" },
      { name: "Romanian Deadlift", sets: "4 × 8–10", cue: "Push hips back and keep weights close", rest: 90, tag: "Hamstrings" },
      { name: "Reverse Lunge", sets: "3 × 8 / side", cue: "Step back far enough to keep your front heel down", rest: 75, tag: "Legs" },
      { name: "Glute Bridge", sets: "3 × 12–15", cue: "Finish with your glutes, not your lower back", rest: 60, tag: "Glutes" },
      { name: "Standing Calf Raise", sets: "3 × 15–20", cue: "Pause at the top and stretch at the bottom", rest: 45, tag: "Calves" }
    ]},
    4: { title: "Chest + Arms B", focus: "Volume & pump", color: "lime", estimated: "46 min", exercises: [
      { name: "Floor Press", sets: "4 × 10", cue: "Pause triceps on the floor and drive evenly", rest: 75, tag: "Chest" },
      { name: "Dumbbell Fly", sets: "3 × 10–12", cue: "Keep soft elbows and stop at a comfortable stretch", rest: 60, tag: "Chest" },
      { name: "Hammer Curl", sets: "3 × 10–12", cue: "Keep wrists neutral and avoid swinging", rest: 60, tag: "Biceps" },
      { name: "Close-grip Push-up", sets: "3 × 8–15", cue: "Keep your body rigid and elbows close", rest: 60, tag: "Triceps" },
      { name: "Curl + Press Finisher", sets: "2 × 10", cue: "Use a clean curl, then press overhead", rest: 60, tag: "Finisher" }
    ]},
    5: { title: "Abs + Back B", focus: "Posture & endurance", color: "blue", estimated: "44 min", exercises: [
      { name: "Renegade Row", sets: "3 × 8 / side", cue: "Keep hips square; widen your feet if needed", rest: 75, tag: "Back" },
      { name: "Rear Delt Row", sets: "3 × 12", cue: "Lead with your elbows and avoid shrugging", rest: 60, tag: "Back" },
      { name: "Bird Dog", sets: "3 × 8 / side", cue: "Reach long without rotating your hips", rest: 45, tag: "Core" },
      { name: "Reverse Crunch", sets: "3 × 12", cue: "Curl your pelvis up without swinging", rest: 45, tag: "Core" },
      { name: "Side Plank", sets: "3 × 25–45 sec / side", cue: "Make a straight line from head to heel", rest: 45, tag: "Core" }
    ]}
  };

  const app = document.getElementById("app");
  const overlay = document.getElementById("overlayRoot");
  const today = new Date();
  const dateKey = isoDate(today);
  let profile = localStorage.getItem(PROFILE_KEY) || "justin";
  let logs = readCache();
  let checks = [];
  let effort = 7;
  let mood = "Strong";
  let note = "";
  let syncState = "connecting";
  let timerSeconds = 0;
  let timerId = null;

  loadCurrentEntry();
  render();
  bindEvents();
  syncFromPocketBase();

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function isoDate(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function prettyDate(date) {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"); }
    catch (error) { return []; }
  }

  function writeCache() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(logs));
  }

  function loadCurrentEntry() {
    const entry = logs.find(item => item.profile === profile && item.date === dateKey);
    checks = entry && Array.isArray(entry.checks) ? entry.checks.slice() : [];
    effort = entry && entry.effort ? entry.effort : 7;
    mood = entry && entry.mood ? entry.mood : "Strong";
    note = entry && entry.note ? entry.note : "";
  }

  function render() {
    const plan = PLANS[today.getDay()];
    const restDay = !plan;
    const person = PROFILES.find(item => item.id === profile);
    const current = logs.find(item => item.profile === profile && item.date === dateKey);
    const profileLogs = logs.filter(item => item.profile === profile && item.status !== "planned");
    const completed = profileLogs.filter(item => item.status === "complete").length;
    const skipped = profileLogs.filter(item => item.status === "skipped").length;
    const rate = completed + skipped ? Math.round(completed / (completed + skipped) * 100) : 0;
    const streak = calculateStreak(profileLogs);
    const week = weekDays(today);
    const weeklyDone = week.filter(day => logs.some(item => item.profile === profile && item.date === isoDate(day) && item.status === "complete")).length;
    const coupleDone = PROFILES.reduce((sum, item) => sum + week.filter(day => logs.some(log => log.profile === item.id && log.date === isoDate(day) && log.status === "complete")).length, 0);
    const headline = current && current.status === "complete" ? "You showed up." : restDay ? "Recover with purpose." : `Let’s earn it, ${person.name}.`;
    const subhead = current && current.status === "complete" ? "Today is in the books. Recovery is part of the work now." : restDay ? "A short walk, mobility, water, and sleep will make Monday stronger." : `${plan.title} is ready. You don’t need perfect motivation—just the first set.`;

    app.className = "app-shell";
    app.innerHTML = `
      <header class="topbar">
        <a class="brand" href="#top"><span class="brand-mark">F</span><span>FORGE<small>TRAIN TOGETHER</small></span></a>
        <div class="profile-switch" aria-label="Choose profile">${PROFILES.map(item => `<button data-profile="${item.id}" class="${profile === item.id ? "active" : ""}"><i>${item.initial}</i><span>${item.name}</span></button>`).join("")}</div>
        <button class="round-button" data-action="help" aria-label="Open workout help">?</button>
      </header>
      <section id="top" class="hero">
        <div class="hero-copy">
          <div class="hero-kicker"><span class="status-dot ${syncState}"></span>${syncState === "synced" ? "PocketBase synced" : syncState === "offline" ? "Offline — saved on device" : "Connecting…"}</div>
          <p>${prettyDate(today)}</p><h1>${headline}</h1><p class="hero-sub">${subhead}</p>
          <div class="hero-actions">
            ${!restDay && (!current || current.status !== "complete") ? `<button class="cta" data-action="start">Start today’s workout <span>→</span></button>` : ""}
            ${current && current.status === "complete" ? `<span class="complete-pill">✓ Workout complete</span>` : ""}
            <button class="ghost-button" data-action="history">View history</button>
          </div>
        </div>
        <div class="hero-score"><div class="ring" style="--progress:${Math.max(weeklyDone / 5 * 360, 8)}deg"><div><b>${weeklyDone}</b><span>of 5</span></div></div><p>workouts this week</p><small>${weeklyDone >= 5 ? "Weekly goal crushed." : `${5 - weeklyDone} more to hit your goal.`}</small></div>
      </section>
      <section class="metrics">
        ${metric("↗", "fire", "CURRENT STREAK", `${streak} <em>days</em>`, streak ? "Keep the chain alive" : "Today can start your streak")}
        ${metric("◎", "target", "FOLLOW-THROUGH", `${rate}<em>%</em>`, `${completed} complete · ${skipped} skipped`)}
        ${metric("♥", "team", "TEAM TOTAL", `${coupleDone} <em>sessions</em>`, "Justin + Bridget this week")}
        ${metric("ϟ", "bolt", "TOTAL WORKOUTS", completed, "Every session counts")}
      </section>
      <section class="week-strip"><div><p class="section-label">THIS WEEK</p><h2>Consistency over intensity.</h2></div><div class="week-days">${week.map(day => weekDay(day)).join("")}</div></section>
      ${renderWorkout(plan, restDay)}
      <section class="accountability-grid">
        <article class="coach-card"><div class="coach-mark">C</div><p class="section-label">COACH’S CHECK-IN</p><h2>${coachMessage(current, weeklyDone, restDay)}</h2><p>${coachDetail(current, weeklyDone, restDay)}</p><button data-action="help">Open trainer guide →</button></article>
        <article class="team-card"><p class="section-label">TOGETHER THIS WEEK</p><h2>Two people. One standard.</h2>${PROFILES.map(item => partnerProgress(item, week)).join("")}<p class="team-note">No competition required. The goal is to make it harder for either of you to quietly quit.</p></article>
      </section>
      <footer><span>FORGE</span><p>Built for consistency, not perfection.</p><button data-action="help">How this works</button></footer>`;
  }

  function metric(icon, className, label, value, detail) {
    return `<article><span class="metric-icon ${className}">${icon}</span><div><small>${label}</small><strong>${value}</strong><p>${detail}</p></div></article>`;
  }

  function weekDay(day) {
    const key = isoDate(day);
    const log = logs.find(item => item.profile === profile && item.date === key);
    const scheduled = Boolean(PLANS[day.getDay()]);
    const symbol = log && log.status === "complete" ? "✓" : log && log.status === "skipped" ? "×" : scheduled ? "·" : "—";
    return `<div class="${key === dateKey ? "today" : ""} ${log ? log.status : ""}"><small>${day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}</small><b>${day.getDate()}</b><i>${symbol}</i></div>`;
  }

  function renderWorkout(plan, restDay) {
    if (restDay) return `<section id="workout" class="workout-card rest"><div class="workout-head"><div><p class="section-label">WEEKEND RESET</p><h2>Active Recovery</h2><p>Walk 20–30 minutes, then complete 8–10 minutes of relaxed mobility.</p></div></div><div class="recovery-grid"><article><b>01</b><span>Easy walk</span><small>20–30 min</small></article><article><b>02</b><span>Mobility</span><small>8–10 min</small></article><article><b>03</b><span>Hydrate</span><small>Refill twice</small></article><article><b>04</b><span>Sleep</span><small>Aim for 8 hr</small></article></div></section>`;
    return `<section id="workout" class="workout-card ${plan.color}">
      <div class="workout-head"><div><p class="section-label">TODAY’S SESSION</p><h2>${plan.title}</h2><p>${plan.focus} · ${plan.estimated} · ${plan.exercises.length} movements</p></div><div class="progress-count"><b>${checks.length}/${plan.exercises.length}</b><span>movements</span></div></div>
      <div class="exercise-list">${plan.exercises.map((exercise, index) => `<article class="${checks.includes(index) ? "checked" : ""}"><button class="check-button" data-check="${index}" aria-label="Mark ${escapeHtml(exercise.name)} complete">${checks.includes(index) ? "✓" : index + 1}</button><button class="exercise-copy" data-exercise="${index}"><span class="exercise-tag">${exercise.tag}</span><h3>${exercise.name}</h3><p>${exercise.sets}</p></button><button class="rest-button" data-rest="${exercise.rest}"><small>REST</small>${exercise.rest}s</button><button class="help-mini" data-exercise="${index}" aria-label="How to do ${escapeHtml(exercise.name)}">?</button></article>`).join("")}</div>
      <div class="checkin-panel"><div><label>EFFORT <b id="effortValue">${effort}/10</b></label><input id="effortRange" type="range" min="1" max="10" value="${effort}"></div><div><label>HOW DID IT FEEL?</label><div class="moods">${["Tough", "Solid", "Strong", "Crushed it"].map(item => `<button data-mood="${item}" class="${mood === item ? "active" : ""}">${item}</button>`).join("")}</div></div><label class="note-field">QUICK NOTE<input id="noteInput" value="${escapeHtml(note)}" placeholder="Weights used, wins, what to improve…"></label><div class="finish-row"><button class="skip-button" data-status="skipped">I’m skipping today</button><button class="finish-button" data-status="complete" ${checks.length ? "" : "disabled"}>Finish workout <span>✓</span></button></div>${checks.length ? "" : `<small class="finish-hint">Check off at least one movement before finishing.</small>`}</div>
    </section>`;
  }

  function partnerProgress(person, week) {
    const done = week.filter(day => logs.some(item => item.profile === person.id && item.date === isoDate(day) && item.status === "complete")).length;
    return `<div class="partner-progress"><i>${person.initial}</i><span><b>${person.name}</b><small>${done} of 5 complete</small></span><div><u style="width:${done / 5 * 100}%"></u></div></div>`;
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.dataset.profile) chooseProfile(target.dataset.profile);
      if (target.dataset.action === "help") openHelp();
      if (target.dataset.action === "history") openHistory();
      if (target.dataset.action === "start") document.getElementById("workout").scrollIntoView({ behavior: "smooth" });
      if (target.dataset.check != null) toggleExercise(Number(target.dataset.check));
      if (target.dataset.exercise != null) openExercise(Number(target.dataset.exercise));
      if (target.dataset.rest) startRest(Number(target.dataset.rest));
      if (target.dataset.mood) { mood = target.dataset.mood; render(); }
      if (target.dataset.status) saveLog(target.dataset.status);
      if (target.dataset.close) closeOverlay();
      if (target.dataset.timerAdd) startRest(timerSeconds + Number(target.dataset.timerAdd));
      if (target.dataset.timerStop) stopTimer();
    });
    document.addEventListener("input", event => {
      if (event.target.id === "effortRange") { effort = Number(event.target.value); document.getElementById("effortValue").textContent = `${effort}/10`; }
      if (event.target.id === "noteInput") note = event.target.value;
    });
    overlay.addEventListener("click", event => { if (event.target.classList.contains("modal-layer")) closeOverlay(); });
  }

  function chooseProfile(next) {
    profile = next; localStorage.setItem(PROFILE_KEY, profile); loadCurrentEntry(); render();
  }

  function toggleExercise(index) {
    checks = checks.includes(index) ? checks.filter(item => item !== index) : [...checks, index]; render();
  }

  function openExercise(index) {
    const exercise = PLANS[today.getDay()].exercises[index];
    openModal(`<span class="exercise-tag">${exercise.tag}</span><h2>${exercise.name}</h2><h3>${exercise.sets}</h3><div class="cue-box"><b>FORM CUE</b><p>${exercise.cue}</p></div><ol><li>Choose a weight you can control for every repetition.</li><li>Keep the movement smooth; stop if you feel sharp pain.</li><li>Finish the set with one or two good reps still possible.</li></ol><button class="cta full" data-close="true" data-start-rest="${exercise.rest}">Start ${exercise.rest}s rest timer</button>`);
    overlay.querySelector("[data-start-rest]").addEventListener("click", () => startRest(exercise.rest), { once: true });
  }

  function openHelp() {
    openModal(`<p class="section-label">YOUR TRAINER GUIDE</p><h2>How to use FORGE</h2><div class="help-steps">${helpStep(1, "Choose your profile", "Justin and Bridget keep separate streaks, history, notes, and completion totals.")}${helpStep(2, "Follow today’s plan", "Tap each movement for form guidance. Check it off after completing the prescribed sets.")}${helpStep(3, "Use the rest timer", "Tap the rest time beside an exercise. Consistent rest makes progress easier to compare.")}${helpStep(4, "Finish honestly", "Log effort and mood, then complete or skip. A truthful skip is better than a fake streak.")}${helpStep(5, "Progress safely", "When every rep is clean for two sessions, add a small amount of weight or one rep—not both.")}</div><div class="safety-note"><b>Train smart.</b> Stop for sharp pain, dizziness, chest pain, or unusual shortness of breath. This dashboard is general fitness guidance, not medical care.</div>`, "help-modal");
  }

  function helpStep(number, title, copy) { return `<div><b>${number}</b><span><strong>${title}</strong><p>${copy}</p></span></div>`; }

  function openHistory() {
    const person = PROFILES.find(item => item.id === profile);
    const entries = logs.filter(item => item.profile === profile && item.status !== "planned").sort((a, b) => b.date.localeCompare(a.date));
    const list = entries.length ? entries.map(item => `<div><i class="${item.status}">${item.status === "complete" ? "✓" : "×"}</i><span><b>${new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</b><small>${item.status === "complete" ? `${escapeHtml(item.mood || "Complete")} · Effort ${item.effort || "—"}/10` : "Skipped"}</small></span>${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}</div>`).join("") : `<div class="empty-history">No workouts logged yet. Today is a good day to start.</div>`;
    openModal(`<p class="section-label">${person.name.toUpperCase()}’S LOG</p><h2>Workout history</h2><div class="history-list">${list}</div>`, "history-modal");
  }

  function openModal(content, extraClass) {
    overlay.innerHTML = `<div class="modal-layer"><article class="modal ${extraClass || ""}"><button class="modal-close" data-close="true" aria-label="Close">×</button>${content}</article></div>`;
  }

  function closeOverlay() { overlay.innerHTML = ""; }

  function startRest(seconds) {
    stopTimer(); timerSeconds = seconds; drawTimer();
    timerId = setInterval(() => { timerSeconds -= 1; if (timerSeconds <= 0) { stopTimer(); showToast("Rest complete — next set."); } else drawTimer(); }, 1000);
  }

  function drawTimer() {
    let toast = document.getElementById("restTimer");
    if (!toast) { toast = document.createElement("div"); toast.id = "restTimer"; toast.className = "timer-toast"; document.body.appendChild(toast); }
    toast.innerHTML = `<div><small>REST TIMER</small><b>${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, "0")}</b></div><button data-timer-add="30">+30s</button><button data-timer-stop="true">Skip</button>`;
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId); timerId = null; timerSeconds = 0; document.getElementById("restTimer")?.remove();
  }

  async function saveLog(status) {
    const plan = PLANS[today.getDay()];
    const payload = { profile, date: dateKey, status, checks, duration: plan ? Number(plan.estimated.replace(/\D/g, "")) : 0, effort, mood, note };
    const existing = logs.find(item => item.profile === profile && item.date === dateKey);
    logs = existing ? logs.map(item => item === existing ? { ...payload, id: item.id } : item) : [...logs, payload];
    writeCache(); render(); showToast(status === "complete" ? "Workout complete. Promise kept." : "Skip logged. Return at the next scheduled session.");
    if (!window.PocketBase) { syncState = "offline"; render(); return; }
    try {
      syncState = "connecting"; render(); const pb = createPocketBase();
      const body = { ...payload, date: `${dateKey} 12:00:00.000Z` };
      if (existing && existing.id) await pb.collection(COLLECTION).update(existing.id, body); else await pb.collection(COLLECTION).create(body);
      await syncFromPocketBase();
    } catch (error) { syncState = "offline"; render(); }
  }

  function createPocketBase() {
    const pb = new PocketBase(POCKETBASE_URL);
    pb.autoCancellation(false);
    pb.beforeSend = function (url, options) { options.headers = Object.assign({}, options.headers, { "ngrok-skip-browser-warning": "true" }); return { url, options }; };
    return pb;
  }

  async function syncFromPocketBase() {
    if (!window.PocketBase) { syncState = "offline"; render(); return; }
    try {
      const pb = createPocketBase();
      let records = await pb.collection(COLLECTION).getFullList({ sort: "-date", filter: "date >= '2025-01-01'" });
      const queued = logs.filter(item => !item.id);
      for (const item of queued) {
        const remote = records.find(record => String(record.profile) === item.profile && String(record.date).slice(0, 10) === item.date);
        const body = { ...item, date: `${item.date} 12:00:00.000Z` };
        if (remote) await pb.collection(COLLECTION).update(String(remote.id), body); else await pb.collection(COLLECTION).create(body);
      }
      if (queued.length) records = await pb.collection(COLLECTION).getFullList({ sort: "-date", filter: "date >= '2025-01-01'" });
      logs = records.map(record => ({ id: String(record.id), profile: String(record.profile), date: String(record.date).slice(0, 10), status: String(record.status), checks: Array.isArray(record.checks) ? record.checks : [], duration: Number(record.duration || 0), effort: Number(record.effort || 0), mood: String(record.mood || ""), note: String(record.note || "") }));
      writeCache(); loadCurrentEntry(); syncState = "synced"; render();
    } catch (error) { syncState = "offline"; render(); }
  }

  function showToast(message) {
    document.querySelector(".toast")?.remove(); const toast = document.createElement("div"); toast.className = "toast"; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => toast.remove(), 2600);
  }

  function weekDays(date) {
    const monday = new Date(date); const day = monday.getDay(); monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, index) => { const result = new Date(monday); result.setDate(monday.getDate() + index); return result; });
  }

  function calculateStreak(entries) {
    const completed = new Set(entries.filter(item => item.status === "complete").map(item => item.date));
    const cursor = new Date(); let streak = 0;
    for (let tries = 0; tries < 60; tries += 1) {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) { const key = isoDate(cursor); if (completed.has(key)) streak += 1; else if (key !== dateKey) break; }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function coachMessage(log, weeklyDone, rest) {
    if (log && log.status === "complete") return "You kept the promise you made this morning.";
    if (log && log.status === "skipped") return "A missed day is a data point—not an identity.";
    if (rest) return "Recovery is training when you do it deliberately.";
    if (weeklyDone >= 4) return "Finish the week as strong as you started it.";
    return "The hardest rep today is starting.";
  }

  function coachDetail(log, weeklyDone, rest) {
    if (log && log.status === "complete") return "Write down what worked, eat a solid meal, and protect tonight’s sleep. Progress happens between sessions too.";
    if (log && log.status === "skipped") return "Name the reason, remove one obstacle, and return at the next scheduled session. Never miss twice on purpose.";
    if (rest) return "Move enough to feel better afterward. Keep the intensity low and arrive at the next session ready.";
    return weeklyDone ? "Momentum already exists. Put the phone down, complete the warm-up, and let the next decision take care of itself." : "Commit to the first ten minutes. You can reassess after that—but starting is non-negotiable.";
  }
})();
