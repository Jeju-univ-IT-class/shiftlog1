import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { tasksByShift } from "@/lib/dummyData";

const STORAGE_KEY = "oneuri_tasks";
const SHIFTS = Object.keys(tasksByShift);

function readAllLocal() {
  if (typeof window === "undefined") return tasksByShift;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedAndReturnLocal();
  try {
    const parsed = JSON.parse(raw);
    SHIFTS.forEach((shift) => {
      if (!parsed[shift]) parsed[shift] = tasksByShift[shift];
    });
    return parsed;
  } catch {
    return seedAndReturnLocal();
  }
}

function seedAndReturnLocal() {
  writeAllLocal(tasksByShift);
  return tasksByShift;
}

function writeAllLocal(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Supabase + Local storage implementation for fetching tasks
export async function fetchTasks(shift) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, category, display_order")
        .eq("category", shift)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((t) => ({ id: t.id, title: t.title }));
      }
    } catch (err) {
      console.warn("Supabase fetchTasks failed, using fallback:", err);
    }
  }

  const all = readAllLocal();
  return all[shift] ?? [];
}

// Synchronous version for backwards compatibility fallback
export function getTasks(shift) {
  const all = readAllLocal();
  return all[shift] ?? [];
}

export async function addTask(shift, title) {
  const trimmed = title.trim();
  if (!trimmed) return await fetchTasks(shift);

  if (isSupabaseConfigured && supabase) {
    try {
      // Get current max display order
      const { data: existing } = await supabase
        .from("tasks")
        .select("display_order")
        .eq("category", shift)
        .order("display_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing[0] ? (existing[0].display_order || 0) + 1 : 1;

      await supabase.from("tasks").insert({
        title: trimmed,
        category: shift,
        display_order: nextOrder,
        is_active: true,
      });

      return await fetchTasks(shift);
    } catch (err) {
      console.warn("Supabase addTask error, using fallback:", err);
    }
  }

  const all = readAllLocal();
  const list = all[shift] ?? [];
  const newTask = { id: `${shift}-${Date.now()}`, title: trimmed };
  all[shift] = [...list, newTask];
  writeAllLocal(all);
  return all[shift];
}

export async function updateTaskTitle(shift, taskId, newTitle) {
  const trimmed = newTitle.trim();
  if (!trimmed) return await fetchTasks(shift);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("tasks")
        .update({ title: trimmed })
        .eq("id", taskId);

      return await fetchTasks(shift);
    } catch (err) {
      console.warn("Supabase updateTaskTitle error, using fallback:", err);
    }
  }

  const all = readAllLocal();
  const list = all[shift] ?? [];
  all[shift] = list.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t));
  writeAllLocal(all);
  return all[shift];
}

export async function deleteTask(shift, taskId) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      return await fetchTasks(shift);
    } catch (err) {
      console.warn("Supabase deleteTask error, using fallback:", err);
    }
  }

  const all = readAllLocal();
  const list = all[shift] ?? [];
  all[shift] = list.filter((t) => t.id !== taskId);
  writeAllLocal(all);
  return all[shift];
}
