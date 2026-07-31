import { supabase, isSupabaseConfigured } from "./supabaseClient";

const NOTICES_KEY = "oneuri_notices";

function getLocalNotices() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(NOTICES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLocalNotices(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTICES_KEY, JSON.stringify(data));
}

function formatExactTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}

// 1. 메모 전체 조회 (Supabase 연동)
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
          time: formatExactTime(item.created_at),
          authorRole: item.author_role || item.authorRole || "worker",
        }));
      } else if (error) {
        console.error("Supabase fetchNotices 에러:", error);
      }
    } catch (err) {
      console.error("Supabase fetchNotices 예외 발생:", err);
    }
  }

  return getLocalNotices();
}

// 2. 메모 작성 (authorRole: 'owner' | 'worker')
export async function createNotice(text, authorRole = "worker") {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let createdNotice = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("notices")
        .insert([
          {
            store_id: "00000000-0000-0000-0000-000000000001",
            text: trimmed,
            author_role: authorRole,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        createdNotice = {
          id: data.id,
          text: data.text,
          time: formatExactTime(data.created_at),
          authorRole: data.author_role || authorRole,
        };
      } else if (error) {
        console.error("Supabase createNotice DB 저장 실패:", error);
      }
    } catch (err) {
      console.error("Supabase createNotice 예외 발생:", err);
    }
  }

  // DB 저장이 성공했으면 리턴, 실패했으면 로컬스토리지 백업 저장
  if (createdNotice) return createdNotice;

  const newNotice = {
    id: `notice-${Date.now()}`,
    text: trimmed,
    time: formatExactTime(new Date().toISOString()),
    authorRole,
  };

  const locals = getLocalNotices();
  const updated = [newNotice, ...locals];
  saveLocalNotices(updated);

  return newNotice;
}

// 3. 메모 삭제
export async function deleteNotice(id) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) console.error("Supabase deleteNotice 에러:", error);
    } catch (err) {
      console.error("Supabase deleteNotice 예외:", err);
    }
  }

  const locals = getLocalNotices();
  const updated = locals.filter((item) => item.id !== id);
  saveLocalNotices(updated);
  return true;
}