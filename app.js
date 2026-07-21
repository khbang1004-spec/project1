const STORAGE_KEY = "mathCareStudioDataV3";
const LEGACY_STORAGE_KEY = "mathCareStudioDataV2";
const STUDENT_SESSION_KEY = "mathCareStudentSessionV1";
const TEACHER_AUTH_KEY = "mathCareTeacherAuthV1";
const STUDENT_AUTH_STATE_KEY = "mathCareStudentAuthStateV1";

const TEACHER_PIN = "2468";
const AUTH_MAX_FAILS = 5;
const AUTH_LOCK_MINUTES = 10;

const weatherLabels = {
  sunny: { emoji: "☀️", label: "맑음" },
  cloudy: { emoji: "☁️", label: "흐림" },
  storm: { emoji: "⛈️", label: "천둥번개" },
  rainbow: { emoji: "🌈", label: "무지개" }
};

const defaultOopsArchive = [
  {
    id: "oops-1",
    title: "문제: 0.25 + 0.7 = ?",
    wrongAnswer: "0.32",
    reasons: [
      "자리수를 맞추지 않고 더함",
      "0.25를 25로 느껴서 정수처럼 계산",
      "소수점 위치 규칙을 헷갈림",
      "긴장해서 평소 아는 것도 놓침"
    ]
  },
  {
    id: "oops-2",
    title: "문제: 3/4 + 1/2 = ?",
    wrongAnswer: "4/6",
    reasons: [
      "분모끼리 더한다고 생각함",
      "통분을 빼먹음",
      "분수 덧셈 절차 기억이 흐려짐",
      "익숙한 자연수 덧셈 습관이 나옴"
    ]
  }
];

const page = document.body.dataset.page;
let selectedWeather = "";
let selectedOopsReason = "";

const state = loadState();

if (page === "teacher-login") {
  bindTeacherLoginForm();
}

if (page === "student") {
  setupTabs();
  setupWeatherOptions();
  bindStudentAuthForm();
  bindStudentForms();
  bindStudentLogout();
  renderActiveOopsPrompt();
  renderStudentDashboard();
}

if (page === "teacher") {
  guardTeacherPage();
  bindTeacherControls();
  bindOopsArchiveManager();
  bindRosterForm();
  renderTeacherDashboard();
}

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) {
    return;
  }

  const next = loadState();
  state.weatherCheckins = next.weatherCheckins;
  state.oopsVotes = next.oopsVotes;
  state.habitChecks = next.habitChecks;
  state.logs = next.logs;
  state.oopsArchive = next.oopsArchive;
  state.activeOopsId = next.activeOopsId;
  state.studentRoster = next.studentRoster;

  if (page === "student") {
    renderActiveOopsPrompt();
    renderStudentDashboard();
  }
  if (page === "teacher") {
    renderTeacherDashboard();
  }
});

function normalizeClassCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeStudentNumber(value) {
  return String(value || "").trim();
}

function normalizeStudentName(value) {
  return String(value || "").trim();
}

function createStudentKey(classCode, studentNumber) {
  return `${normalizeClassCode(classCode)}::${normalizeStudentNumber(studentNumber)}`;
}

function loadState() {
  const fallback = {
    weatherCheckins: [],
    oopsVotes: [],
    habitChecks: [],
    logs: [],
    oopsArchive: defaultOopsArchive,
    activeOopsId: defaultOopsArchive[0].id,
    studentRoster: []
  };

  const parseSource = (raw) => {
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  };

  const parsed = parseSource(localStorage.getItem(STORAGE_KEY)) || parseSource(localStorage.getItem(LEGACY_STORAGE_KEY));
  if (!parsed) {
    return fallback;
  }

  const archive = Array.isArray(parsed.oopsArchive) && parsed.oopsArchive.length > 0
    ? parsed.oopsArchive.map(sanitizeOopsPrompt).filter(Boolean)
    : defaultOopsArchive;

  const activeOopsId = archive.some((item) => item.id === parsed.activeOopsId)
    ? parsed.activeOopsId
    : archive[0].id;

  const roster = Array.isArray(parsed.studentRoster)
    ? parsed.studentRoster
      .map((item) => sanitizeRosterItem(item))
      .filter(Boolean)
    : [];

  return {
    weatherCheckins: Array.isArray(parsed.weatherCheckins) ? parsed.weatherCheckins : [],
    oopsVotes: Array.isArray(parsed.oopsVotes) ? parsed.oopsVotes : [],
    habitChecks: Array.isArray(parsed.habitChecks) ? parsed.habitChecks : [],
    logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    oopsArchive: archive,
    activeOopsId,
    studentRoster: roster
  };
}

