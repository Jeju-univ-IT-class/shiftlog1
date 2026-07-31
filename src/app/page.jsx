"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticateUser, registerUser } from "@/lib/storeService";
import { saveSession } from "@/lib/session";
import PhoneFrame from "@/components/PhoneFrame";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("worker");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result =
        mode === "login"
          ? await authenticateUser({ email, password })
          : await registerUser({ email, password, role, displayName });

      if (result?.error) {
        setError(result.error);
        setPassword("");
        return;
      }

      if (result) {
        saveSession(result);
        if (result.role === "owner") {
          router.push("/admin");
        } else {
          router.push("/worker");
        }
        return;
      }

      setError(
        mode === "login"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : "계정 생성에 실패했습니다. 다시 시도해 주세요."
      );
      setPassword("");
    } catch (err) {
      console.error(err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PhoneFrame>
      <div className="relative h-full min-h-screen sm:min-h-[800px] flex flex-col items-center justify-center text-primary selection:bg-surface-gray overflow-hidden">
        <header className="w-full flex flex-col items-center px-gutter text-center max-w-sm">
          <h1 className="font-display-mobile text-display-mobile text-primary">SHIFTLOG LOGIN</h1>

          <div className="flex rounded-full border border-line-gray p-1 mt-4">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === "login" ? "bg-primary text-pure-white" : "text-mid-gray"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === "signup" ? "bg-primary text-pure-white" : "text-mid-gray"
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-6">
            <div className="flex flex-col gap-2">
              <input
                className="w-full px-4 py-3 rounded-xl border border-line-gray focus:outline-none focus:border-primary transition-colors text-body-mobile"
                placeholder="이메일을 입력하세요"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                disabled={isSubmitting}
              />

              {mode === "signup" && (
                <input
                  className="w-full px-4 py-3 rounded-xl border border-line-gray focus:outline-none focus:border-primary transition-colors text-body-mobile"
                  placeholder="사용자 이름을 입력하세요"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isSubmitting}
                />
              )}

              <input
                className="w-full px-4 py-3 rounded-xl border border-line-gray focus:outline-none focus:border-primary transition-colors text-body-mobile"
                placeholder="비밀번호를 입력하세요"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={isSubmitting}
              />

              {mode === "signup" && (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-line-gray focus:outline-none focus:border-primary transition-colors text-body-mobile"
                >
                  <option value="worker">근무자</option>
                  <option value="owner">사장님</option>
                </select>
              )}

              {error && (
                <p className="font-caption text-caption text-error text-left px-1">
                  {error}
                </p>
              )}
            </div>

            <button
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-button transition-all active:scale-95 disabled:opacity-50"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "처리 중..." : mode === "login" ? "로그인" : "계정 만들기"}
            </button>
          </form>
        </header>

        <main className="w-full max-w-sm px-6 pb-12"></main>
      </div>
    </PhoneFrame>
  );
}