import { tasksByShift } from "@/lib/dummyData";
import { getTasks } from "@/lib/taskListStorage";

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
export function isAnyShiftComplete() {
  const all = readAll();
  return SHIFTS.some((shift) => {
    const tasks = getTasks(shift);
    const completion = all[shift] ?? {};
    return tasks.length > 0 && tasks.every((t) => completion[t.id]);
  });
}

export function clearChecklistState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
