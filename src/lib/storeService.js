import { supabase, isSupabaseConfigured } from "./supabaseClient.js";
import { store as dummyStore } from "./dummyData";

function inferRole(email, metadataRole) {
  if (metadataRole === "owner" || metadataRole === "worker") return metadataRole;
  const normalizedEmail = (email || "").toLowerCase();
  if (normalizedEmail.includes("owner") || normalizedEmail.includes("admin") || normalizedEmail.includes("master")) {
    return "owner";
  }
  return "worker";
}

export async function authenticateUser({ email, password }) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return { error: "이메일과 비밀번호를 입력해주세요." };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data?.user) {
        const role = inferRole(normalizedEmail, data.user.user_metadata?.role);
        return {
          role,
          storeId: data.user.user_metadata?.store_id || data.user.id,
          storeName: data.user.user_metadata?.store_name || data.user.user_metadata?.storeName || "테스트 매장",
          email: normalizedEmail,
          authUserId: data.user.id,
          displayName: data.user.user_metadata?.display_name || data.user.user_metadata?.name || normalizedEmail.split("@")[0],
        };
      }

      if (error) {
        console.warn("Supabase auth sign-in failed:", error.message);
        return { error: error.message };
      }
    } catch (err) {
      console.warn("Supabase auth sign-in error:", err);
    }
  }

  return { error: "로그인 가능한 Supabase Auth 설정이 아닙니다." };
}

export async function registerUser({ email, password, role = "worker", displayName }) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const safeName = (displayName || "").trim();
  if (!normalizedEmail || !password) return { error: "이메일과 비밀번호를 입력해주세요." };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role,
            store_name: "테스트 매장",
            display_name: safeName || normalizedEmail.split("@")[0],
            name: safeName || normalizedEmail.split("@")[0],
          },
        },
      });

      if (!error && data?.user) {
        return {
          role,
          storeId: data.user.id,
          storeName: data.user.user_metadata?.store_name || "테스트 매장",
          email: normalizedEmail,
          authUserId: data.user.id,
          displayName: data.user.user_metadata?.display_name || data.user.user_metadata?.name || safeName || normalizedEmail.split("@")[0],
        };
      }

      if (error) {
        console.warn("Supabase auth sign-up failed:", error.message);
        return { error: error.message };
      }
    } catch (err) {
      console.warn("Supabase auth sign-up error:", err);
    }
  }

  return { error: "회원가입에 실패했습니다. Supabase Auth 설정을 확인해주세요." };
}

export async function authenticatePin(pin) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: ownerStore } = await supabase
        .from("stores")
        .select("id, store_name, owner_pin")
        .eq("owner_pin", pin)
        .maybeSingle();

      if (ownerStore) {
        return {
          role: "owner",
          storeId: ownerStore.id,
          storeName: ownerStore.store_name,
        };
      }

      const { data: workerStore } = await supabase
        .from("stores")
        .select("id, store_name, worker_pin")
        .eq("worker_pin", pin)
        .maybeSingle();

      if (workerStore) {
        return {
          role: "worker",
          storeId: workerStore.id,
          storeName: workerStore.store_name,
        };
      }
    } catch (err) {
      console.warn("Supabase PIN auth error, falling back to local store:", err);
    }
  }

  if (pin === dummyStore.ownerPin) {
    return {
      role: "owner",
      storeId: dummyStore.id,
      storeName: dummyStore.storeName,
    };
  }
  if (pin === dummyStore.workerPin) {
    return {
      role: "worker",
      storeId: dummyStore.id,
      storeName: dummyStore.storeName,
    };
  }

  return null;
}
