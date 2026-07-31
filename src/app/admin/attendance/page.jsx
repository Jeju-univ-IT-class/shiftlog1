"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { fetchAttendanceLogsByDate } from "@/lib/attendanceStorage";
import TopAppBar from "@/components/TopAppBar";
import PhoneFrame from "@/components/PhoneFrame";

export default function AdminAttendancePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null); // 클릭 시 팝업에 띄울 데이터
  const [previewImage, setPreviewImage] = useState(null); // 사진 확대보기용

  const todayDateString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const [selectedDate, setSelectedDate] = useState(todayDateString);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "owner") {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const data = await fetchAttendanceLogsByDate(selectedDate);
      setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, [selectedDate]);

  if (!session) return null;

  const [year, month, day] = selectedDate.split("-");
  const formattedDisplayDate = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;

  return (
    <PhoneFrame>
      <div className="h-full min-h-screen flex flex-col bg-pure-white">
        <TopAppBar title="출퇴근 및 체크리스트 기록" showSearch={false} />

        {/* 날짜 선택 헤더 */}
        <div className="px-4 py-3 border-b border-line-gray bg-surface-container flex justify-between items-center">
          <div className="flex items-center gap-2 relative">
            <span className="font-bold text-primary">{formattedDisplayDate}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="opacity-0 absolute inset-0 cursor-pointer"
            />
            <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
          </div>
          <span className="text-mid-gray text-xs">전체 {logs.length}건</span>
        </div>

        {/* 근태 기록 목록 */}
        <main className="flex-1 overflow-y-auto p-4 bg-pure-white">
          {loading ? (
            <p className="text-center text-xs text-mid-gray py-8">기록을 불러오는 중...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => {
                const isDone = log.checklistComplete === true;
                const photoCount = log.photos ? log.photos.length : 0;

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-4 rounded-xl border border-line-gray bg-pure-white cursor-pointer hover:border-primary transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-primary text-sm">{log.name}</p>
                        <p className={`text-xs mt-1 font-semibold ${isDone ? "text-green-600" : "text-error"}`}>
                          {log.checklistComplete === null
                            ? "근무 중"
                            : isDone
                            ? "✓ 체크리스트 완료"
                            : "⚠ 미작성 사유 제출"}
                        </p>
                      </div>
                      <div className="text-xs text-right">
                        <p><span className="text-mid-gray">출근</span> <span className="font-bold">{log.clockIn}</span></p>
                        <p><span className="text-mid-gray">퇴근</span> <span className="font-bold">{log.clockOut}</span></p>
                      </div>
                    </div>

                    {/* 인증 사진이 첨부된 경우 미리보기 썸네일 표시 */}
                    {photoCount > 0 && (
                      <div className="mt-3 pt-2 border-t border-line-gray/60 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                          <span className="material-symbols-outlined text-sm">photo_camera</span>
                          인증 사진 {photoCount}장 첨부됨
                        </div>
                        <span className="text-[11px] text-mid-gray font-bold">터치하여 사진 보기 ➔</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {logs.length === 0 && (
                <p className="text-center text-xs text-mid-gray py-8">해당 날짜의 기록이 없습니다.</p>
              )}
            </div>
          )}
        </main>

        {/* 알바생 카드 클릭 시 나타나는 상세 팝업 모달 */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-pure-white rounded-2xl w-full max-w-xs p-5 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-y-auto">
              <div>
                <h3 className="text-base font-bold text-primary">
                  {selectedLog.name} 님의 상세 기록
                </h3>
                <p className="text-xs text-mid-gray mt-1">
                  출근: {selectedLog.clockIn} / 퇴근: {selectedLog.clockOut}
                </p>
              </div>

              {/* 1. 체크리스트 수행 및 사유서 정보 */}
              <div>
                <p className="text-xs font-bold text-mid-gray mb-1.5">체크리스트 이행 상태</p>
                {selectedLog.checklistComplete === true ? (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-semibold">
                    ✓ 모든 체크리스트 항목이 완료되었습니다.
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-on-background">
                    <p className="font-bold text-error mb-1">미작성 사유:</p>
                    <p className="whitespace-pre-wrap">{selectedLog.reason || "작성된 사유가 없습니다."}</p>
                  </div>
                )}
              </div>

              {/* 2. 첨부된 마감 사진 갤러리 */}
              <div>
                <p className="text-xs font-bold text-mid-gray mb-1.5">
                  체크리스트 인증 사진 ({selectedLog.photos ? selectedLog.photos.length : 0}장)
                </p>
                
                {selectedLog.photos && selectedLog.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedLog.photos.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(url)}
                        className="relative aspect-square rounded-lg overflow-hidden border border-line-gray cursor-pointer group"
                      >
                        <img
                          src={url}
                          alt={`인증사진 ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-mid-gray py-3 bg-surface-container rounded-xl text-center">
                    등록된 인증 사진이 없습니다.
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-3 bg-primary text-pure-white rounded-xl font-bold text-xs mt-1"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 사진 클릭 시 크게 보는 이미지 원본 모달 */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-sm w-full">
              <img
                src={previewImage}
                alt="확대보기"
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              />
              <p className="text-center text-white text-xs mt-3 font-semibold">
                화면을 터치하면 닫힙니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}