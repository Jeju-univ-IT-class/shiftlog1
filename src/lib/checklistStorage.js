import { tasksByShift } from "@/lib/dummyData";
import { fetchTasks } from "@/lib/taskListStorage";
import { getCurrentAttendanceLogId } from "./attendanceStorage";
import { supabase, isSupabaseConfigured } from "./supabaseClient"; // ★ Supabase 추가

const STORAGE_KEY = "oneuri_checklist_completed";
const SHIFTS = Object.keys(tasksByShift);

function readAll() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getShiftCompletion(shift) {
  const all = readAll();
  return all[shift] ?? {};
}

export function toggleTaskCompletion(shift, taskId) {
  const all = readAll();
  const shiftState = all[shift] ?? {};
  shiftState[taskId] = !shiftState[taskId];
  all[shift] = shiftState;
  writeAll(all);
  return shiftState;
}

// 오픈/미들/마감 중 하나라도 전체 완료된 체크리스트가 있으면 true
export async function isAnyShiftComplete() {
  const all = readAll();
  for (const shift of SHIFTS) {
    const tasks = await fetchTasks(shift);
    const completion = all[shift] ?? {};
    if (tasks.length > 0 && tasks.every((t) => completion[t.id])) {
      return true;
    }
  }
  return false;
}

export function clearChecklistState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ============================================================
// ★ [신규 추가] Supabase Storage 사진 업로드 & closing_details DB 저장
// ============================================================

// 1. 사진 파일을 Supabase Storage('photos' 버킷)에 업로드
export async function uploadTaskPhoto(file) {
  if (!isSupabaseConfigured || !supabase || !file) return null;

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `checklist_photos/${fileName}`;

    // Storage의 'photos' 버킷에 업로드
    const { data, error } = await supabase.storage
      .from("photos")
      .upload(filePath, file);

    if (error) {
      console.error("Storage 사진 업로드 오류:", error);
      return null;
    }

    // 업로드된 파일의 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from("photos")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("사진 업로드 예외 발생:", err);
    return null;
  }
}

// 2. closing_logs / closing_details 테이블에 마감 기록 및 사진 URL 저장
export async function saveClosingDetail({ workerName, taskId, taskTitle, photoUrl, shift, attendanceLogId }) {
  if (!isSupabaseConfigured || !supabase || !photoUrl) return false;

  try {
    const currentAttendanceLogId = attendanceLogId || getCurrentAttendanceLogId();

    const { data: createdLog, error: logError } = await supabase
      .from("closing_logs")
      .insert([
        {
          worker_name: workerName || "근무자",
          attendance_id: currentAttendanceLogId || null,
          note: taskTitle ? `${shift || "마감"} 체크리스트 인증` : null,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (logError || !createdLog?.id) {
      console.error("closing_logs DB 저장 오류 상세:", logError?.message || logError);
      return false;
    }

    const { error: detailError } = await supabase.from("closing_details").insert([
      {
        log_id: createdLog.id,
        task_id: taskId || null,
        photo_url: photoUrl,
        is_completed: true,
      },
    ]);

    if (detailError) {
      console.error("closing_details DB 저장 오류 상세:", detailError.message || detailError);
      return false;
    }

    return true;
  } catch (err) {
    console.error("closing_details DB 저장 예외:", err);
    return false;
  }
}