function sanitizeOopsPrompt(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const reasons = Array.isArray(item.reasons)
    ? item.reasons.map((r) => String(r).trim()).filter(Boolean)
    : [];

  if (!item.id || !item.title || !item.wrongAnswer || reasons.length < 2) {
    return null;
  }

  return {
    id: String(item.id),
    title: String(item.title),
    wrongAnswer: String(item.wrongAnswer),
    reasons: reasons.slice(0, 6)
  };
}

function sanitizeRosterItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }
  const classCode = normalizeClassCode(item.classCode);
  const studentNumber = normalizeStudentNumber(item.studentNumber);
  const studentName = normalizeStudentName(item.studentName);

  if (!classCode || !studentNumber || !studentName) {
    return null;
  }

  return {
    classCode,
    studentNumber,
    studentName,
    studentKey: createStudentKey(classCode, studentNumber)
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getStudentSession() {
  try {
    const raw = localStorage.getItem(STUDENT_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentKey || !parsed.classCode || !parsed.studentNumber || !parsed.studentName) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function setStudentSession(session) {
  localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
}

function clearStudentSession() {
  localStorage.removeItem(STUDENT_SESSION_KEY);
}

function loadStudentAuthState() {
  try {
    const raw = localStorage.getItem(STUDENT_AUTH_STATE_KEY);
    if (!raw) {
      return { failCount: 0, lockedUntil: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      failCount: Number(parsed.failCount) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0
    };
  } catch (error) {
    return { failCount: 0, lockedUntil: 0 };
  }
}

function saveStudentAuthState(authState) {
  localStorage.setItem(STUDENT_AUTH_STATE_KEY, JSON.stringify(authState));
}

function getRemainingLockMs(authState) {
  return Math.max(0, authState.lockedUntil - Date.now());
}

function formatRemainingMinutes(ms) {
  return Math.ceil(ms / 60000);
}

function guardTeacherPage() {
  if (!isTeacherAuthenticated()) {
    window.location.href = "teacher-login.html";
  }
}

function isTeacherAuthenticated() {
  return sessionStorage.getItem(TEACHER_AUTH_KEY) === "ok";
}

function setTeacherAuthenticated(ok) {
  if (ok) {
    sessionStorage.setItem(TEACHER_AUTH_KEY, "ok");
  } else {
    sessionStorage.removeItem(TEACHER_AUTH_KEY);
  }
}

function bindTeacherLoginForm() {
  if (isTeacherAuthenticated()) {
    window.location.href = "teacher.html";
    return;
  }

  const form = document.querySelector("#teacher-login-form");
  const pinInput = document.querySelector("#teacher-pin");
  const feedback = document.querySelector("#teacher-login-feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const pin = pinInput.value.trim();

    if (pin !== TEACHER_PIN) {
      feedback.textContent = "PIN이 일치하지 않습니다.";
      feedback.style.color = "#d94841";
      return;
    }

    setTeacherAuthenticated(true);
    window.location.href = "teacher.html";
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });

      panels.forEach((panel) => {
        const show = panel.id === target;
        panel.classList.toggle("active", show);
        panel.hidden = !show;
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
    });
  });
}

function setupWeatherOptions() {
  const weatherOptions = document.querySelectorAll(".weather-option");
  weatherOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectedWeather = option.dataset.weather;

      weatherOptions.forEach((item) => {
        const isSelected = item === option;
        item.classList.toggle("selected", isSelected);
        item.setAttribute("aria-pressed", String(isSelected));
      });
    });
  });
}

