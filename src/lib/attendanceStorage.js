import { supabase, isSupabaseConfigured } from "./supabaseClient";

const LOGS_KEY = "oneuri_attendance_logs";
const CURRENT_LOG_KEY = "oneuri_current_attendance_log_id";

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString("ko-KR", { 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false, 
    timeZone: "Asia/Seoul" 
  });
}

function formatKSTTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

function readLogs() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeLogs(logs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

// 1. 출근 기록
export async function recordClockIn(workerName = "근무자") {
  const nowISO = new Date().toISOString();
  let dbLogId = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("attendance_logs")
        .insert([
          {
            store_id: "00000000-0000-0000-0000-000000000001",
            worker_name: workerName,
            user_name: workerName,
            clock_in_time: nowISO,
          },
        ])
        .select();

      if (!error && data && data[0]) {
        dbLogId = data[0].id;
      }
    } catch (err) {
      console.error("Supabase 출근 저장 예외:", err);
    }
  }

  const logId = dbLogId || `log-${Date.now()}`;
  const newLog = {
    id: logId,
    name: workerName,
    worker_name: workerName,
    clockIn: nowTime(),
    clockOut: null,
    checklistComplete: null,
    reason: null,
    createdAt: nowISO
  };

  const logs = readLogs();
  writeLogs([newLog, ...logs]);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CURRENT_LOG_KEY, String(logId));
  }

  return logId;
}

// 2. 퇴근 기록
export async function recordClockOut({ checklistComplete, reason = null }) {
  if (typeof window === "undefined") return;
  const currentId = window.localStorage.getItem(CURRENT_LOG_KEY);
  const nowISO = new Date().toISOString();

  if (isSupabaseConfigured && supabase && currentId) {
    try {
      await supabase
        .from("attendance_logs")
        .update({
          clock_out_time: nowISO,
          checklist_complete: checklistComplete,
          reason: reason,
        })
        .eq("id", currentId);
    } catch (err) {
      console.error("Supabase 퇴근 저장 예외:", err);
    }
  }

  const logs = readLogs();
  const updated = logs.map((log) =>
    String(log.id) === String(currentId)
      ? { ...log, clockOut: nowTime(), checklistComplete, reason }
      : log
  );
  writeLogs(updated);
  window.localStorage.removeItem(CURRENT_LOG_KEY);
}

// 3. 특정한 날짜(targetDate: 'YYYY-MM-DD')의 근태 기록 조회 함수 (★ 핵심 구현)
export async function fetchAttendanceLogsByDate(targetDateStr) {
  // 선택한 날짜의 한국 기준 00:00:00 ~ 23:59:59 타임스탬프 계산
  const startOfDay = new Date(`${targetDateStr}T00:00:00+09:00`).toISOString();
  const endOfDay = new Date(`${targetDateStr}T23:59:59+09:00`).toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .gte("clock_in_time", startOfDay)
        .lte("clock_in_time", endOfDay)
        .order("clock_in_time", { ascending: false });

      if (!error && data) {
        return data.map((log) => ({
          id: log.id,
          name: log.worker_name || log.user_name || "근무자",
          worker_name: log.worker_name || log.user_name || "근무자",
          clockIn: formatKSTTime(log.clock_in_time),
          clockOut: formatKSTTime(log.clock_out_time),
          checklistComplete: log.checklist_complete,
          reason: log.reason,
          reason_created_at: log.reason_created_at,
        }));
      }
    } catch (err) {
      console.warn("Supabase 날짜별 조회 실패, 로컬데이터 사용:", err);
    }
  }

  // 로컬 fallback 필터링
  const logs = readLogs();
  return logs.filter(log => {
    if (!log.createdAt) return true;
    const logDate = new Date(log.createdAt).toISOString().split('T')[0];
    return logDate === targetDateStr;
  });
}

// 기존 전체 불러오기 호환용
export async function fetchAttendanceLogs() {
  const todayStr = new Date().toISOString().split('T')[0];
  return fetchAttendanceLogsByDate(todayStr);
}

export function getAttendanceLogs() {
  return readLogs();
}

export function isClockedIn() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(CURRENT_LOG_KEY));
}