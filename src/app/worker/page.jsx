"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { fetchNotices, createNotice } from "@/lib/noticeStorage";
import { isAnyShiftComplete, clearChecklistState } from "@/lib/checklistStorage";
import { clearPhotoPreviews } from "@/lib/photoStorage";
import { recordClockIn, recordClockOut, isClockedIn, getAttendanceLogs } from "@/lib/attendanceStorage";
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
  const [canClockOutWithoutReason, setCanClockOutWithoutReason] = useState(false);

  // 출퇴근 시각 정보 상태
  const [currentLog, setCurrentLog] = useState(null);

  // 오늘 날짜 포맷팅 함수 (KST 기준)
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul"
    });
  };

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "worker") {
      router.replace("/");
      return;
    }
    setSession(s);
    setClockedIn(isClockedIn());

    // 최신 근태 기록 불러오기 (출/퇴근 시각 표시용)
    const logs = getAttendanceLogs();
    if (logs && logs.length > 0) {
      setCurrentLog(logs[0]);
    }

    async function loadNotices() {
      const data = await fetchNotices();
      setNotices(data);
    }
    loadNotices();

    async function loadCompletion() {
      const complete = await isAnyShiftComplete();
      setCanClockOutWithoutReason(complete);
    }
    loadCompletion();
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

      // 최신 출근 시간 즉시 반영
      const logs = getAttendanceLogs();
      if (logs && logs.length > 0) {
        setCurrentLog(logs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClockOut() {
    if (!clockedIn) return;

    setIsSubmitting(true);
    const complete = await isAnyShiftComplete();

    if (complete) {
      try {
        // 1. 완성 안내 메시지 출력
        alert("체크리스트 완성 확인되었습니다.");

        // 2. 퇴근 기록 (로그인 세션 유지: clearSession 제거)
        await recordClockOut({ checklistComplete: true, reason: null });
        clearChecklistState();
        clearPhotoPreviews();
        setClockedIn(false);

        // 3. 최신 퇴근 시각 화면에 즉시 반영
        const logs = getAttendanceLogs();
        if (logs && logs.length > 0) {
          setCurrentLog(logs[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(false);
    // 체크리스트가 완료되지 않은 경우 미작성 사유 입력 페이지로 이동
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

  return (
    <PhoneFrame>
      <main className="px-container-mobile flex flex-col p-4 pt-12 h-full">
        <section className="flex flex-col gap-4 mb-8">
          {/* 상단 당일 날짜 및 로그인 정보 카드 */}
          <div className="rounded-[12px] border border-line-gray bg-surface-container px-4 py-3 flex justify-between items-center">
            <div>
              {/* 당일 날짜 표기 추가 */}
              <p className="text-xs font-bold text-primary mb-0.5">
                 {getTodayFormatted()}
              </p>
              <p className="font-caption text-caption text-mid-gray"></p>
              <p className="font-headline-h2-mobile text-headline-h2-mobile font-bold text-primary mt-0.5">
                {session.displayName || "근무자"}
              </p>
            </div>
            {/* 출근 및 퇴근 시간 표시 영역 */}
            <div className="text-right text-xs text-mid-gray flex flex-col gap-0.5">
              <p>
                <span className="font-semibold text-primary">출근:</span> {currentLog?.clockIn || "-"}
              </p>
              <p>
                <span className="font-semibold text-primary">퇴근:</span> {currentLog?.clockOut || "-"}
              </p>
            </div>
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

          {/* 알바생 화면 내 NoticeCard 목록 랜더링 영역 */}
          <div className="flex flex-col gap-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {notices.map((n) => (
              <NoticeCard 
                key={n.id} 
                id={n.id}
                text={n.text} 
                time={n.time} 
                authorRole={n.authorRole}
              />
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