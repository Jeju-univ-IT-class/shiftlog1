import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { notices as seedNotices } from "./dummyData";

const NOTICES_KEY = "oneuri_notices";

function getLocalNotices() {
  if (typeof window === "undefined") return seedNotices;
  const raw = window.localStorage.getItem(NOTICES_KEY);
  if (!raw) {
    window.localStorage.setItem(NOTICES_KEY, JSON.stringify(seedNotices));
    return seedNotices;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return seedNotices;
  }
}

function saveLocalNotices(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTICES_KEY, JSON.stringify(data));
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export async function fetchNotices() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((item) => ({
          id: item.id,
          text: item.text,
          time: formatRelativeTime(item.created_at),
        }));
      }
    } catch (err) {
      console.warn("Supabase fetchNotices error, falling back to local:", err);
    }
  }

  return getLocalNotices();
}

export async function createNotice(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("notices")
        .insert({ text: trimmed })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          text: data.text,
          time: "방금 전",
        };
      }
    } catch (err) {
      console.warn("Supabase createNotice error, falling back to local:", err);
    }
  }

  const locals = getLocalNotices();
  const newNotice = {
    id: `notice-${Date.now()}`,
    text: trimmed,
    time: "방금 전",
  };
  const updated = [newNotice, ...locals];
  saveLocalNotices(updated);
  return newNotice;
}
