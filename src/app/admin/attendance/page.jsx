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
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});

  // YYYY-MM-DD 포맷 문자열 생성
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

  // 날짜가 변경될 때마다 DB에서 해당 날짜 데이터 새로 불러오기
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

  const trimmedQuery = query.trim();
  const filtered = logs.filter((log) =>
    (log.name || log.worker_name || "").toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // 선택한 날짜 한글 표기 (예: 2026년 7월 31일)
  const [year, month, day] = selectedDate.split("-");
  const formattedDisplayDate = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;

  return (
    <PhoneFrame>
      <div className="h-full min-h-screen sm:min-h-[800px] flex flex-col bg-pure-white">
        <TopAppBar title="출퇴근 기록" showSearch={false} />

        {/* 이름 검색창 */}
        <div className="px-gutter py-unit border-b border-line-gray">
          <div className="flex items-center gap-2 py-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="근로자 이름 검색"
              className="flex-1 px-3 py-2 rounded-lg border border-line-gray focus:outline-none focus:border-primary transition-colors text-body-mobile"
            />
            <span className="material-symbols-outlined text-mid-gray p-2">search</span>
          </div>
        </div>

        {/* 날짜 선택 (Date Picker) */}
        <div className="px-gutter py-unit border-b border-line-gray bg-surface-container">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2 relative">
              <span className="font-body-mobile text-body-mobile font-bold text-primary">
                {formattedDisplayDate}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <span className="material-symbols-outlined text-primary text-[20px]">
                calendar_today
              </span>
            </div>
            <div className="text-mid-gray font-caption text-caption">
              전체 {filtered.length}건
            </div>
          </div>
        </div>

        {/* 출퇴근 리스트 */}
        <section className="flex-1 overflow-y-auto px-gutter py-4 bg-pure-white">
          {loading ? (
            <div className="text-center font-caption text-caption text-mid-gray py-8">
              근태 기록을 불러오는 중...
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((log) => {
                const isIncomplete = log.checklistComplete === false;
                const isOpen = !!expanded[log.id];

                return (
                  <div
                    key={log.id}
                    className={`bg-pure-white rounded-xl p-4 transition-all border ${
                      isIncomplete ? "border-primary" : "border-line-gray"
                    }`}
                  >
                    <div
                      onClick={isIncomplete ? () => toggleExpand(log.id) : undefined}
                      className={`flex justify-between items-center ${
                        isIncomplete ? "cursor-pointer" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-body-mobile text-primary">
                          {log.name || log.worker_name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-semibold ${
                              isIncomplete ? "text-primary" : "text-mid-gray"
                            }`}
                          >
                            {log.checklistComplete === null
                              ? "근무 중"
                              : isIncomplete
                              ? "• 체크리스트 미완료"
                              : "• 체크리스트 완료"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-xs gap-1">
                        <p>
                          <span className="text-mid-gray mr-1">출근</span>
                          <span className="font-bold text-primary">{log.clockIn}</span>
                        </p>
                        <p>
                          <span className="text-mid-gray mr-1">퇴근</span>
                          <span className="font-bold text-primary">{log.clockOut}</span>
                        </p>
                      </div>
                    </div>

                    {isIncomplete && isOpen && (
                      <div className="mt-3 pt-3 border-t border-line-gray text-xs">
                        <p className="text-mid-gray mb-1">미작성 사유</p>
                        <p className="font-semibold text-on-background">
                          {log.reason || "사유 미작성"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <p className="text-center font-caption text-caption text-mid-gray py-8">
                  해당 날짜의 출퇴근 기록이 없습니다.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </PhoneFrame>
  );
}