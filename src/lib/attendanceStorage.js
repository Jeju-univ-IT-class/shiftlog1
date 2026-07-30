const LOGS_KEY = "oneuri_attendance_logs";
const CURRENT_LOG_KEY = "oneuri_current_attendance_log_id";

// 이름/사번 개인 식별 체계는 아직 없어서(관리자 화면에서 알바생을 추가하는
// 기능이 생기기 전까지) 실제 기록은 "근무자"로만 표시됩니다.
// 아래 6개는 화면이 비어 보이지 않도록 남겨둔 예시 데이터입니다.
const SEED_LOGS = [
  { id: "1234", name: "김철수", clockIn: "09:00", clockOut: "18:05", checklistComplete: true, reason: null },
  { id: "5678", name: "이영희", clockIn: "08:52", clockOut: "18:12", checklistComplete: true, reason: null },
  { id: "9012", name: "박지민", clockIn: "09:15", clockOut: "18:00", checklistComplete: false, reason: "냉장고 고장으로 성에 제거 작업을 완료하지 못했습니다." },
  { id: "3456", name: "최동욱", clockIn: "08:45", clockOut: "17:55", checklistComplete: true, reason: null },
  { id: "7890", name: "정수아", clockIn: "09:00", clockOut: "20:30", checklistComplete: false, reason: "손님 응대가 늦어져 분리수거를 마치지 못했습니다." },
  { id: "2143", name: "한태호", clockIn: "08:58", clockOut: "18:03", checklistComplete: true, reason: null },
];

function readLogs() {
  if (typeof window === "undefined") return SEED_LOGS;
  const raw = window.localStorage.getItem(LOGS_KEY);
  if (!raw) {
    window.localStorage.setItem(LOGS_KEY, JSON.stringify(SEED_LOGS));
    return SEED_LOGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEED_LOGS;
  }
}

function writeLogs(logs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// 출근 버튼 클릭 시 호출 — 새 근태 기록을 시작하고, 퇴근 시 이어서
// 업데이트할 수 있도록 이 기록의 id를 별도로 저장해둡니다.
export function recordClockIn() {
  const logs = readLogs();
  const newLog = {
    id: `log-${Date.now()}`,
    name: "근무자",
    clockIn: nowTime(),
    clockOut: null,
    checklistComplete: null,
    reason: null,
  };
  writeLogs([newLog, ...logs]);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CURRENT_LOG_KEY, newLog.id);
  }
  return newLog.id;
}

// 퇴근 처리(체크리스트 전부 완료 또는 사유 제출) 시 호출
export function recordClockOut({ checklistComplete, reason = null }) {
  if (typeof window === "undefined") return;
  const currentId = window.localStorage.getItem(CURRENT_LOG_KEY);
  const logs = readLogs();
  const updated = logs.map((log) =>
    log.id === currentId
      ? { ...log, clockOut: nowTime(), checklistComplete, reason }
      : log
  );
  writeLogs(updated);
  window.localStorage.removeItem(CURRENT_LOG_KEY);
}

export function getAttendanceLogs() {
  return readLogs();
}
