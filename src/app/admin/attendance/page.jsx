"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { fetchAttendanceLogs } from "@/lib/attendanceStorage";
import TopAppBar from "@/components/TopAppBar";
import PhoneFrame from "@/components/PhoneFrame";

export default function AdminAttendancePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "owner") {
      router.replace("/");
      return;
    }
    setSession(s);

    async function loadLogs() {
      setLoading(true);
      const data = await fetchAttendanceLogs();
      setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, [router]);

  if (!session) return null;

  const trimmedQuery = query.trim();
  // DB의 worker_name 필드 기준으로 검색
  const filtered = logs.filter((log) =>
    (log.worker_name || "").toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  // 시간 변환 함수 (ISO String -> HH:mm)
  function formatTime(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  // 특이사항 작성 날짜 및 시간 변환 함수
  function formatDateTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }

  function highlightName(name = "") {
    if (!trimmedQuery) return name;

    const parts = [];
    const lowerName = name.toLowerCase();
    const lowerQuery = trimmedQuery.toLowerCase();
    let start = 0;

    while (start < name.length) {
      const index = lowerName.indexOf(lowerQuery, start);
      if (index === -1) {
        parts.push(name.slice(start));
        break;
      }

      if (index > start) {
        parts.push(name.slice(start, index));
      }

      parts.push(
        <span key={`${name}-${index}`} className="bg-primary/20 text-primary font-semibold rounded px-0.5">
          {name.slice(index, index + trimmedQuery.length)}
        </span>
      );

      start = index + trimmedQuery.length;
    }

    return parts.length > 0 ? parts : name;
  }

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const todayStr = `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일`;

  return (
    <PhoneFrame>
      <div className="h-full min-h-screen sm:min-h-[800px] flex flex-col bg-pure-white">
        <TopAppBar title="출퇴근 기록" showSearch={false} />

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

        <div className="px-gutter py-unit border-b border-line-gray">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2">
              <span className="font-body-mobile text-body-mobile font-semibold">
                {todayStr}
              </span>
              <span className="material-symbols-outlined text-mid-gray text-[18px]">
                calendar_today
              </span>
            </div>
            <div className="text-mid-gray font-caption text-caption">
              전체 {filtered.length}건
            </div>
          </div>
        </div>

        <section className="flex-1 overflow-y-auto px-gutter py-4 bg-pure-white">
          {loading ? (
            <div className="text-center font-caption text-caption text-mid-gray py-8">
              근태 기록을 불러오는 중...
            </div>
          ) : (
            <div className="flex flex-col gap-list-gap">
              {filtered.map((log) => {
                const inProgress = log.checklist_complete === null;
                const isIncomplete = log.checklist_complete === false;
                const isOpen = !!expanded[log.id];

                return (
                  <div
                    key={log.id}
                    className={`bg-pure-white rounded transition-all ${
                      isIncomplete ? "border-2 border-primary" : "border border-line-gray"
                    }`}
                  >
                    <div
                      onClick={isIncomplete ? () => toggleExpand(log.id) : undefined}
                      className={`flex justify-between items-center p-card-padding ${
                        isIncomplete ? "cursor-pointer active:bg-surface-gray" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-body-mobile text-body-mobile font-bold text-primary">
                          {highlightName(log.worker_name)}
                        </span>
                        <div className="flex items-center gap-1">
                          {isIncomplete ? (
                            <span
                              className="material-symbols-outlined text-primary text-[14px]"
                              style={{ fontVariationSettings: '"FILL" 1' }}
                            >
                              error
                            </span>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          )}
                          <span
                            className={`font-caption text-caption ${
                              isIncomplete ? "text-primary font-bold" : "text-mid-gray"
                            }`}
                          >
                            {inProgress
                              ? "근무 중"
                              : isIncomplete
                              ? "체크리스트 미완료"
                              : "체크리스트 완료"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 font-caption text-caption text-primary">
                          <span className="text-mid-gray">출근</span>
                          <span className="font-semibold">{formatTime(log.clock_in_time)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-caption text-caption text-primary">
                          <span className="text-mid-gray">퇴근</span>
                          <span className="font-semibold">{formatTime(log.clock_out_time)}</span>
                        </div>
                      </div>
                    </div>

                    {isIncomplete && isOpen && (
                      <div className="px-card-padding pb-card-padding pt-0 -mt-1">
                        <div className="border-t border-line-gray pt-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-caption text-caption text-mid-gray">
                              특이사항 (미작성 사유)
                            </p>
                            {log.reason_created_at && (
                              <span className="text-[11px] text-mid-gray">
                                {formatDateTime(log.reason_created_at)} 등록됨
                              </span>
                            )}
                          </div>
                          <p className="font-body-mobile text-body-mobile text-on-background">
                            {log.reason || "사유 미작성"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <p className="text-center font-caption text-caption text-mid-gray py-8">
                  검색 결과가 없습니다.
                </p>
              )}
            </div>
          )}
          <div className="h-24"></div>
        </section>
      </div>
    </PhoneFrame>
  );
}