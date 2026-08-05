const STORAGE_KEY = "mathCareStudioDataV4";
const LEGACY_STORAGE_KEYS = ["mathCareStudioDataV3", "mathCareStudioDataV2"];
const STUDENT_SESSION_KEY = "mathCareStudentSessionV2";
const TEACHER_AUTH_KEY = "mathCareTeacherAuthV1";
const STUDENT_AUTH_STATE_KEY = "mathCareStudentAuthStateV1";
const TEACHER_AUTH_FLOW_STATE_KEY = "mathCareTeacherAuthFlowStateV1";
const BACKEND_URL_STORAGE_KEY = "mathCareBackendUrlV1";

const DEFAULT_TEACHER_GAS_WEB_APP_URL = "";
const TEACHER_AUTH_SESSION_HOURS = 12;
const AUTH_MAX_FAILS = 5;
const AUTH_LOCK_MINUTES = 10;

const weatherLabels = {
  sunny: { emoji: "☀️", label: "맑음" },
  cloudy: { emoji: "☁️", label: "흐림" },
  storm: { emoji: "⛈️", label: "천둥번개" },
  rainbow: { emoji: "🌈", label: "무지개" }
};

const UNIT_CATALOG = [
  {
    subject: "미적분Ⅰ",
    middleUnits: [
      {
        name: "함수의 극한과 연속",
        minorUnits: ["함수의 극한", "함수의 연속"]
      },
      {
        name: "미분",
        minorUnits: ["미분계수와 도함수", "도함수의 활용"]
      },
      {
        name: "적분",
        minorUnits: ["부정적분과 정적분", "정적분의 활용"]
      }
    ]
  }
];

const page = document.body.dataset.page;
let selectedWeather = "";
let teacherSelectedUnit = null;
const state = createEmptyState();
const appRuntime = {
  backendUrl: "",
  remoteSyncChain: Promise.resolve()
};

void initializeApp();

window.addEventListener("storage", (event) => {
  if (event.key === BACKEND_URL_STORAGE_KEY) {
    window.location.reload();
    return;
  }

  if (event.key !== getScopedStorageKey(STORAGE_KEY)) {
    return;
  }

  replaceState(loadLocalStateCache());

  if (page === "student") {
    renderBackendUi();
    renderStudentDashboard();
    renderStudentOopsWall();
  }
  if (page === "teacher-login") {
    renderBackendUi();
  }
  if (page === "teacher") {
    renderBackendUi();
    renderTeacherDashboard();
  }
});

async function initializeApp() {
  syncBackendUrlFromQuery();
  appRuntime.backendUrl = resolveBackendUrl();

  const shouldUseRemoteState = page === "student" || page === "teacher";
  const nextState = await loadState(shouldUseRemoteState);
  replaceState(nextState);

  if (page === "teacher-login") {
    bindBackendConfigForms();
    bindTeacherLoginForm();
    renderBackendUi();
    return;
  }

  if (page === "home") {
    renderBackendUi();
    return;
  }

  if (page === "student") {
    bindBackendConfigForms();
    renderBackendUi();
    setupTabs();
    setupWeatherOptions();
    bindStudentUnitSelects();
    bindStudentAuthForm();
    bindStudentUnitForm();
    bindStudentForms();
    bindStudentOopsBoard();
    bindStudentLogout();
    renderStudentDashboard();
    return;
  }

  if (page === "teacher") {
    guardTeacherPage();
    bindBackendConfigForms();
    renderBackendUi();
    bindTeacherControls();
    bindTeacherPanelToggles();
    bindTeacherUnitEntry();
    bindRosterSheetTools();
    bindRosterForm();
    renderTeacherDashboard();
  }
}

function normalizeClassCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeStudentNumber(value) {
  return String(value || "").trim();
}

function normalizeStudentName(value) {
  return String(value || "").trim();
}

function normalizeUnitText(value, fallback = "") {
  const next = String(value || "").trim();
  return next || fallback;
}

function createStudentKey(classCode, studentNumber) {
  return `${normalizeClassCode(classCode)}::${normalizeStudentNumber(studentNumber)}`;
}

function unitPath(subject, middleUnit, minorUnit) {
  return `${subject} · ${middleUnit} · ${minorUnit}`;
}

function createEmptyState() {
  return {
    weatherCheckins: [],
    habitChecks: [],
    logs: [],
    studentRoster: [],
    oopsPosts: [],
    oopsComments: []
  };
}

function replaceState(nextState) {
  state.weatherCheckins = nextState.weatherCheckins;
  state.habitChecks = nextState.habitChecks;
  state.logs = nextState.logs;
  state.studentRoster = nextState.studentRoster;
  state.oopsPosts = nextState.oopsPosts;
  state.oopsComments = nextState.oopsComments;
}

function normalizeBackendUrl(value) {
  const next = String(value || "").trim();
  if (!next) {
    return "";
  }

  try {
    const url = new URL(next);
    url.hash = "";
    return url.toString();
  } catch (error) {
    return "";
  }
}

function syncBackendUrlFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const backendUrl = normalizeBackendUrl(params.get("backend"));
  if (backendUrl) {
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, backendUrl);
  }
}

function resolveBackendUrl() {
  const stored = normalizeBackendUrl(localStorage.getItem(BACKEND_URL_STORAGE_KEY));
  if (stored) {
    return stored;
  }
  return normalizeBackendUrl(DEFAULT_TEACHER_GAS_WEB_APP_URL);
}

function getActiveBackendUrl() {
  return appRuntime.backendUrl || normalizeBackendUrl(DEFAULT_TEACHER_GAS_WEB_APP_URL);
}

function hasConfiguredBackend() {
  return Boolean(getActiveBackendUrl());
}

function setConfiguredBackendUrl(url) {
  const normalized = normalizeBackendUrl(url);
  if (normalized) {
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
  }
  appRuntime.backendUrl = normalized;
}

function getScopedStorageKey(baseKey) {
  const scope = hasConfiguredBackend() ? encodeURIComponent(getActiveBackendUrl()) : "local";
  return `${baseKey}::${scope}`;
}

function getScopedLocalItem(baseKey) {
  return localStorage.getItem(getScopedStorageKey(baseKey));
}

function setScopedLocalItem(baseKey, value) {
  localStorage.setItem(getScopedStorageKey(baseKey), value);
}

function removeScopedLocalItem(baseKey) {
  localStorage.removeItem(getScopedStorageKey(baseKey));
}

function getScopedSessionItem(baseKey) {
  return sessionStorage.getItem(getScopedStorageKey(baseKey));
}

function setScopedSessionItem(baseKey, value) {
  sessionStorage.setItem(getScopedStorageKey(baseKey), value);
}

function removeScopedSessionItem(baseKey) {
  sessionStorage.removeItem(getScopedStorageKey(baseKey));
}

