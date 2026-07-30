"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { notices } from "@/lib/dummyData";
import ShiftChips from "@/components/ShiftChips";
import NoticeCard from "@/components/NoticeCard";
import PhoneFrame from "@/components/PhoneFrame";

export default function AdminHomePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "owner") {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  function handleShiftSelect(shift) {
    router.push(`/admin/checklist?shift=${encodeURIComponent(shift)}`);
  }

  if (!session) return null;

  return (
    <PhoneFrame>
      <main className="px-container-mobile flex flex-col p-4 pt-12 h-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="font-caption text-caption text-mid-gray">사장님 모드</p>
            <h1 className="font-headline-h1-mobile text-headline-h1-mobile text-primary mt-1">
              {session.storeName} 관리자 대시보드
            </h1>
          </div>
          <button
            onClick={() => router.push("/admin/settings")}
            aria-label="매장 설정"
            className="material-symbols-outlined text-primary p-2 hover:bg-surface-gray rounded-lg transition-colors"
          >
            settings
          </button>
        </div>

        <ShiftChips onSelect={handleShiftSelect} />

        <button
          onClick={() => router.push("/admin/attendance")}
          className="w-full h-[52px] bg-pure-white text-primary border border-line-gray rounded-[12px] font-bold transition-all active:scale-95 text-center mb-8"
        >
          출근/퇴근 기록 열람
        </button>

        <section className="flex flex-col gap-4">
          <h2 className="font-headline-h2-mobile text-headline-h2-mobile font-bold text-primary">
            기타 메모 / 특이사항
          </h2>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {notices.map((n) => (
              <NoticeCard key={n.id} text={n.text} time={n.time} />
            ))}
          </div>
        </section>
      </main>
    </PhoneFrame>
  );
}
