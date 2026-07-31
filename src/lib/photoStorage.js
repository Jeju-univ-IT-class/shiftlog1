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