function bindStudentAuthForm() {
  const form = document.querySelector("#student-auth-form");
  const feedback = document.querySelector("#auth-feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const authState = loadStudentAuthState();
    const remaining = getRemainingLockMs(authState);
    if (remaining > 0) {
      feedback.textContent = `인증이 잠겨 있습니다. ${formatRemainingMinutes(remaining)}분 후 다시 시도해 주세요.`;
      feedback.style.color = "#d94841";
      return;
    }

    const classCode = normalizeClassCode(document.querySelector("#auth-class-code").value);
    const studentNumber = normalizeStudentNumber(document.querySelector("#auth-student-number").value);
    const studentName = normalizeStudentName(document.querySelector("#auth-student-name").value);

    if (!classCode || !studentNumber || !studentName) {
      feedback.textContent = "반코드, 학번, 이름을 모두 입력해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const matched = findRosterMatch(classCode, studentNumber, studentName);

    if (!matched) {
      const nextFailCount = authState.failCount + 1;
      const nextAuthState = {
        failCount: nextFailCount,
        lockedUntil: 0
      };

      if (nextFailCount >= AUTH_MAX_FAILS) {
        nextAuthState.lockedUntil = Date.now() + AUTH_LOCK_MINUTES * 60000;
        nextAuthState.failCount = 0;
        feedback.textContent = `인증 ${AUTH_MAX_FAILS}회 실패로 ${AUTH_LOCK_MINUTES}분 잠금되었습니다.`;
      } else {
        const left = AUTH_MAX_FAILS - nextFailCount;
        feedback.textContent = `명단 정보가 일치하지 않습니다. 남은 시도 ${left}회.`;
      }

      feedback.style.color = "#d94841";
      saveStudentAuthState(nextAuthState);
      return;
    }

    setStudentSession({
      classCode: matched.classCode,
      studentNumber: matched.studentNumber,
      studentName: matched.studentName,
      studentKey: matched.studentKey,
      verifiedAt: new Date().toISOString()
    });

    saveStudentAuthState({ failCount: 0, lockedUntil: 0 });
    feedback.textContent = `${matched.studentName} 학생 인증 완료`;
    feedback.style.color = "#0f9d94";
    renderStudentDashboard();
  });
}

function bindStudentLogout() {
  const logoutBtn = document.querySelector("#student-logout");
  logoutBtn.addEventListener("click", () => {
    clearStudentSession();
    renderStudentDashboard();
  });
}

function findRosterMatch(classCode, studentNumber, studentName) {
  return state.studentRoster.find((item) => (
    item.classCode === classCode
    && item.studentNumber === studentNumber
    && item.studentName === studentName
  )) || null;
}

function getCurrentStudentFromSession() {
  const session = getStudentSession();
  if (!session) {
    return null;
  }

  const stillRegistered = state.studentRoster.some((item) => item.studentKey === session.studentKey && item.studentName === session.studentName);
  if (!stillRegistered) {
    clearStudentSession();
    return null;
  }

  return session;
}

