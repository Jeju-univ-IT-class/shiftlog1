import { supabase, isSupabaseConfigured } from "./supabaseClient";

const STORAGE_KEY = "oneuri_task_photos";
const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "checklist-photos";

function readStoredPhotos() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredPhotos(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStoredPhotos() {
  return readStoredPhotos();
}

// 퇴근 시 호출 — 알바생 체크리스트 화면에 남아있는 "로컬 미리보기"만 지웁니다.
// Supabase Storage에 올라간 실제 사진 파일이나 DB 기록은 그대로 유지되어
// (사장님 페이지에서는 계속 보임) 여기서 건드리지 않습니다.
export function clearPhotoPreviews() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function persistTaskPhoto(taskId, photo) {
  if (!taskId) return;
  if (typeof window === "undefined") return;
  const all = readStoredPhotos();
  all[taskId] = photo;
  writeStoredPhotos(all);
}

export function getTaskPhoto(taskId) {
  return readStoredPhotos()[taskId] ?? null;
}

export async function uploadTaskPhoto({ file, taskId, shift, title }) {
  if (!file) return null;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const timestamp = Date.now();
  const path = `${shift || "unknown"}/${taskId || "task"}/${timestamp}-${safeName}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { error: uploadError } = await supabase.storage.from(DEFAULT_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(path);
      const photoUrl = publicData?.publicUrl;

      if (photoUrl) {
        const photo = {
          url: photoUrl,
          path,
          fileName: safeName,
          uploadedAt: new Date().toISOString(),
          shift,
          title,
        };

        persistTaskPhoto(taskId, photo);

        return photo;
      }
    } catch (err) {
      console.warn("Supabase photo upload failed, falling back to local preview:", err);
    }
  }

  if (typeof window !== "undefined") {
    const localPreview = {
      url: URL.createObjectURL(file),
      path,
      fileName: safeName,
      uploadedAt: new Date().toISOString(),
      shift,
      title,
    };
    persistTaskPhoto(taskId, localPreview);
    return localPreview;
  }

  return null;
}