function sanitizePersistedState(parsed) {
  const fallback = createEmptyState();
  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  const roster = Array.isArray(parsed.studentRoster)
    ? parsed.studentRoster.map(sanitizeRosterItem).filter(Boolean)
    : [];

  const legacyPosts = Array.isArray(parsed.studentOopsPosts)
    ? parsed.studentOopsPosts
      .map((item) => ({
        id: item.id || `legacy-${Date.now()}`,
        subject: normalizeUnitText(item.unitMajor, "기타"),
        middleUnit: normalizeUnitText(item.unitMiddle, "기타"),
        minorUnit: normalizeUnitText(item.unitMinor, "기타"),
        problemText: normalizeUnitText(item.title),
        problemImage: null,
        wrongText: normalizeUnitText(item.wrongAnswer),
        wrongImage: null,
        reasonText: "",
        anonymous: true,
        studentKey: normalizeUnitText(item.studentKey),
        studentName: "",
        classCode: "",
        studentNumber: "",
        at: item.at || new Date().toISOString()
      }))
      .filter((item) => item.problemText || item.wrongText)
    : [];

  const parsedPosts = Array.isArray(parsed.oopsPosts)
    ? parsed.oopsPosts.map(sanitizeOopsPost).filter(Boolean)
    : legacyPosts;

  const parsedComments = Array.isArray(parsed.oopsComments)
    ? parsed.oopsComments.map(sanitizeOopsComment).filter(Boolean)
    : [];

  return {
    weatherCheckins: Array.isArray(parsed.weatherCheckins) ? parsed.weatherCheckins : [],
    habitChecks: Array.isArray(parsed.habitChecks) ? parsed.habitChecks : [],
    logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    studentRoster: roster,
    oopsPosts: parsedPosts,
    oopsComments: parsedComments
  };
}

function loadLocalStateCache() {
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

  const sources = [
    getScopedLocalItem(STORAGE_KEY),
    ...LEGACY_STORAGE_KEYS.map((key) => getScopedLocalItem(key)),
    localStorage.getItem(STORAGE_KEY),
    ...LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key))
  ];

  const parsed = sources.map(parseSource).find(Boolean);
  return sanitizePersistedState(parsed);
}

async function loadState(useRemote = true) {
  const localState = loadLocalStateCache();
  if (!useRemote || !hasConfiguredBackend()) {
    return localState;
  }

  try {
    const payload = await callBackend("getState");
    const remoteState = sanitizePersistedState(payload.state);
    persistLocalStateSnapshot(remoteState);
    return remoteState;
  } catch (error) {
    setBackendRuntimeFeedback("원격 교실 데이터를 불러오지 못해 현재 브라우저 캐시를 사용합니다.", "error");
    return localState;
  }
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

function sanitizeOopsPost(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const subject = normalizeUnitText(item.subject, "기타");
  const middleUnit = normalizeUnitText(item.middleUnit, "기타");
  const minorUnit = normalizeUnitText(item.minorUnit, "기타");
  const problemText = normalizeUnitText(item.problemText);
  const wrongText = normalizeUnitText(item.wrongText);
  const reasonText = normalizeUnitText(item.reasonText);
  const problemImage = typeof item.problemImage === "string" && item.problemImage.startsWith("data:image")
    ? item.problemImage
    : null;
  const wrongImage = typeof item.wrongImage === "string" && item.wrongImage.startsWith("data:image")
    ? item.wrongImage
    : null;

  if (!problemText && !problemImage) {
    return null;
  }
  if (!wrongText && !wrongImage) {
    return null;
  }
  if (!reasonText) {
    return null;
  }

  return {
    id: String(item.id || `oops-${Date.now()}`),
    subject,
    middleUnit,
    minorUnit,
    problemText,
    problemImage,
    wrongText,
    wrongImage,
    reasonText,
    anonymous: item.anonymous !== false,
    studentKey: normalizeUnitText(item.studentKey),
    studentName: normalizeUnitText(item.studentName),
    classCode: normalizeUnitText(item.classCode),
    studentNumber: normalizeUnitText(item.studentNumber),
    at: item.at ? String(item.at) : new Date().toISOString()
  };
}

function sanitizeOopsComment(item) {
  if (!item || typeof item !== "object") {
    return null;
  }
  const postId = normalizeUnitText(item.postId);
  const comment = normalizeUnitText(item.comment);
  if (!postId || !comment) {
    return null;
  }
  return {
    id: String(item.id || `comment-${Date.now()}`),
    postId,
    comment,
    studentKey: normalizeUnitText(item.studentKey),
    studentName: normalizeUnitText(item.studentName),
    classCode: normalizeUnitText(item.classCode),
    studentNumber: normalizeUnitText(item.studentNumber),
    at: item.at ? String(item.at) : new Date().toISOString()
  };
}

function snapshotState() {
  return {
    weatherCheckins: [...state.weatherCheckins],
    habitChecks: [...state.habitChecks],
    logs: [...state.logs],
    studentRoster: [...state.studentRoster],
    oopsPosts: [...state.oopsPosts],
    oopsComments: [...state.oopsComments]
  };
}

function persistLocalStateSnapshot(nextState = state) {
  setScopedLocalItem(STORAGE_KEY, JSON.stringify(nextState));
}

function saveState() {
  const nextState = snapshotState();
  persistLocalStateSnapshot(nextState);

  if (!hasConfiguredBackend()) {
    return;
  }

  appRuntime.remoteSyncChain = appRuntime.remoteSyncChain
    .catch(() => null)
    .then(() => callBackend("saveState", {
      method: "POST",
      body: { state: nextState }
    }))
    .then(() => {
      setBackendRuntimeFeedback("교실 데이터가 시트에 저장되었습니다.", "success");
    })
    .catch(() => {
      setBackendRuntimeFeedback("원격 저장에 실패해 현재 브라우저에만 임시 저장되었습니다.", "error");
    });
}

async function callBackend(action, options = {}) {
  const endpoint = getTeacherGasAuthUrl();
  if (!endpoint) {
    throw new Error("backend-not-configured");
  }

  if ((options.method || "GET").toUpperCase() === "POST") {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action,
        ...options.body
      })
    });
    return parseBackendResponse(response);
  }

  const url = new URL(endpoint);
  url.searchParams.set("action", action);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store"
  });
  return parseBackendResponse(response);
}

async function parseBackendResponse(response) {
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error("invalid-backend-response");
  }

  if (!response.ok) {
    throw new Error(payload?.error || `backend-${response.status}`);
  }
  if (!payload || payload.ok === false) {
    throw new Error(payload?.error || "backend-request-failed");
  }
  return payload;
}

function buildPageUrl(pageName) {
  const url = new URL(pageName, window.location.href);
  if (hasConfiguredBackend()) {
    url.searchParams.set("backend", getActiveBackendUrl());
  }
  return url.toString();
}

function buildCurrentPageUrl() {
  const url = new URL(window.location.href);
  ["teacherAuth", "email", "ts", "state", "reason", "action", "callbackUrl"].forEach((key) => {
    url.searchParams.delete(key);
  });
  if (hasConfiguredBackend()) {
    url.searchParams.set("backend", getActiveBackendUrl());
  } else {
    url.searchParams.delete("backend");
  }
  return url.toString();
}

function buildStudentShareLink() {
  return hasConfiguredBackend() ? buildPageUrl("student.html") : "";
}

function buildTeacherShareLink() {
  return hasConfiguredBackend() ? buildPageUrl("teacher-login.html") : "";
}

