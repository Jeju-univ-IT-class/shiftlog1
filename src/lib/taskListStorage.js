import { tasksByShift } from "@/lib/dummyData";

const STORAGE_KEY = "oneuri_tasks";
const SHIFTS = Object.keys(tasksByShift);

function readAll() {
  if (typeof window === "undefined") return tasksByShift;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedAndReturn();
  try {
    const parsed = JSON.parse(raw);
    // 혹시 저장된 값에 shift 키가 빠져있으면 기본값으로 보충
    SHIFTS.forEach((shift) => {
      if (!parsed[shift]) parsed[shift] = tasksByShift[shift];
    });
    return parsed;
  } catch {
    return seedAndReturn();
  }
}

function seedAndReturn() {
  writeAll(tasksByShift);
  return tasksByShift;
}

function writeAll(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTasks(shift) {
  const all = readAll();
  return all[shift] ?? [];
}

export function addTask(shift, title) {
  const all = readAll();
  const list = all[shift] ?? [];
  const newTask = { id: `${shift}-${Date.now()}`, title };
  all[shift] = [...list, newTask];
  writeAll(all);
  return all[shift];
}

export function updateTaskTitle(shift, taskId, newTitle) {
  const all = readAll();
  const list = all[shift] ?? [];
  all[shift] = list.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t));
  writeAll(all);
  return all[shift];
}

export function deleteTask(shift, taskId) {
  const all = readAll();
  const list = all[shift] ?? [];
  all[shift] = list.filter((t) => t.id !== taskId);
  writeAll(all);
  return all[shift];
}