function bindStudentForms() {
  document.querySelector("#weather-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const session = getCurrentStudentFromSession();
    const form = event.currentTarget;
    const note = form.note.value.trim();
    const feedback = document.querySelector("#weather-feedback");

    if (!session) {
      feedback.textContent = "먼저 학생 입장 인증을 완료해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    if (!selectedWeather) {
      feedback.textContent = "먼저 감정 날씨를 선택해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    state.weatherCheckins.push({
      studentKey: session.studentKey,
      studentName: session.studentName,
      classCode: session.classCode,
      studentNumber: session.studentNumber,
      weather: selectedWeather,
      note,
      at: new Date().toISOString()
    });

    addLog(`${session.studentName} 학생이 감정 날씨(${weatherLabels[selectedWeather].label})를 제출했어요.`);
    saveState();

    feedback.textContent = "체크인이 기록됐어요. 감정을 표현해줘서 고마워요.";
    feedback.style.color = "#0f9d94";

    form.reset();
    selectedWeather = "";
    document.querySelectorAll(".weather-option").forEach((item) => {
      item.classList.remove("selected");
      item.setAttribute("aria-pressed", "false");
    });

    renderStudentDashboard();
  });

  document.querySelector("#oops-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const session = getCurrentStudentFromSession();
    const form = event.currentTarget;
    const comment = form.comment.value.trim();
    const feedback = document.querySelector("#oops-feedback");
    const activePrompt = getActiveOopsPrompt();

    if (!session) {
      feedback.textContent = "먼저 학생 입장 인증을 완료해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    if (!activePrompt) {
      feedback.textContent = "현재 오답 문제가 설정되지 않았습니다.";
      feedback.style.color = "#d94841";
      return;
    }

    if (!selectedOopsReason) {
      feedback.textContent = "공감되는 이유를 하나 선택해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    state.oopsVotes.push({
      studentKey: session.studentKey,
      studentName: session.studentName,
      classCode: session.classCode,
      studentNumber: session.studentNumber,
      promptId: activePrompt.id,
      promptTitle: activePrompt.title,
      reason: selectedOopsReason,
      comment,
      at: new Date().toISOString()
    });

    addLog(`${session.studentName} 학생이 오답 공감 이유를 남겼어요.`);
    saveState();

    feedback.textContent = "좋아요. 오답의 가치와 과정을 함께 본 훌륭한 참여예요.";
    feedback.style.color = "#0f9d94";

    form.reset();
    selectedOopsReason = "";
    document.querySelectorAll(".choice-option").forEach((item) => {
      item.classList.remove("selected");
      item.setAttribute("aria-pressed", "false");
    });

    renderStudentDashboard();
  });

  document.querySelector("#habit-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const session = getCurrentStudentFromSession();
    const form = event.currentTarget;
    const habits = Array.from(form.querySelectorAll('input[name="habit"]:checked')).map((item) => item.value);
    const feedback = document.querySelector("#habit-feedback");

    if (!session) {
      feedback.textContent = "먼저 학생 입장 인증을 완료해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    if (habits.length === 0) {
      feedback.textContent = "오늘 실천한 해빗을 1개 이상 선택해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    state.habitChecks.push({
      studentKey: session.studentKey,
      studentName: session.studentName,
      classCode: session.classCode,
      studentNumber: session.studentNumber,
      habits,
      at: new Date().toISOString()
    });

    addLog(`${session.studentName} 학생이 해빗 ${habits.length}개를 체크했어요.`);
    saveState();

    feedback.textContent = "작은 성공이 쌓이고 있어요. 아주 좋습니다.";
    feedback.style.color = "#0f9d94";

    form.reset();
    renderStudentDashboard();
  });
}

function bindTeacherControls() {
  document.querySelector("#reset-all").addEventListener("click", () => {
    state.weatherCheckins = [];
    state.oopsVotes = [];
    state.habitChecks = [];
    state.logs = [];
    saveState();
    renderTeacherDashboard();
  });

  const logoutBtn = document.querySelector("#teacher-logout");
  logoutBtn.addEventListener("click", () => {
    setTeacherAuthenticated(false);
    window.location.href = "teacher-login.html";
  });
}

function bindOopsArchiveManager() {
  const select = document.querySelector("#active-oops-select");
  const form = document.querySelector("#new-oops-form");
  const feedback = document.querySelector("#new-oops-feedback");

  select.addEventListener("change", () => {
    state.activeOopsId = select.value;
    saveState();
    renderTeacherDashboard();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.querySelector("#new-oops-title").value.trim();
    const wrong = document.querySelector("#new-oops-wrong").value.trim();
    const reasonsRaw = document.querySelector("#new-oops-reasons").value;
    const reasons = reasonsRaw.split("\n").map((item) => item.trim()).filter(Boolean);

    if (!title || !wrong || reasons.length < 2) {
      feedback.textContent = "문제/오답/이유(최소 2개)를 입력해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const prompt = {
      id: `oops-${Date.now()}`,
      title: title.startsWith("문제:") ? title : `문제: ${title}`,
      wrongAnswer: wrong,
      reasons: reasons.slice(0, 6)
    };

    state.oopsArchive.unshift(prompt);
    state.activeOopsId = prompt.id;
    addLog(`교사가 새 오답 사례를 추가했어요. (${prompt.title})`);
    saveState();

    form.reset();
    feedback.textContent = "오답 사례가 추가되고 현재 문제로 설정되었습니다.";
    feedback.style.color = "#0f9d94";

    renderTeacherDashboard();
  });
}

