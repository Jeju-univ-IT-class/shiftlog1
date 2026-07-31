import { supabase, isSupabaseConfigured } from "./supabaseClient";

const LOGS_KEY = "oneuri_attendance_logs";
const CURRENT_LOG_KEY = "oneuri_current_attendance_log_id";
const ATTENDANCE_PHOTOS_KEY = "oneuri_attendance_photo_refs";

export function getCurrentAttendanceLogId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_LOG_KEY);
}

function readAttendancePhotoRefs() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ATTENDANCE_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAttendancePhotoRefs(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ATTENDANCE_PHOTOS_KEY, JSON.stringify(data));
}

export function saveAttendancePhotoRef(attendanceLogId, photoUrl, workerName) {
  if (!photoUrl) return;
  if (typeof window === "undefined") return;

  const refs = readAttendancePhotoRefs();
  const logKey = String(attendanceLogId || "current");
  const existing = refs[logKey] || [];
  refs[logKey] = [...new Set([...existing, photoUrl])];

  if (workerName) {
    const workerKey = `worker:${String(workerName)}`;
    const workerExisting = refs[workerKey] || [];
    refs[workerKey] = [...new Set([...workerExisting, photoUrl])];
  }

  writeAttendancePhotoRefs(refs);
}

export function getAttendancePhotoRefs(attendanceLogId, workerName) {
  if (typeof window === "undefined") return [];
  const refs = readAttendancePhotoRefs();
  const key = String(attendanceLogId || "current");
  const workerKey = workerName ? `worker:${String(workerName)}` : "";
  const photos = [
    ...(refs[key] || []),
    ...(workerKey ? refs[workerKey] || [] : []),
  ];
  return [...new Set(photos.filter(Boolean))];
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

// 1. Supabase에서 체크리스트(tasks) 전체 가져오기
export async function fetchStoreTasks() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.warn("Supabase fetchStoreTasks 에러:", err);
    }
  }
  return [];
}

// 2. 출근 기록 (Supabase DB + 로컬 저장)
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
  const nowDisplayTime = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  const newLog = {
    id: logId,
    name: workerName,
    worker_name: workerName,
    clockIn: nowDisplayTime,
    clockOut: null,
    checklistComplete: null,
    reason: null,
    createdAt: nowISO,
  };

  const logs = readLogs();
  writeLogs([newLog, ...logs]);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CURRENT_LOG_KEY, String(logId));
  }
  return logId;
}

// 3. 퇴근 기록 (사유 포함)
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

  const nowDisplayTime = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  const logs = readLogs();
  const updated = logs.map((log) =>
    String(log.id) === String(currentId)
      ? { ...log, clockOut: nowDisplayTime, checklistComplete, reason }
      : log
  );
  writeLogs(updated);

  window.localStorage.removeItem(CURRENT_LOG_KEY);
}

// 날짜별 근태 + 인증 사진(photos) 통합 조회 함수 (테이블 유연성 보완)
// 날짜별 근태 + 인증 사진(photos) 통합 조회 함수 (에러 완벽 조치)
// 날짜별 근태 + 근무자별 개인 인증 사진(photos) 1:1 매칭 조회 함수
export async function fetchAttendanceLogsByDate(targetDateStr) {
  const startOfDay = new Date(`${targetDateStr}T00:00:00+09:00`).toISOString();
  const endOfDay = new Date(`${targetDateStr}T23:59:59+09:00`).toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. 출퇴근 로그(attendance_logs) 조회
      const { data: logs, error: logErr } = await supabase
        .from("attendance_logs")
        .select("*")
        .gte("clock_in_time", startOfDay)
        .lte("clock_in_time", endOfDay)
        .order("clock_in_time", { ascending: false });

      // 2. closing_logs + closing_details 데이터 조회
      const { data: closingLogsData, error: closingLogsErr } = await supabase
        .from("closing_logs")
        .select("id, attendance_id, worker_name, created_at, closing_details(*)")
        .order("created_at", { ascending: false });

      if (!logErr && logs) {
        const photosByAttendanceId = new Map();
        const photosByWorkerName = new Map();

        if (!closingLogsErr && closingLogsData) {
          closingLogsData.forEach((entry) => {
            const photos = (entry.closing_details || [])
              .map((detail) => detail.photo_url)
              .filter(Boolean);

            if (photos.length === 0) return;

            if (entry.attendance_id) {
              const existing = photosByAttendanceId.get(String(entry.attendance_id)) || [];
              photosByAttendanceId.set(String(entry.attendance_id), [...existing, ...photos]);
            }

            if (entry.worker_name) {
              const existing = photosByWorkerName.get(String(entry.worker_name)) || [];
              photosByWorkerName.set(String(entry.worker_name), [...existing, ...photos]);
            }
          });
        }

        return logs.map((log) => {
          const workerName = log.worker_name || log.user_name || "근무자";
          const attendanceId = String(log.id);
          const remotePhotos = [
            ...(photosByAttendanceId.get(attendanceId) || []),
            ...(photosByWorkerName.get(workerName) || []),
          ];
          const localPhotos = getAttendancePhotoRefs(attendanceId, workerName);
          const uniquePhotos = [...new Set([...remotePhotos, ...localPhotos].filter(Boolean))];

          return {
            id: log.id,
            name: workerName,
            worker_name: workerName,
            clockIn: formatKSTTime(log.clock_in_time),
            clockOut: formatKSTTime(log.clock_out_time),
            checklistComplete: log.checklist_complete,
            reason: log.reason,
            reason_created_at: log.reason_created_at,
            photos: uniquePhotos,
          };
        });
      }
    } catch (err) {
      console.warn("Supabase 날짜별 조회 실패, 로컬데이터 사용:", err);
    }
  }

  // 로컬 fallback 필터링
  const logs = readLogs();
  return logs.filter((log) => {
    if (!log.createdAt) return true;
    const logDate = new Date(log.createdAt).toISOString().split("T")[0];
    return logDate === targetDateStr;
  }).map((log) => {
    const attendanceId = String(log.id || "");
    const workerName = log.worker_name || log.name || "근무자";
    const localPhotos = getAttendancePhotoRefs(attendanceId, workerName);
    return {
      ...log,
      photos: localPhotos,
    };
  });
}

export async function fetchAttendanceLogs() {
  const todayStr = new Date().toISOString().split("T")[0];
  return fetchAttendanceLogsByDate(todayStr);
}

export function getAttendanceLogs() {
  return readLogs();
}

export function isClockedIn() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(CURRENT_LOG_KEY));
}