function getToneColor(tone) {
  if (tone === "error") {
    return "#d94841";
  }
  if (tone === "success") {
    return "#0f9d94";
  }
  return "#35506d";
}

function applyFeedback(node, message, tone = "info") {
  if (!node) {
    return;
  }
  node.textContent = message;
  node.style.color = getToneColor(tone);
}

function setBackendRuntimeFeedback(message, tone = "info") {
  applyFeedback(document.querySelector("#backend-runtime-feedback"), message, tone);
}

function setElementDisabled(selector, disabled) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }
  element.querySelectorAll("input, select, button, textarea").forEach((node) => {
    if (disabled) {
      node.setAttribute("disabled", "disabled");
    } else {
      node.removeAttribute("disabled");
    }
  });
}

function renderBackendUi() {
  const backendUrl = getActiveBackendUrl();
  const backendInput = document.querySelector("#backend-url-input");
  const status = document.querySelector("#backend-connection-status");
  const loginButton = document.querySelector("#teacher-google-login");
  const studentShare = document.querySelector("#student-share-link");
  const teacherShare = document.querySelector("#teacher-share-link");
  const missingBackendForStudent = page === "student" && !backendUrl && state.studentRoster.length === 0;

  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const key = link.dataset.pageLink;
    const pageName = {
      home: "index.html",
      student: "student.html",
      "teacher-login": "teacher-login.html"
    }[key];

    if (!pageName) {
      return;
    }

    link.href = backendUrl ? buildPageUrl(pageName) : pageName;
  });

  if (backendInput) {
    backendInput.value = backendUrl;
  }

  if (status) {
    if (backendUrl) {
      applyFeedback(status, `현재 연결된 교실 저장소: ${backendUrl}`, "success");
    } else if (page === "student") {
      applyFeedback(status, "교사가 공유한 학생용 링크로 접속해야 이 교실 데이터에 연결됩니다.", "error");
    } else {
      applyFeedback(status, "먼저 본인 Google Apps Script 웹앱 URL을 저장해 주세요.", "error");
    }
  }

  if (loginButton) {
    loginButton.disabled = !backendUrl;
  }

  if (studentShare) {
    studentShare.value = buildStudentShareLink();
  }
  if (teacherShare) {
    teacherShare.value = buildTeacherShareLink();
  }

  setElementDisabled("#student-auth-stage", missingBackendForStudent);
}

function bindBackendConfigForms() {
  const form = document.querySelector("#backend-config-form");
  const input = document.querySelector("#backend-url-input");
  const feedback = document.querySelector("#backend-config-feedback");
  const clearButton = document.querySelector("#backend-clear-btn");
  const copyStudentButton = document.querySelector("#copy-student-link");
  const copyTeacherButton = document.querySelector("#copy-teacher-link");
  const shareFeedback = document.querySelector("#backend-share-feedback");

  if (form && input && feedback) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const backendUrl = normalizeBackendUrl(input.value);
      if (!backendUrl) {
        applyFeedback(feedback, "유효한 Apps Script 웹앱 URL을 입력해 주세요.", "error");
        return;
      }

      setConfiguredBackendUrl(backendUrl);
      applyFeedback(feedback, "교실 저장소 주소를 저장했습니다. 새 주소로 다시 불러옵니다.", "success");
      window.location.href = buildPageUrl(page === "teacher" ? "teacher.html" : "teacher-login.html");
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      setConfiguredBackendUrl("");
      setTeacherAuthenticated(null);
      window.location.href = "teacher-login.html";
    });
  }

  if (copyStudentButton) {
    copyStudentButton.addEventListener("click", async () => {
      const link = buildStudentShareLink();
      if (!link) {
        applyFeedback(shareFeedback, "먼저 Apps Script URL을 저장해 주세요.", "error");
        return;
      }
      const copied = await copyText(link);
      applyFeedback(shareFeedback, copied ? "학생용 링크를 복사했습니다." : "복사에 실패했습니다. 링크를 직접 선택해 복사해 주세요.", copied ? "success" : "error");
    });
  }

  if (copyTeacherButton) {
    copyTeacherButton.addEventListener("click", async () => {
      const link = buildTeacherShareLink();
      if (!link) {
        applyFeedback(shareFeedback, "먼저 Apps Script URL을 저장해 주세요.", "error");
        return;
      }
      const copied = await copyText(link);
      applyFeedback(shareFeedback, copied ? "교사용 로그인 링크를 복사했습니다." : "복사에 실패했습니다. 링크를 직접 선택해 복사해 주세요.", copied ? "success" : "error");
    });
  }
}

async function copyText(value) {
  if (!value) {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "readonly");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(helper);
  return copied;
}