function bindRosterForm() {
  const form = document.querySelector("#roster-form");
  const feedback = document.querySelector("#roster-feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const classCode = normalizeClassCode(document.querySelector("#roster-class-code").value);
    const studentNumber = normalizeStudentNumber(document.querySelector("#roster-student-number").value);
    const studentName = normalizeStudentName(document.querySelector("#roster-student-name").value);

    if (!classCode || !studentNumber || !studentName) {
      feedback.textContent = "반코드, 학번, 이름을 모두 입력해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const studentKey = createStudentKey(classCode, studentNumber);
    const exists = state.studentRoster.some((item) => item.studentKey === studentKey);
    if (exists) {
      feedback.textContent = "같은 반코드+학번이 이미 등록되어 있습니다.";
      feedback.style.color = "#d94841";
      return;
    }

    state.studentRoster.push({
      classCode,
      studentNumber,
      studentName,
      studentKey
    });

    addLog(`교사가 학생 명단을 등록했어요. (${classCode} ${studentNumber} ${studentName})`);
    saveState();

    form.reset();
    feedback.textContent = "학생 명단에 추가되었습니다.";
    feedback.style.color = "#0f9d94";
    renderTeacherDashboard();
  });
}

function removeRosterItem(studentKey) {
  state.studentRoster = state.studentRoster.filter((item) => item.studentKey !== studentKey);
  addLog(`교사가 학생 명단을 삭제했어요. (${studentKey})`);
  saveState();
  renderTeacherDashboard();
}

function getActiveOopsPrompt() {
  return state.oopsArchive.find((item) => item.id === state.activeOopsId) || null;
}

function renderActiveOopsPrompt() {
  const prompt = getActiveOopsPrompt();
  const question = document.querySelector("#oops-question");
  const wrongAnswer = document.querySelector("#oops-wrong-answer");
  const choiceList = document.querySelector("#oops-choice-list");

  if (!prompt) {
    question.textContent = "문제가 비어 있습니다.";
    wrongAnswer.textContent = "-";
    choiceList.innerHTML = "";
    return;
  }

  question.textContent = prompt.title;
  wrongAnswer.textContent = prompt.wrongAnswer;
  choiceList.innerHTML = "";
  selectedOopsReason = "";

  prompt.reasons.forEach((reason) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-option";
    button.textContent = reason;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      selectedOopsReason = reason;
      document.querySelectorAll(".choice-option").forEach((item) => {
        const isSelected = item === button;
        item.classList.toggle("selected", isSelected);
        item.setAttribute("aria-pressed", String(isSelected));
      });
    });
    choiceList.appendChild(button);
  });
}

