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
    id: "calc-1-1", unit: "수열의 극한",
    title: "lim(n→∞) (2n+1)/(3n-2) 의 값은?",
    wrongAnswer: "0 또는 1/3 (분자·분모를 n으로 나누지 않고 상수항만 비교)",
    wrongAnswerImage: null,
    reasons: [
      "분자·분모를 최고차항 n으로 나누지 않음",
      "n→∞일 때 1/n→0 처리를 빠뜨림",
      "최고차항 계수의 비율 공식을 다른 유형과 혼동",
      "극한 계산 도중 부호를 잘못 처리"
    ]
  },
  {
    id: "calc-1-2", unit: "수열의 극한",
    title: "lim(n→∞) √(n²+n) - n 의 값은?",
    wrongAnswer: "0 (루트 안 n²과 밖 n이 상쇄된다고 생각)",
    wrongAnswerImage: null,
    reasons: [
      "유리화(분자·분모에 켤레식 곱하기)를 떠올리지 못함",
      "√(n²+n) ≈ n이므로 차이가 0이라고 직관으로 판단",
      "루트를 풀어 정리하는 과정에서 n²+n을 n(n+1)로 변환 안 함",
      "계산 중 분모 극한 처리를 생략"
    ]
  },
  {
    id: "calc-2-1", unit: "급수",
    title: "1 + 1/2 + 1/4 + 1/8 + ⋯ 의 합은?",
    wrongAnswer: "1/2 (공비 r만 답으로 씀)",
    wrongAnswerImage: null,
    reasons: [
      "S = a/(1-r) 공식에서 첫째항 a=1 을 적용하지 않음",
      "1/(1-r) 만 계산하고 a를 곱하지 않음",
      "급수와 수열의 극한을 혼동해 공비 자체를 결과로 씀",
      "수렴 조건 |r|<1 을 확인하지 않고 공식만 적용"
    ]
  },
  {
    id: "calc-3-1", unit: "함수의 극한",
    title: "lim(x→0) sin(x)/x 의 값은?",
    wrongAnswer: "0 (x=0 직접 대입: sin(0)/0 = 0)",
    wrongAnswerImage: null,
    reasons: [
      "0/0 형태의 부정형임을 인식하지 못하고 직접 대입",
      "삼각함수 극한 기본 공식 lim(x→0) sin(x)/x = 1을 암기하지 못함",
      "0 ÷ 0 = 0으로 처리하는 계산 습관",
      "극한값과 함숫값(대입값)을 구분하지 못함"
    ]
  },
  {
    id: "calc-3-2", unit: "함수의 연속",
    title: "f(x) = (x²-1)/(x-1)은 x=1에서 연속인가?",
    wrongAnswer: "연속 (약분하면 x+1이므로 f(1)=2라고 판단)",
    wrongAnswerImage: null,
    reasons: [
      "f(1)이 정의되지 않음(분모=0)을 확인하지 않음",
      "약분된 식을 원래 함수와 동일하게 봄",
      "연속의 3조건(정의·극한 존재·일치)을 순서대로 체크하지 않음",
      "극한값이 존재하면 자동으로 연속이라고 착각"
    ]
  },
  {
    id: "calc-4-1", unit: "미분법 – 곱의 미분",
    title: "y = x·sin(x) 를 x에 대해 미분하면?",
    wrongAnswer: "y' = cos(x) (sin(x)만 미분)",
    wrongAnswerImage: null,
    reasons: [
      "곱의 미분법 (uv)' = u'v + uv' 를 적용하지 않음",
      "x의 도함수가 1임을 빠뜨려 두 번째 항을 생략",
      "두 함수의 곱이 아닌 합성처럼 처리",
      "공식은 알지만 x 부분도 미분해야 한다는 걸 순간 놓침"
    ]
  },
  {
    id: "calc-4-2", unit: "미분법 – 합성함수",
    title: "y = sin(x²) 을 미분하면?",
    wrongAnswer: "y' = cos(x²) (겉함수만 미분)",
    wrongAnswerImage: null,
    reasons: [
      "합성함수 미분(연쇄법칙)을 적용하지 않음",
      "안쪽 함수 x²의 도함수 2x를 곱하지 않음",
      "겉함수만 미분하면 된다고 착각",
      "합성 미분과 곱의 미분을 혼동해 다른 공식을 적용"
    ]
  },
  {
    id: "calc-4-3", unit: "도함수의 활용 – 극값",
    title: "f(x) = x³ - 3x 의 극값을 구하면?",
    wrongAnswer: "f'(x)=0 인 x=±1 만 구하고 극값 여부 판단 생략",
    wrongAnswerImage: null,
    reasons: [
      "f'(x)=0 이면 항상 극값이라고 오해",
      "f' 의 부호 변화(양→음, 음→양)를 확인하지 않음",
      "증감표를 그리지 않고 x 값만 보고 답을 씀",
      "극댓값·극솟값 구분 없이 f'=0 의 해를 모두 극값으로 처리"
    ]
  },
  {
    id: "calc-5-1", unit: "적분법 – 치환적분",
    title: "∫ 2x·e^(x²) dx 를 구하면?",
    wrongAnswer: "x²·e^(x²) + C (각 항을 따로 적분)",
    wrongAnswerImage: null,
    reasons: [
      "u = x² 치환적분을 적용해야 함을 인식 못 함",
      "u = x² 으로 놓으면 du = 2x dx 임을 연결하지 못함",
      "e^(x²) 을 e^x 처럼 직접 적분",
      "적분과 미분의 역연산 관계를 혼동해 곱 미분 결과를 역산"
    ]
  },
  {
    id: "calc-5-2", unit: "정적분",
    title: "∫₀¹ (3x² + 2x) dx 의 값은?",
    wrongAnswer: "2 (F(1)-F(0) 계산에서 F(0) 처리 실수)",
    wrongAnswerImage: null,
    reasons: [
      "F(0) = 0 임을 확인하지 않아 대입값 오류",
      "부정적분을 구하는 것까지만 하고 한계 대입을 빠뜨림",
      "x³+x² 의 x=1 대입에서 덧셈 계산 실수",
      "정적분 계산 후 정리 단계에서 산술 오류"
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

  if (!item.id || !item.title || reasons.length < 2) {
    return null;
  }

  return {
    id: String(item.id),
    unit: item.unit ? String(item.unit) : "기타",
    title: String(item.title),
    wrongAnswer: item.wrongAnswer ? String(item.wrongAnswer) : "",
    wrongAnswerImage: typeof item.wrongAnswerImage === "string" && item.wrongAnswerImage.startsWith("data:image")
      ? item.wrongAnswerImage
      : null,
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
  const imgInput = document.querySelector("#new-oops-img");
  const imgPreview = document.querySelector("#new-oops-img-preview");

  let pendingImageDataUrl = null;

  if (imgInput) {
    imgInput.addEventListener("change", () => {
      const file = imgInput.files[0];
      if (!file) {
        pendingImageDataUrl = null;
        if (imgPreview) {
          imgPreview.innerHTML = "";
        }
        return;
      }

      if (!file.type.startsWith("image/")) {
        feedback.textContent = "이미지 파일만 첨부할 수 있습니다.";
        feedback.style.color = "#d94841";
        imgInput.value = "";
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        feedback.textContent = "이미지는 2MB 이하만 첨부 가능합니다.";
        feedback.style.color = "#d94841";
        imgInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        pendingImageDataUrl = event.target.result;
        if (imgPreview) {
          imgPreview.innerHTML = `<img src="${pendingImageDataUrl}" alt="오답 사진 미리보기">`;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  select.addEventListener("change", () => {
    state.activeOopsId = select.value;
    saveState();
    renderTeacherDashboard();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const unit = document.querySelector("#new-oops-unit").value;
    const title = document.querySelector("#new-oops-title").value.trim();
    const wrong = document.querySelector("#new-oops-wrong").value.trim();
    const reasonsRaw = document.querySelector("#new-oops-reasons").value;
    const reasons = reasonsRaw.split("\n").map((item) => item.trim()).filter(Boolean);

    if (!title) {
      feedback.textContent = "문제 문장을 입력해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    if (!wrong && !pendingImageDataUrl) {
      feedback.textContent = "오답 텍스트 또는 오답 사진을 입력해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    if (reasons.length < 2) {
      feedback.textContent = "공감 이유를 최소 2개 입력해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const prompt = {
      id: `oops-${Date.now()}`,
      unit,
      title,
      wrongAnswer: wrong,
      wrongAnswerImage: pendingImageDataUrl,
      reasons: reasons.slice(0, 6)
    };

    state.oopsArchive.unshift(prompt);
    state.activeOopsId = prompt.id;
    addLog(`교사가 새 오답 사례를 추가했어요. [${unit}] ${title}`);
    saveState();

    form.reset();
    pendingImageDataUrl = null;
    if (imgPreview) {
      imgPreview.innerHTML = "";
    }
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
  const wrongAnswerEl = document.querySelector("#oops-wrong-answer");
  const wrongImgEl = document.querySelector("#oops-wrong-img");
  const choiceList = document.querySelector("#oops-choice-list");

  if (!prompt) {
    question.textContent = "문제가 비어 있습니다.";
    if (wrongAnswerEl) {
      wrongAnswerEl.textContent = "-";
    }
    if (wrongImgEl) {
      wrongImgEl.innerHTML = "";
      wrongImgEl.hidden = true;
    }
    choiceList.innerHTML = "";
    return;
  }

  if (prompt.unit) {
    const unitTag = document.querySelector("#oops-unit-tag");
    if (unitTag) {
      unitTag.textContent = prompt.unit;
    }
  }

  question.textContent = prompt.title;

  if (wrongAnswerEl) {
    wrongAnswerEl.textContent = prompt.wrongAnswer || "";
    wrongAnswerEl.closest("p").hidden = !prompt.wrongAnswer;
  }

  if (wrongImgEl) {
    if (prompt.wrongAnswerImage) {
      wrongImgEl.innerHTML = `<img src="${prompt.wrongAnswerImage}" alt="오답 사진">`;
      wrongImgEl.hidden = false;
    } else {
      wrongImgEl.innerHTML = "";
      wrongImgEl.hidden = true;
    }
  }

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

  const byUnit = {};
  state.oopsArchive.forEach((prompt) => {
    const u = prompt.unit || "기타";
    if (!byUnit[u]) {
      byUnit[u] = [];
    }
    byUnit[u].push(prompt);
  });

  Object.entries(byUnit).forEach(([unit, prompts]) => {
    const group = document.createElement("optgroup");
    group.label = unit;
    prompts.forEach((prompt) => {
      const option = document.createElement("option");
      option.value = prompt.id;
      option.textContent = prompt.title;
      group.appendChild(option);
    });
    select.appendChild(group);
  });

  select.value = state.activeOopsId;

  const preview = document.querySelector("#active-oops-preview");
  if (preview) {
    const active = getActiveOopsPrompt();
    if (active) {
      const imgHtml = active.wrongAnswerImage
        ? `<img src="${active.wrongAnswerImage}" alt="오답 사진">`
        : "";
      const textHtml = active.wrongAnswer
        ? `<p class="oops-wrong-text"><strong>오답:</strong> ${active.wrongAnswer}</p>`
        : "";
      preview.innerHTML = `
        <p class="oops-preview-unit">[${active.unit || "기타"}]</p>
        <p class="oops-preview-title">${active.title}</p>
        ${textHtml}${imgHtml}
        <p class="oops-preview-reasons">공감 이유 ${active.reasons.length}개 설정됨</p>
      `;
    } else {
      preview.innerHTML = "<p class='section-copy'>선택된 문제가 없습니다.</p>";
    }
  }
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