function getStudentSession() {
  try {
    const raw = getScopedLocalItem(STUDENT_SESSION_KEY);
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
  setScopedLocalItem(STUDENT_SESSION_KEY, JSON.stringify(session));
}

function clearStudentSession() {
  removeScopedLocalItem(STUDENT_SESSION_KEY);
}

function loadStudentAuthState() {
  try {
    const raw = getScopedLocalItem(STUDENT_AUTH_STATE_KEY);
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
  setScopedLocalItem(STUDENT_AUTH_STATE_KEY, JSON.stringify(authState));
}

function getRemainingLockMs(authState) {
  return Math.max(0, authState.lockedUntil - Date.now());
}

function formatRemainingMinutes(ms) {
  return Math.ceil(ms / 60000);
}

function guardTeacherPage() {
  if (!isTeacherAuthenticated()) {
    window.location.href = buildPageUrl("teacher-login.html");
  }
}

function isTeacherAuthenticated() {
  try {
    const raw = getScopedSessionItem(TEACHER_AUTH_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.identity || !parsed.expiresAt) {
      return false;
    }
    if (Date.now() > Number(parsed.expiresAt)) {
      removeScopedSessionItem(TEACHER_AUTH_KEY);
      return false;
    }
    return true;
  } catch (error) {
    removeScopedSessionItem(TEACHER_AUTH_KEY);
    return false;
  }
}

function setTeacherAuthenticated(profile) {
  if (profile && profile.identity) {
    const issuedAt = Number(profile.issuedAt) || Date.now();
    const expiresAt = issuedAt + TEACHER_AUTH_SESSION_HOURS * 60 * 60 * 1000;
    setScopedSessionItem(TEACHER_AUTH_KEY, JSON.stringify({
      identity: String(profile.identity),
      issuedAt,
      expiresAt
    }));
  } else {
    removeScopedSessionItem(TEACHER_AUTH_KEY);
  }
}

function getTeacherGasAuthUrl() {
  return getActiveBackendUrl();
}

function createAuthFlowStateToken() {
  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `state-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function consumeTeacherAuthCallback(feedback) {
  const params = new URLSearchParams(window.location.search);
  const result = params.get("teacherAuth");
  if (!result) {
    return;
  }

  const email = normalizeUnitText(params.get("email"));
  const teacherId = normalizeUnitText(params.get("teacherId"));
  const identity = email || teacherId;
  const tsRaw = Number(params.get("ts"));
  const returnedState = normalizeUnitText(params.get("state"));
  const expectedState = normalizeUnitText(getScopedSessionItem(TEACHER_AUTH_FLOW_STATE_KEY));
  const now = Date.now();
  removeScopedSessionItem(TEACHER_AUTH_FLOW_STATE_KEY);

  if (
    result === "ok"
    && identity
    && returnedState
    && expectedState
    && returnedState === expectedState
    && Number.isFinite(tsRaw)
    && Math.abs(now - tsRaw) <= 10 * 60 * 1000
  ) {
    setTeacherAuthenticated({ identity, issuedAt: tsRaw });
    if (feedback) {
      if (email) {
        feedback.textContent = `${email} 계정으로 인증되었습니다. 교사 화면으로 이동합니다.`;
      } else {
        feedback.textContent = "구글 인증이 완료되었습니다. 교사 화면으로 이동합니다.";
      }
      feedback.style.color = "#0f9d94";
    }
    window.history.replaceState({}, "", buildCurrentPageUrl());
    window.location.href = buildPageUrl("teacher.html");
    return;
  }

  if (feedback) {
    feedback.textContent = "구글 인증에 실패했습니다. 다시 시도해 주세요.";
    feedback.style.color = "#d94841";
  }
  window.history.replaceState({}, "", buildCurrentPageUrl());
}

function bindTeacherLoginForm() {
  const form = document.querySelector("#teacher-login-form");
  const loginButton = document.querySelector("#teacher-google-login");
  const feedback = document.querySelector("#teacher-login-feedback");

  consumeTeacherAuthCallback(feedback);

  if (isTeacherAuthenticated()) {
    window.location.href = "teacher.html";
    return;
  }

  if (!form || !loginButton || !feedback) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const endpoint = getTeacherGasAuthUrl();
    if (!endpoint) {
      feedback.textContent = "먼저 이 교실의 Apps Script 웹앱 URL을 저장해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    let authUrl;
    try {
      authUrl = new URL(endpoint);
    } catch (error) {
      feedback.textContent = "TEACHER_GAS_WEB_APP_URL 값이 올바른 URL 형식이 아닙니다.";
      feedback.style.color = "#d94841";
      return;
    }

    const callbackUrl = buildPageUrl("teacher-login.html");
    const flowState = createAuthFlowStateToken();
    setScopedSessionItem(TEACHER_AUTH_FLOW_STATE_KEY, flowState);

    authUrl.searchParams.set("action", "startTeacherAuth");
    authUrl.searchParams.set("callbackUrl", callbackUrl);
    authUrl.searchParams.set("state", flowState);

    feedback.textContent = "구글 인증 페이지로 이동합니다...";
    feedback.style.color = "#0f9d94";
    window.location.href = authUrl.toString();
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
      const nextAuthState = { failCount: nextFailCount, lockedUntil: 0 };

      if (nextFailCount >= AUTH_MAX_FAILS) {
        nextAuthState.lockedUntil = Date.now() + AUTH_LOCK_MINUTES * 60000;
        nextAuthState.failCount = 0;
        feedback.textContent = `인증 ${AUTH_MAX_FAILS}회 실패로 ${AUTH_LOCK_MINUTES}분 잠금되었습니다.`;
      } else {
        feedback.textContent = `명단 정보가 일치하지 않습니다. 남은 시도 ${AUTH_MAX_FAILS - nextFailCount}회.`;
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
      subject: "",
      middleUnit: "",
      minorUnit: "",
      verifiedAt: new Date().toISOString()
    });

    saveStudentAuthState({ failCount: 0, lockedUntil: 0 });
    feedback.textContent = `${matched.studentName} 학생 인증 완료`;
    feedback.style.color = "#0f9d94";
    form.reset();
    renderStudentDashboard();
    renderStudentOopsWall();
  });
}

function bindStudentUnitForm() {
  const form = document.querySelector("#student-unit-form");
  const feedback = document.querySelector("#unit-feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const session = getCurrentStudentFromSession();
    if (!session) {
      feedback.textContent = "먼저 학생 인증을 완료해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const subject = normalizeUnitText(document.querySelector("#unit-subject")?.value, "");
    const middleUnit = normalizeUnitText(document.querySelector("#unit-middle")?.value, "");
    const minorUnit = normalizeUnitText(document.querySelector("#unit-minor")?.value, "");

    if (!subject || !middleUnit || !minorUnit) {
      feedback.textContent = "과목, 중단원, 소단원을 모두 선택해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    setStudentSession({
      ...session,
      subject,
      middleUnit,
      minorUnit,
      unitSelectedAt: new Date().toISOString()
    });

    feedback.textContent = "단원 선택이 완료되었습니다.";
    feedback.style.color = "#0f9d94";
    renderStudentDashboard();
    renderStudentOopsWall();
  });
}

function bindStudentUnitSelects() {
  const subjectNode = document.querySelector("#unit-subject");
  const middleNode = document.querySelector("#unit-middle");
  const minorNode = document.querySelector("#unit-minor");
  if (!subjectNode || !middleNode || !minorNode) {
    return;
  }

  subjectNode.addEventListener("change", () => {
    populateMiddleUnitOptions(subjectNode, middleNode, minorNode);
  });

  middleNode.addEventListener("change", () => {
    populateMinorUnitOptions(subjectNode, middleNode, minorNode);
  });

  populateUnitCatalogSelects(subjectNode, middleNode, minorNode);
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
      subject: session.subject,
      middleUnit: session.middleUnit,
      minorUnit: session.minorUnit,
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
      subject: session.subject,
      middleUnit: session.middleUnit,
      minorUnit: session.minorUnit,
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

function bindStudentOopsBoard() {
  const form = document.querySelector("#oops-form");
  const feedback = document.querySelector("#oops-feedback");
  const wall = document.querySelector("#oops-wall-list");

  document.querySelector("#oops-problem-img")?.addEventListener("change", () => {
    previewImage("#oops-problem-img", "#oops-problem-preview");
  });
  document.querySelector("#oops-wrong-img")?.addEventListener("change", () => {
    previewImage("#oops-wrong-img", "#oops-wrong-preview");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const session = getCurrentStudentFromSession();
    if (!session) {
      feedback.textContent = "먼저 학생 입장 인증을 완료해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const problemText = normalizeUnitText(document.querySelector("#oops-problem-text")?.value);
    const wrongText = normalizeUnitText(document.querySelector("#oops-wrong-text")?.value);
    const reasonText = normalizeUnitText(document.querySelector("#oops-reason-text")?.value);
    const anonymous = document.querySelector("#oops-anonymous")?.checked !== false;
    const problemImageFile = document.querySelector("#oops-problem-img")?.files?.[0] || null;
    const wrongImageFile = document.querySelector("#oops-wrong-img")?.files?.[0] || null;

    if (!problemText && !problemImageFile) {
      feedback.textContent = "문제는 텍스트 또는 사진 중 하나 이상으로 올려 주세요.";
      feedback.style.color = "#d94841";
      return;
    }
    if (!wrongText && !wrongImageFile) {
      feedback.textContent = "오답은 텍스트 또는 사진 중 하나 이상으로 올려 주세요.";
      feedback.style.color = "#d94841";
      return;
    }
    if (!reasonText) {
      feedback.textContent = "오답이 나온 이유를 입력해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const problemImage = await fileToDataUrl(problemImageFile);
    const wrongImage = await fileToDataUrl(wrongImageFile);

    state.oopsPosts.unshift({
      id: `oops-${Date.now()}`,
      subject: session.subject,
      middleUnit: session.middleUnit,
      minorUnit: session.minorUnit,
      problemText,
      problemImage,
      wrongText,
      wrongImage,
      reasonText,
      anonymous,
      studentKey: session.studentKey,
      studentName: session.studentName,
      classCode: session.classCode,
      studentNumber: session.studentNumber,
      at: new Date().toISOString()
    });

    addLog(`${session.studentName} 학생이 오답 담벼락에 새 글을 올렸어요.`);
    saveState();
    form.reset();
    clearPreview("#oops-problem-preview");
    clearPreview("#oops-wrong-preview");
    feedback.textContent = "오답 담벼락에 공유되었습니다.";
    feedback.style.color = "#0f9d94";

    renderStudentOopsWall();
    renderStudentDashboard();
  });

  wall.addEventListener("submit", (event) => {
    const formEl = event.target.closest(".oops-comment-form");
    if (!formEl) {
      return;
    }
    event.preventDefault();

    const session = getCurrentStudentFromSession();
    if (!session) {
      return;
    }

    const postId = formEl.dataset.postId;
    const input = formEl.querySelector("input[name='oopsComment']");
    const comment = normalizeUnitText(input.value);
    if (!comment) {
      return;
    }

    state.oopsComments.unshift({
      id: `comment-${Date.now()}`,
      postId,
      comment,
      studentKey: session.studentKey,
      studentName: session.studentName,
      classCode: session.classCode,
      studentNumber: session.studentNumber,
      at: new Date().toISOString()
    });

    addLog(`${session.studentName} 학생이 오답 글에 공감 댓글을 남겼어요.`);
    saveState();
    renderStudentOopsWall();
  });
}

function previewImage(inputSelector, previewSelector) {
  const input = document.querySelector(inputSelector);
  const preview = document.querySelector(previewSelector);
  if (!input || !preview) {
    return;
  }
  const file = input.files?.[0];
  if (!file || !file.type.startsWith("image/")) {
    preview.innerHTML = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    preview.innerHTML = `<img src="${event.target.result}" alt="업로드 미리보기">`;
  };
  reader.readAsDataURL(file);
}

function clearPreview(previewSelector) {
  const preview = document.querySelector(previewSelector);
  if (preview) {
    preview.innerHTML = "";
  }
}

function fileToDataUrl(file) {
  if (!file) {
    return Promise.resolve(null);
  }
  if (!file.type.startsWith("image/")) {
    return Promise.resolve(null);
  }
  if (file.size > 2 * 1024 * 1024) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function getSessionUnit(session) {
  if (!session || !hasSelectedUnit(session)) {
    return null;
  }
  return {
    subject: normalizeUnitText(session.subject),
    middleUnit: normalizeUnitText(session.middleUnit),
    minorUnit: normalizeUnitText(session.minorUnit)
  };
}

function hasSelectedUnit(session) {
  return Boolean(
    session
    && normalizeUnitText(session.subject)
    && normalizeUnitText(session.middleUnit)
    && normalizeUnitText(session.minorUnit)
  );
}

function isPostInUnit(post, unit) {
  if (!unit) {
    return true;
  }
  return post.subject === unit.subject && post.middleUnit === unit.middleUnit && post.minorUnit === unit.minorUnit;
}

function renderStudentOopsWall() {
  const list = document.querySelector("#oops-wall-list");
  const unitBadge = document.querySelector("#oops-current-unit");
  if (!list) {
    return;
  }

  const session = getCurrentStudentFromSession();
  const unit = getSessionUnit(session);

  if (!session) {
    list.innerHTML = "<p class='section-copy'>입장 인증 후 담벼락이 열립니다.</p>";
    if (unitBadge) {
      unitBadge.textContent = "";
    }
    return;
  }

  if (unitBadge) {
    unitBadge.textContent = unit
      ? `현재 글 등록 단원: ${unitPath(unit.subject, unit.middleUnit, unit.minorUnit)}`
      : "단원을 선택하면 현재 수업 단원으로 글이 등록됩니다.";
  }

  const posts = state.oopsPosts
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

  if (posts.length === 0) {
    list.innerHTML = "<p class='section-copy'>아직 공유된 오답 글이 없어요. 첫 글을 남겨보세요.</p>";
    return;
  }

  list.innerHTML = "";
  posts.forEach((post) => {
    const comments = state.oopsComments
      .filter((item) => item.postId === post.id)
      .sort((a, b) => String(a.at).localeCompare(String(b.at)));

    const card = document.createElement("article");
    card.className = "oops-wall-item";

    const problemTextHtml = post.problemText ? `<p class="oops-line"><strong>문제:</strong> ${post.problemText}</p>` : "";
    const wrongTextHtml = post.wrongText ? `<p class="oops-line"><strong>오답:</strong> ${post.wrongText}</p>` : "";
    const problemImageHtml = post.problemImage ? `<img src="${post.problemImage}" alt="문제 사진">` : "";
    const wrongImageHtml = post.wrongImage ? `<img src="${post.wrongImage}" alt="오답 사진">` : "";

    card.innerHTML = `
      <p class="oops-preview-unit">${unitPath(post.subject, post.middleUnit, post.minorUnit)}</p>
      ${problemTextHtml}
      ${problemImageHtml}
      ${wrongTextHtml}
      ${wrongImageHtml}
      <p class="oops-line"><strong>오답이 나온 이유:</strong> ${post.reasonText}</p>
      <p class="oops-wall-meta">${post.anonymous ? "익명" : `${post.classCode}-${post.studentNumber} ${post.studentName}`}</p>
      <ul class="oops-comment-list">
        ${comments.length === 0 ? "<li>아직 댓글이 없어요.</li>" : comments.map((comment, idx) => `<li>익명 ${idx + 1}: ${comment.comment}</li>`).join("")}
      </ul>
      <form class="oops-comment-form" data-post-id="${post.id}">
        <input name="oopsComment" maxlength="80" placeholder="공감 댓글 남기기">
        <button class="ghost-btn small-btn" type="submit">댓글</button>
      </form>
    `;

    list.appendChild(card);
  });
}

function addLog(message) {
  const stamp = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
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
  const unitSelected = hasSelectedUnit(session);

  if (!session) {
    title.textContent = "입장 인증 후 개인 누적이 표시됩니다.";
    if (sessionInfo) {
      sessionInfo.textContent = "학생 정보";
    }
    logoutBtn.disabled = true;
  } else {
    title.textContent = `${session.studentName} 학생의 누적 리포트`;
    if (sessionInfo) {
      sessionInfo.textContent = unitSelected
        ? `${session.classCode} · ${session.studentNumber}번 · ${session.studentName} | 현재 단원: ${unitPath(session.subject, session.middleUnit, session.minorUnit)}`
        : `${session.classCode} · ${session.studentNumber}번 · ${session.studentName} | 단원 선택 필요`;
    }
    logoutBtn.disabled = false;
  }

  setStudentStageAccess(Boolean(session));
  setStudentActivityAccess(Boolean(session) && unitSelected);
  syncStudentUnitForm(session);

  const weatherMine = session ? state.weatherCheckins.filter((item) => item.studentKey === session.studentKey) : [];
  const oopsMine = session ? state.oopsPosts.filter((item) => item.studentKey === session.studentKey) : [];
  const habitMine = session ? state.habitChecks.filter((item) => item.studentKey === session.studentKey) : [];

  document.querySelector("#my-total-weather").textContent = String(weatherMine.length);
  document.querySelector("#my-total-oops").textContent = String(oopsMine.length);
  document.querySelector("#my-total-habit").textContent = String(habitMine.length);

  renderWeatherCards("#my-weather-summary", weatherMine);
  renderRankList(
    "#my-oops-summary",
    Object.entries(countBy(oopsMine, (item) => item.reasonText)).sort((a, b) => b[1] - a[1]),
    "아직 등록한 오답 이유가 없어요.",
    "회"
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

  toggleStudentInteraction(Boolean(session) && unitSelected);
  renderStudentOopsWall();
}

function setStudentStageAccess(enabled) {
  const authStage = document.querySelector("#student-auth-stage");
  const appStage = document.querySelector("#student-app-stage");
  const mainEl = document.querySelector("main");

  if (authStage) {
    authStage.hidden = enabled;
  }
  if (appStage) {
    appStage.hidden = !enabled;
  }
  if (mainEl) {
    mainEl.classList.toggle("layout", enabled);
    mainEl.classList.toggle("layout-auth", !enabled);
  }
}

function setStudentActivityAccess(enabled) {
  const activityStage = document.querySelector("#student-activity-stage");
  const dashboardStage = document.querySelector("#student-dashboard-stage");

  if (activityStage) {
    activityStage.hidden = !enabled;
  }
  if (dashboardStage) {
    dashboardStage.hidden = !enabled;
  }
}

function syncStudentUnitForm(session) {
  const subject = document.querySelector("#unit-subject");
  const middle = document.querySelector("#unit-middle");
  const minor = document.querySelector("#unit-minor");
  if (!subject || !middle || !minor) {
    return;
  }

  populateUnitCatalogSelects(subject, middle, minor, session || null);
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

function bindTeacherControls() {
  document.querySelector("#reset-all").addEventListener("click", () => {
    state.weatherCheckins = [];
    state.habitChecks = [];
    state.logs = [];
    state.oopsPosts = [];
    state.oopsComments = [];
    saveState();
    renderTeacherDashboard();
  });

  document.querySelector("#teacher-logout").addEventListener("click", () => {
    setTeacherAuthenticated(null);
    window.location.href = buildPageUrl("teacher-login.html");
  });
}

function bindTeacherPanelToggles() {
  document.querySelectorAll(".teacher-toggle-panel").forEach((panel) => {
    const button = panel.querySelector(".panel-toggle-btn");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const nextCollapsed = panel.dataset.panelCollapsed !== "true";
      panel.dataset.panelCollapsed = String(nextCollapsed);
      button.textContent = nextCollapsed ? "펼치기" : "접기";
      button.setAttribute("aria-expanded", String(!nextCollapsed));
    });
  });
}

function bindTeacherUnitEntry() {
  const form = document.querySelector("#teacher-unit-entry-form");
  const feedback = document.querySelector("#teacher-entry-feedback");
  const subjectNode = document.querySelector("#teacher-entry-subject");
  const middleNode = document.querySelector("#teacher-entry-middle");
  const minorNode = document.querySelector("#teacher-entry-minor");
  const backButton = document.querySelector("#teacher-back-home");

  if (!form || !feedback || !subjectNode || !middleNode || !minorNode || !backButton) {
    return;
  }

  subjectNode.addEventListener("change", () => {
    populateMiddleUnitOptions(subjectNode, middleNode, minorNode, null);
    feedback.textContent = "";
  });
  middleNode.addEventListener("change", () => {
    populateMinorUnitOptions(subjectNode, middleNode, minorNode, null);
    feedback.textContent = "";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const subject = normalizeUnitText(subjectNode.value);
    const middleUnit = normalizeUnitText(middleNode.value);
    const minorUnit = normalizeUnitText(minorNode.value);
    if (!subject || !middleUnit || !minorUnit) {
      feedback.textContent = "과목, 중단원, 소단원을 모두 선택해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    teacherSelectedUnit = { subject, middleUnit, minorUnit };
    feedback.textContent = "";
    renderTeacherDashboard();
  });

  backButton.addEventListener("click", () => {
    teacherSelectedUnit = null;
    renderTeacherDashboard();
  });
}

function renderTeacherDashboard() {
  document.querySelector("#total-weather").textContent = String(state.weatherCheckins.length);
  document.querySelector("#total-oops").textContent = String(state.oopsPosts.length);
  document.querySelector("#total-habit").textContent = String(state.habitChecks.length);

  renderWeatherCards("#weather-summary", state.weatherCheckins);

  renderRankList(
    "#oops-summary",
    Object.entries(countBy(state.oopsPosts, (item) => item.reasonText)).sort((a, b) => b[1] - a[1]),
    "아직 등록된 오답 이유가 없어요.",
    "회"
  );

  const flatHabits = state.habitChecks.flatMap((item) => item.habits);
  renderRankList(
    "#habit-summary",
    Object.entries(countBy(flatHabits, (item) => item)).sort((a, b) => b[1] - a[1]),
    "아직 체크된 해빗이 없어요.",
    "회"
  );

  renderTeacherUnitEntryOptions();
  renderRosterTable();

  setTeacherStage(Boolean(teacherSelectedUnit));

  if (!teacherSelectedUnit) {
    return;
  }

  const classWeather = filterEntriesByUnit(state.weatherCheckins, teacherSelectedUnit);
  const classOops = filterEntriesByUnit(state.oopsPosts, teacherSelectedUnit);
  const classHabit = filterEntriesByUnit(state.habitChecks, teacherSelectedUnit);

  document.querySelector("#teacher-current-unit-label").textContent = unitPath(
    teacherSelectedUnit.subject,
    teacherSelectedUnit.middleUnit,
    teacherSelectedUnit.minorUnit
  );
  document.querySelector("#class-total-weather").textContent = String(classWeather.length);
  document.querySelector("#class-total-oops").textContent = String(classOops.length);
  document.querySelector("#class-total-habit").textContent = String(classHabit.length);

  renderWeatherCards("#class-weather-summary", classWeather);

  const classHabits = classHabit.flatMap((item) => item.habits);
  const habitEntries = Object.entries(countBy(classHabits, (item) => item)).sort((a, b) => b[1] - a[1]);
  renderRankList("#class-habit-summary", habitEntries, "아직 체크된 해빗이 없어요.", "회");
  renderRankList("#class-habit-ranking", habitEntries, "아직 체크된 해빗이 없어요.", "회");

  renderTeacherStudentTable(teacherSelectedUnit);
  renderTeacherOopsWall(teacherSelectedUnit);
  renderTeacherActivityFeed(teacherSelectedUnit);
  renderTeacherHabitLog(teacherSelectedUnit);
}

function setSelectOptions(select, values, preferredValue, includeAll = true) {
  select.innerHTML = "";
  if (includeAll) {
    const allOption = document.createElement("option");
    allOption.value = "ALL";
    allOption.textContent = "전체";
    select.appendChild(allOption);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (preferredValue && values.includes(preferredValue)) {
    select.value = preferredValue;
    return;
  }

  if (includeAll) {
    select.value = "ALL";
    return;
  }

  select.value = values[0] || "";
}

function renderTeacherUnitEntryOptions() {
  const subjectNode = document.querySelector("#teacher-entry-subject");
  const middleNode = document.querySelector("#teacher-entry-middle");
  const minorNode = document.querySelector("#teacher-entry-minor");
  const feedback = document.querySelector("#teacher-entry-feedback");
  if (!subjectNode || !middleNode || !minorNode || !feedback) {
    return;
  }

  const currentSelection = teacherSelectedUnit || {
    subject: normalizeUnitText(subjectNode.value),
    middleUnit: normalizeUnitText(middleNode.value),
    minorUnit: normalizeUnitText(minorNode.value)
  };

  populateUnitCatalogSelects(
    subjectNode,
    middleNode,
    minorNode,
    currentSelection.subject ? currentSelection : null
  );

  if (!teacherSelectedUnit) {
    feedback.textContent = "";
  }
}

function populateUnitCatalogSelects(subjectNode, middleNode, minorNode, selectedUnit = null) {
  const subjectValues = UNIT_CATALOG.map((item) => item.subject);
  setSelectOptions(subjectNode, subjectValues, selectedUnit?.subject || "", false);
  ensurePlaceholderOption(subjectNode, "과목 선택");

  if (selectedUnit?.subject) {
    subjectNode.value = selectedUnit.subject;
  } else {
    subjectNode.value = "";
  }

  populateMiddleUnitOptions(subjectNode, middleNode, minorNode, selectedUnit);
}

function populateMiddleUnitOptions(subjectNode, middleNode, minorNode, selectedUnit = null) {
  const subjectConfig = findSubjectConfig(subjectNode.value);
  const middleValues = subjectConfig ? subjectConfig.middleUnits.map((item) => item.name) : [];
  setSelectOptions(middleNode, middleValues, selectedUnit?.middleUnit || "", false);
  ensurePlaceholderOption(middleNode, "중단원 선택");

  if (!subjectNode.value) {
    middleNode.value = "";
    minorNode.innerHTML = "";
    ensurePlaceholderOption(minorNode, "소단원 선택");
    minorNode.value = "";
    return;
  }

  if (selectedUnit?.middleUnit && middleValues.includes(selectedUnit.middleUnit)) {
    middleNode.value = selectedUnit.middleUnit;
  } else if (!selectedUnit) {
    middleNode.value = "";
  }

  populateMinorUnitOptions(subjectNode, middleNode, minorNode, selectedUnit);
}

function populateMinorUnitOptions(subjectNode, middleNode, minorNode, selectedUnit = null) {
  const middleConfig = findMiddleUnitConfig(subjectNode.value, middleNode.value);
  const minorValues = middleConfig ? middleConfig.minorUnits : [];
  setSelectOptions(minorNode, minorValues, selectedUnit?.minorUnit || "", false);
  ensurePlaceholderOption(minorNode, "소단원 선택");

  if (!middleNode.value) {
    minorNode.value = "";
    return;
  }

  if (selectedUnit?.minorUnit && minorValues.includes(selectedUnit.minorUnit)) {
    minorNode.value = selectedUnit.minorUnit;
    return;
  }

  if (!selectedUnit) {
    minorNode.value = "";
  }
}

function ensurePlaceholderOption(select, label) {
  if (!select.querySelector('option[value=""]')) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = label;
    select.insertBefore(placeholder, select.firstChild);
  }
}

function findSubjectConfig(subject) {
  return UNIT_CATALOG.find((item) => item.subject === subject) || null;
}

function findMiddleUnitConfig(subject, middleUnit) {
  const subjectConfig = findSubjectConfig(subject);
  if (!subjectConfig) {
    return null;
  }
  return subjectConfig.middleUnits.find((item) => item.name === middleUnit) || null;
}

function filterEntriesByUnit(items, unit) {
  return items.filter((item) => item && item.subject === unit.subject && item.middleUnit === unit.middleUnit && item.minorUnit === unit.minorUnit);
}

function renderTeacherOopsWall(unit) {
  const target = document.querySelector("#teacher-oops-wall");
  if (!target) {
    return;
  }

  const filtered = filterEntriesByUnit(state.oopsPosts, unit)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

  if (filtered.length === 0) {
    target.innerHTML = "<p class='section-copy'>조건에 맞는 오답 글이 없습니다.</p>";
    return;
  }

  target.innerHTML = "";
  filtered.forEach((post) => {
    const comments = state.oopsComments
      .filter((item) => item.postId === post.id)
      .sort((a, b) => String(a.at).localeCompare(String(b.at)));

    const card = document.createElement("article");
    card.className = "oops-wall-item teacher-view";
    card.innerHTML = `
      <p class="oops-preview-unit">${unitPath(post.subject, post.middleUnit, post.minorUnit)}</p>
      <p class="oops-line"><strong>작성 학생:</strong> ${post.classCode}-${post.studentNumber} ${post.studentName}</p>
      ${post.problemText ? `<p class="oops-line"><strong>문제:</strong> ${post.problemText}</p>` : ""}
      ${post.problemImage ? `<img src="${post.problemImage}" alt="문제 사진">` : ""}
      ${post.wrongText ? `<p class="oops-line"><strong>오답:</strong> ${post.wrongText}</p>` : ""}
      ${post.wrongImage ? `<img src="${post.wrongImage}" alt="오답 사진">` : ""}
      <p class="oops-line"><strong>오답이 나온 이유:</strong> ${post.reasonText}</p>
      <ul class="oops-comment-list">
        ${comments.length === 0 ? "<li>댓글 없음</li>" : comments.map((comment) => `<li>${comment.classCode}-${comment.studentNumber} ${comment.studentName}: ${comment.comment}</li>`).join("")}
      </ul>
    `;
    target.appendChild(card);
  });
}

function renderTeacherActivityFeed(unit) {
  const recentLog = document.querySelector("#recent-log");
  if (!recentLog) {
    return;
  }

  const entries = [
    ...filterEntriesByUnit(state.weatherCheckins, unit).map((item) => ({
      at: item.at,
      text: `${item.classCode}-${item.studentNumber} ${item.studentName} · 감정 ${weatherLabels[item.weather]?.label || item.weather}`
    })),
    ...filterEntriesByUnit(state.oopsPosts, unit).map((item) => ({
      at: item.at,
      text: `${item.classCode}-${item.studentNumber} ${item.studentName} · 오답 글 등록`
    })),
    ...filterEntriesByUnit(state.habitChecks, unit).map((item) => ({
      at: item.at,
      text: `${item.classCode}-${item.studentNumber} ${item.studentName} · 해빗 ${item.habits.length}개 체크`
    }))
  ].sort((a, b) => String(b.at).localeCompare(String(a.at)));

  recentLog.innerHTML = "";
  if (entries.length === 0) {
    recentLog.innerHTML = "<li>이 수업의 최근 활동이 아직 없습니다.</li>";
    return;
  }

  entries.slice(0, 12).forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${formatTimestamp(entry.at)} ${entry.text}`;
    recentLog.appendChild(li);
  });
}