function addLog(message) {
  const stamp = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  state.logs.unshift(`[${stamp}] ${message}`);
  state.logs = state.logs.slice(0, 30);
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function renderStudentDashboard() {
  const session = getCurrentStudentFromSession();
  const title = document.querySelector("#my-summary-title");
  const sessionInfo = document.querySelector("#student-active-info");
  const logoutBtn = document.querySelector("#student-logout");

  if (!session) {
    title.textContent = "입장 인증 후 개인 누적이 표시됩니다.";
    if (sessionInfo) {
      sessionInfo.textContent = "학생 정보";
    }
    logoutBtn.disabled = true;
  } else {
    title.textContent = `${session.studentName} 학생의 누적 리포트`;
    if (sessionInfo) {
      sessionInfo.textContent = `${session.classCode} · ${session.studentNumber}번 · ${session.studentName}`;
    }
    logoutBtn.disabled = false;
  }

  setStudentStageAccess(Boolean(session));

  const weatherMine = session ? state.weatherCheckins.filter((item) => item.studentKey === session.studentKey) : [];
  const oopsMine = session ? state.oopsVotes.filter((item) => item.studentKey === session.studentKey) : [];
  const habitMine = session ? state.habitChecks.filter((item) => item.studentKey === session.studentKey) : [];

  document.querySelector("#my-total-weather").textContent = String(weatherMine.length);
  document.querySelector("#my-total-oops").textContent = String(oopsMine.length);
  document.querySelector("#my-total-habit").textContent = String(habitMine.length);

  renderWeatherCards("#my-weather-summary", weatherMine);
  renderRankList(
    "#my-oops-summary",
    Object.entries(countBy(oopsMine, (item) => item.reason)).sort((a, b) => b[1] - a[1]),
    "아직 제출된 오답 인사이트가 없어요.",
    "표"
  );

  const flatHabits = habitMine.flatMap((item) => item.habits);
  renderRankList(
    "#my-habit-summary",
    Object.entries(countBy(flatHabits, (item) => item)).sort((a, b) => b[1] - a[1]),
    "아직 체크된 해빗이 없어요.",
    "회"
  );

  const myLog = document.querySelector("#my-recent-log");
  myLog.innerHTML = "";

  const logs = session ? state.logs.filter((line) => line.includes(`${session.studentName} 학생`)).slice(0, 8) : [];
  if (logs.length === 0) {
    myLog.innerHTML = "<li>아직 참여 로그가 없어요.</li>";
  } else {
    logs.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      myLog.appendChild(li);
    });
  }

  toggleStudentInteraction(Boolean(session));
}

function setStudentStageAccess(enabled) {
  const authStage = document.querySelector("#student-auth-stage");
  const appStage = document.querySelector("#student-app-stage");
  const dashboardStage = document.querySelector("#student-dashboard-stage");
  const mainEl = document.querySelector("main");

  if (authStage) {
    authStage.hidden = enabled;
  }

  if (appStage) {
    appStage.hidden = !enabled;
  }

  if (dashboardStage) {
    dashboardStage.hidden = !enabled;
  }

  // 인증 전: 단일 중앙 카드, 인증 후: 2열 레이아웃
  if (mainEl) {
    mainEl.classList.toggle("layout", enabled);
    mainEl.classList.toggle("layout-auth", !enabled);
  }
}

function toggleStudentInteraction(enabled) {
  const formIds = ["#weather-form", "#oops-form", "#habit-form"];
  formIds.forEach((id) => {
    const form = document.querySelector(id);
    if (!form) {
      return;
    }
    form.querySelectorAll("input, select, button, textarea").forEach((node) => {
      if (enabled) {
        node.removeAttribute("disabled");
      } else {
        node.setAttribute("disabled", "disabled");
      }
    });
  });
}

function renderTeacherDashboard() {
  document.querySelector("#total-weather").textContent = String(state.weatherCheckins.length);
  document.querySelector("#total-oops").textContent = String(state.oopsVotes.length);
  document.querySelector("#total-habit").textContent = String(state.habitChecks.length);

  renderWeatherCards("#weather-summary", state.weatherCheckins);

  renderRankList(
    "#oops-summary",
    Object.entries(countBy(state.oopsVotes, (item) => item.reason)).sort((a, b) => b[1] - a[1]),
    "아직 제출된 오답 인사이트가 없어요.",
    "표"
  );

  const flatHabits = state.habitChecks.flatMap((item) => item.habits);
  renderRankList(
    "#habit-summary",
    Object.entries(countBy(flatHabits, (item) => item)).sort((a, b) => b[1] - a[1]),
    "아직 체크된 해빗이 없어요.",
    "회"
  );

  renderTeacherStudentTable();
  renderOopsArchivePicker();
  renderRosterTable();

  const recentLog = document.querySelector("#recent-log");
  recentLog.innerHTML = "";

  if (state.logs.length === 0) {
    recentLog.innerHTML = "<li>아직 참여 로그가 없어요.</li>";
  } else {
    state.logs.slice(0, 12).forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      recentLog.appendChild(li);
    });
  }
}

function renderOopsArchivePicker() {
  const select = document.querySelector("#active-oops-select");
  select.innerHTML = "";

  state.oopsArchive.forEach((prompt) => {
    const option = document.createElement("option");
    option.value = prompt.id;
    option.textContent = `${prompt.title} | 오답: ${prompt.wrongAnswer}`;
    select.appendChild(option);
  });

  select.value = state.activeOopsId;
}

