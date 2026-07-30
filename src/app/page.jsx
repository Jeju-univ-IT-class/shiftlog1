"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { store } from "@/lib/dummyData";
import { saveSession } from "@/lib/session";
import PhoneFrame from "@/components/PhoneFrame";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(digitsOnly);
    if (error) setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (pin.length !== 4) {
      setError("4자리 숫자를 입력해주세요.");
      return;
    }

    if (pin === store.ownerPin) {
      saveSession({ role: "owner", storeId: store.id, storeName: store.storeName });
      router.push("/admin");
      return;
    }

    if (pin === store.workerPin) {
      saveSession({ role: "worker", storeId: store.id, storeName: store.storeName });
      router.push("/worker");
      return;
    }

    setError("일치하는 PIN이 없습니다.");
    setPin("");
  }

  return (
    <PhoneFrame>
      <div className="relative h-full min-h-screen sm:min-h-[800px] flex flex-col items-center justify-center text-primary selection:bg-surface-gray overflow-hidden">
        <header className="w-full flex flex-col items-center px-gutter text-center max-w-sm">
          <h1 className="font-display-mobile text-display-mobile text-primary">LOGIN</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-8">
            <div className="flex flex-col gap-2">
              <input
                className="w-full px-4 py-3 rounded-xl border border-line-gray focus:outline-none focus:border-primary transition-colors text-body-mobile"
                placeholder="아이디(ID)를 입력하세요"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={handleChange}
              />
              {error && (
                <p className="font-caption text-caption text-error text-left px-1">
                  {error}
                </p>
              )}
            </div>
            <button
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-button transition-all active:scale-95"
              type="submit"
            >
              로그인
            </button>
          </form>
        </header>

        <main className="w-full max-w-sm px-6 pb-12"></main>

        <footer
          className="w-full pb-10 flex flex-col items-center gap-4"
          style={{ position: "absolute", bottom: 0 }}
        >
          <button className="font-caption text-caption text-mid-gray hover:text-primary transition-colors py-2 px-4 rounded-lg">
            아이디/비밀번호 찾기
          </button>
        </footer>
      </div>
    </PhoneFrame>
  );
}