function renderTeacherHabitLog(unit) {
  const target = document.querySelector("#class-habit-log");
  if (!target) {
    return;
  }

  const entries = filterEntriesByUnit(state.habitChecks, unit)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

  target.innerHTML = "";
  if (entries.length === 0) {
    target.innerHTML = "<li>이 수업의 해빗 체크가 아직 없습니다.</li>";
    return;
  }

  entries.slice(0, 12).forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${formatTimestamp(entry.at)} ${entry.classCode}-${entry.studentNumber} ${entry.studentName}: ${entry.habits.join(", ")}`;
    target.appendChild(li);
  });
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "[시간 정보 없음]";
  }
  return `[${date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}]`;
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

    state.studentRoster.push({ classCode, studentNumber, studentName, studentKey });
    addLog(`교사가 학생 명단을 등록했어요. (${classCode} ${studentNumber} ${studentName})`);
    saveState();

    form.reset();
    feedback.textContent = "학생 명단에 추가되었습니다.";
    feedback.style.color = "#0f9d94";
    renderTeacherDashboard();
  });
}

function bindRosterSheetTools() {
  const downloadBtn = document.querySelector("#roster-template-download");
  const uploadInput = document.querySelector("#roster-sheet-upload");
  const feedback = document.querySelector("#roster-sheet-feedback");

  if (!downloadBtn || !uploadInput || !feedback) {
    return;
  }

  downloadBtn.addEventListener("click", () => {
    if (!window.XLSX) {
      feedback.textContent = "엑셀 도구를 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
      feedback.style.color = "#d94841";
      return;
    }

    const workbook = window.XLSX.utils.book_new();
    const rows = [
      ["반코드", "학번", "이름"],
      ...state.studentRoster.map((item) => [item.classCode, item.studentNumber, item.studentName])
    ];

    if (rows.length === 1) {
      rows.push(["MATH-2-3", "17", "홍길동"]);
    }

    const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 16 }];
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "학생명단");
    window.XLSX.writeFile(workbook, "math-care-student-roster.xlsx");

    feedback.textContent = "엑셀 양식을 다운로드했습니다.";
    feedback.style.color = "#0f9d94";
  });

  uploadInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const importedRoster = await readRosterSpreadsheet(file);
      const mergeResult = mergeRosterItems(importedRoster);

      saveState();
      renderTeacherDashboard();

      feedback.textContent = `업로드 완료: ${mergeResult.added}명 추가, ${mergeResult.updated}명 갱신, ${mergeResult.skipped}행 건너뜀`;
      feedback.style.color = "#0f9d94";
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : "엑셀 업로드에 실패했습니다.";
      feedback.style.color = "#d94841";
    } finally {
      uploadInput.value = "";
    }
  });
}

async function readRosterSpreadsheet(file) {
  if (!window.XLSX) {
    throw new Error("엑셀 도구를 아직 불러오지 못했습니다.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("업로드한 파일에서 시트를 찾지 못했습니다.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  if (rows.length < 2) {
    throw new Error("업로드 파일에 학생 명단 데이터가 없습니다.");
  }

  const headerMap = mapRosterHeaderIndexes(rows[0]);
  if (headerMap.classCode === -1 || headerMap.studentNumber === -1 || headerMap.studentName === -1) {
    throw new Error("첫 행에 반코드, 학번, 이름 열이 모두 있어야 합니다.");
  }

  return rows.slice(1).map((row) => ({
    classCode: normalizeClassCode(row[headerMap.classCode]),
    studentNumber: normalizeStudentNumber(row[headerMap.studentNumber]),
    studentName: normalizeStudentName(row[headerMap.studentName])
  }));
}

function mapRosterHeaderIndexes(headerRow) {
  const normalized = headerRow.map((value) => normalizeUnitText(value).replace(/\s+/g, ""));
  const findIndex = (labels) => normalized.findIndex((value) => labels.includes(value));

  return {
    classCode: findIndex(["반코드", "반", "classcode"]),
    studentNumber: findIndex(["학번", "번호", "studentnumber"]),
    studentName: findIndex(["이름", "성명", "studentname"])
  };
}

function mergeRosterItems(items) {
  const rosterMap = new Map(state.studentRoster.map((item) => [item.studentKey, item]));
  let added = 0;
  let updated = 0;
  let skipped = 0;

  items.forEach((item) => {
    if (!item.classCode && !item.studentNumber && !item.studentName) {
      skipped += 1;
      return;
    }
    if (!item.classCode || !item.studentNumber || !item.studentName) {
      skipped += 1;
      return;
    }

    const studentKey = createStudentKey(item.classCode, item.studentNumber);
    const nextItem = { ...item, studentKey };

    if (rosterMap.has(studentKey)) {
      const current = rosterMap.get(studentKey);
      if (current.studentName !== item.studentName) {
        rosterMap.set(studentKey, nextItem);
        updated += 1;
      } else {
        skipped += 1;
      }
      return;
    }

    rosterMap.set(studentKey, nextItem);
    added += 1;
  });

  state.studentRoster = Array.from(rosterMap.values());
  if (added > 0 || updated > 0) {
    addLog(`교사가 엑셀로 학생 명단을 불러왔어요. (추가 ${added}명, 갱신 ${updated}명)`);
  }

  return { added, updated, skipped };
}

function removeRosterItem(studentKey) {
  state.studentRoster = state.studentRoster.filter((item) => item.studentKey !== studentKey);
  addLog(`교사가 학생 명단을 삭제했어요. (${studentKey})`);
  saveState();
  renderTeacherDashboard();
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
    row.innerHTML = "<td colspan='4'>아직 등록된 학생 명단이 없어요.</td>";
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

function renderTeacherStudentTable(unit) {
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

  [
    ...filterEntriesByUnit(state.weatherCheckins, unit),
    ...filterEntriesByUnit(state.oopsPosts, unit),
    ...filterEntriesByUnit(state.habitChecks, unit)
  ].forEach((item) => {
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
    row.innerHTML = "<td colspan='5'>아직 제출된 학생 데이터가 없어요.</td>";
    body.appendChild(row);
    return;
  }

  list.forEach((student) => {
    const weather = filterEntriesByUnit(state.weatherCheckins, unit).filter((item) => item.studentKey === student.studentKey);
    const oops = filterEntriesByUnit(state.oopsPosts, unit).filter((item) => item.studentKey === student.studentKey);
    const habit = filterEntriesByUnit(state.habitChecks, unit).filter((item) => item.studentKey === student.studentKey);
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

function setTeacherStage(inClassView) {
  document.querySelectorAll(".teacher-home-only").forEach((node) => {
    node.hidden = inClassView;
  });
  document.querySelectorAll(".teacher-class-only").forEach((node) => {
    node.hidden = !inClassView;
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