function renderRosterTable() {
  const body = document.querySelector("#roster-table");
  body.innerHTML = "";

  const sorted = [...state.studentRoster].sort((a, b) => {
    if (a.classCode !== b.classCode) {
      return a.classCode.localeCompare(b.classCode, "ko");
    }
    return a.studentNumber.localeCompare(b.studentNumber, "ko");
  });

  if (sorted.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"4\">아직 등록된 학생 명단이 없어요.</td>";
    body.appendChild(row);
    return;
  }

  sorted.forEach((item) => {
    const row = document.createElement("tr");

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost-btn small-btn";
    removeButton.textContent = "삭제";
    removeButton.addEventListener("click", () => {
      removeRosterItem(item.studentKey);
    });

    row.innerHTML = [
      `<td>${item.classCode}</td>`,
      `<td>${item.studentNumber}</td>`,
      `<td>${item.studentName}</td>`,
      "<td></td>"
    ].join("");
    row.querySelector("td:last-child").appendChild(removeButton);
    body.appendChild(row);
  });
}

function renderTeacherStudentTable() {
  const body = document.querySelector("#student-summary-table");
  body.innerHTML = "";

  const students = new Map();
  state.studentRoster.forEach((item) => {
    students.set(item.studentKey, {
      studentKey: item.studentKey,
      studentName: item.studentName,
      classCode: item.classCode,
      studentNumber: item.studentNumber
    });
  });

  [...state.weatherCheckins, ...state.oopsVotes, ...state.habitChecks].forEach((item) => {
    if (!item.studentKey) {
      return;
    }
    if (!students.has(item.studentKey)) {
      students.set(item.studentKey, {
        studentKey: item.studentKey,
        studentName: item.studentName || "(이전 데이터)",
        classCode: item.classCode || "-",
        studentNumber: item.studentNumber || "-"
      });
    }
  });

  const list = Array.from(students.values()).sort((a, b) => {
    if (a.classCode !== b.classCode) {
      return a.classCode.localeCompare(b.classCode, "ko");
    }
    return a.studentNumber.localeCompare(b.studentNumber, "ko");
  });

  if (list.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"5\">아직 제출된 학생 데이터가 없어요.</td>";
    body.appendChild(row);
    return;
  }

  list.forEach((student) => {
    const weather = state.weatherCheckins.filter((item) => item.studentKey === student.studentKey);
    const oops = state.oopsVotes.filter((item) => item.studentKey === student.studentKey);
    const habit = state.habitChecks.filter((item) => item.studentKey === student.studentKey);
    const latestWeather = weather.length > 0 ? weatherLabels[weather[weather.length - 1].weather].label : "-";

    const row = document.createElement("tr");
    row.innerHTML = [
      `<td>${student.classCode}-${student.studentNumber} ${student.studentName}</td>`,
      `<td>${weather.length}</td>`,
      `<td>${oops.length}</td>`,
      `<td>${habit.length}</td>`,
      `<td>${latestWeather}</td>`
    ].join("");
    body.appendChild(row);
  });
}

function renderWeatherCards(target, items) {
  const node = document.querySelector(target);
  node.innerHTML = "";

  const weatherCount = countBy(items, (item) => item.weather);
  Object.keys(weatherLabels).forEach((code) => {
    const info = weatherLabels[code];
    const value = weatherCount[code] || 0;

    const row = document.createElement("div");
    row.className = "summary-item";
    row.innerHTML = `<span>${info.emoji} ${info.label}</span><strong>${value}</strong>`;
    node.appendChild(row);
  });
}

function renderRankList(target, entries, emptyText, unit) {
  const node = document.querySelector(target);
  node.innerHTML = "";

  if (entries.length === 0) {
    node.innerHTML = `<li>${emptyText}</li>`;
    return;
  }

  entries.forEach(([label, count]) => {
    const li = document.createElement("li");
    li.textContent = `${label} (${count}${unit})`;
    node.appendChild(li);
  });
}
