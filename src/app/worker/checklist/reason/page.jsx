"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import { clearChecklistState } from "@/lib/checklistStorage";
import { recordClockOut } from "@/lib/attendanceStorage";
import PhoneFrame from "@/components/PhoneFrame";

export default function ReasonPage() {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setReason(e.target.value.slice(0, 200));
  }

  async function handleSubmit() {
    if (reason.trim().length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 1000);
      return;
    }

    setIsSubmitting(true);
    try {
      await recordClockOut({ checklistComplete: false, reason: reason.trim() });
      setShowToast(true);
      setTimeout(() => {
        clearChecklistState();
        clearSession();
        router.push("/");
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  return (
    <PhoneFrame>
      <div className="relative h-full min-h-screen sm:min-h-[800px] flex flex-col items-center justify-center bg-pure-white">
        <main className="w-full px-container-mobile flex flex-col items-center max-w-sm">
          <div className="w-full flex flex-col items-center gap-8">
            <div className="text-center space-y-2">
              <h2 className="font-headline-h2-mobile text-headline-h2-mobile text-primary">
                미작성 사유 입력
              </h2>
              <p className="font-body-mobile text-body-mobile text-mid-gray">
                완료되지 않은 항목에 대한 구체적인 사유를 기록해 주세요.
              </p>
            </div>
            <div className="w-full flex flex-col items-center">
              <textarea
                value={reason}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={6}
                className={`w-full p-4 font-body-mobile text-body-mobile text-primary bg-pure-white border rounded-xl placeholder:text-mid-gray resize-none transition-all duration-200 ${
                  showError ? "border-error" : "border-line-gray"
                }`}
                placeholder="체크리스트 미작성 사유를 작성하세요."
              />
              <div className="mt-3 flex justify-end w-full">
                <span className="text-caption font-caption text-mid-gray">
                  {reason.length} / 200
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-[52px] mt-3 bg-primary text-on-primary font-button text-button rounded-xl transition-all hover:opacity-90 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "제출 중..." : "제출"}
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </main>

        <div id="toast" className={showToast ? "show" : ""}>
          제출 완료
        </div>
      </div>
    </PhoneFrame>
  );
}
