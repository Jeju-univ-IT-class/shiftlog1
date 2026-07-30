"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/session";
import { fetchNotices, createNotice } from "@/lib/noticeStorage";
import { isAnyShiftComplete, clearChecklistState } from "@/lib/checklistStorage";
import { recordClockIn, recordClockOut } from "@/lib/attendanceStorage";
import ShiftChips from "@/components/ShiftChips";
import NoticeCard from "@/components/NoticeCard";
import PhoneFrame from "@/components/PhoneFrame";

export default function WorkerMainPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [memo, setMemo] = useState("");
  const [notices, setNotices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "worker") {
      router.replace("/");
      return;
    }
    setSession(s);

    async function loadNotices() {
      const data = await fetchNotices();
      setNotices(data);
    }
    loadNotices();
  }, [router]);

  function handleShiftSelect(shift) {
    router.push(`/worker/checklist?shift=${encodeURIComponent(shift)}`);
  }

  async function handleClockIn() {
    setIsSubmitting(true);
    try {
      const displayName = session?.displayName || "근무자";
      await recordClockIn(displayName);
      setClockedIn(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClockOut() {
    if (!clockedIn) return;

    if (isAnyShiftComplete()) {
      setIsSubmitting(true);
      try {
        await recordClockOut({ checklistComplete: true, reason: null });
        clearChecklistState();
        clearSession();
        router.push("/");
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
      }
      return;
    }

    router.push("/worker/checklist/reason");
  }

  async function handleRegisterMemo() {
    if (memo.trim().length === 0) return;
    const newNotice = await createNotice(memo);
    if (newNotice) {
      setNotices((prev) => [newNotice, ...prev]);
    }
    setMemo("");
  }

  if (!session) return null;

  const canClockOutWithoutReason = isAnyShiftComplete();

  return (
    <PhoneFrame>
      <main className="px-container-mobile flex flex-col p-4 pt-12 h-full">
        <section className="flex flex-col gap-4 mb-8">
          <div className="rounded-[12px] border border-line-gray bg-surface-container px-4 py-3">
            <p className="font-caption text-caption text-mid-gray">로그인 사용자</p>
            <p className="font-headline-h2-mobile text-headline-h2-mobile font-bold text-primary mt-1">
              {session.displayName || "근무자"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClockIn}
              disabled={clockedIn || isSubmitting}
              className={`flex flex-col items-center justify-center gap-3 rounded-[12px] transition-all active:scale-95 shadow-none border h-20 ${
                clockedIn
                  ? "bg-surface-gray text-mid-gray border-surface-gray cursor-not-allowed"
                  : "bg-pure-white text-primary border-line-gray"
              }`}
            >
              <span className="material-symbols-outlined text-3xl">login</span>
              <span className="font-headline-h2-mobile text-headline-h2-mobile font-bold">
                출근
              </span>
            </button>
            <button
              onClick={handleClockOut}
              disabled={!clockedIn || isSubmitting}
              className={`flex flex-col items-center justify-center gap-3 border rounded-[12px] transition-all active:scale-95 shadow-none h-20 ${
                clockedIn
                  ? "bg-primary text-pure-white border-primary"
                  : "bg-surface-gray text-mid-gray border-surface-gray cursor-not-allowed"
              }`}
            >
              <span className="material-symbols-outlined text-3xl">logout</span>
              <span className="font-headline-h2-mobile text-headline-h2-mobile font-bold">
                퇴근
              </span>
            </button>
          </div>
          <div className="h-1 w-full bg-surface-container overflow-hidden rounded-full">
            <div className="h-full bg-primary w-1/3"></div>
          </div>
          <p className="text-caption text-mid-gray text-center">
            {canClockOutWithoutReason
              ? "오픈/미들/마감 중 하나의 체크리스트가 모두 완료되면 사유 없이 퇴근할 수 있습니다."
              : "체크리스트가 끝나지 않으면 사유를 적고 퇴근할 수 있습니다."}
          </p>
        </section>

        <ShiftChips onSelect={handleShiftSelect} />

        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-h2-mobile text-headline-h2-mobile font-bold text-primary">
              기타 메모 / 특이사항
            </h2>
            <span className="text-xs font-caption text-mid-gray">선택사항</span>
          </div>
          <div className="relative group">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full p-4 rounded-[12px] border border-line-gray focus:border-2 focus:border-primary focus:ring-0 outline-none font-body-mobile text-body-mobile transition-all placeholder:text-mid-gray h-32 bg-surface-container"
              placeholder="특이사항이 있다면 여기에 작성해주세요."
            />
            <div className="absolute bottom-3 right-3">
              <span className="material-symbols-outlined text-mid-gray">edit_note</span>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleRegisterMemo}
              className="py-2 bg-pure-white text-primary border rounded-[12px] font-bold transition-all active:scale-95 border-line-gray px-2 text-xs"
            >
              등록하기
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {notices.map((n) => (
              <NoticeCard key={n.id} text={n.text} time={n.time} />
            ))}
            {notices.length === 0 && (
              <p className="text-caption text-mid-gray py-4 text-center">
                등록된 특이사항이 없습니다.
              </p>
            )}
          </div>
        </section>
      </main>
    </PhoneFrame>
  );
}
