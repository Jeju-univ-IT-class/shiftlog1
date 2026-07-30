"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAttendanceLogs } from "@/lib/attendanceStorage";
import TopAppBar from "@/components/TopAppBar";
import PhoneFrame from "@/components/PhoneFrame";

export default function AdminAttendancePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "owner") {
      router.replace("/");
      return;
    }
    setSession(s);
    setLogs(getAttendanceLogs());
  }, [router]);

  if (!session) return null;

  const filtered = logs.filter((log) => log.name.includes(query.trim()));

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
                2023년 10월 24일
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
          <div className="flex flex-col gap-list-gap">
            {filtered.map((log) => {
              const inProgress = log.checklistComplete === null;
              const isIncomplete = log.checklistComplete === false;
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
                        {log.name} / ID: {log.id}
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
                        <span className="font-semibold">{log.clockIn}</span>
                      </div>
                      <div className="flex items-center gap-1 font-caption text-caption text-primary">
                        <span className="text-mid-gray">퇴근</span>
                        <span className="font-semibold">{log.clockOut ?? "-"}</span>
                      </div>
                    </div>
                  </div>

                  {isIncomplete && isOpen && (
                    <div className="px-card-padding pb-card-padding pt-0 -mt-1">
                      <div className="border-t border-line-gray pt-3">
                        <p className="font-caption text-caption text-mid-gray mb-1">
                          미작성 사유
                        </p>
                        <p className="font-body-mobile text-body-mobile text-on-background">
                          {log.reason}
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
          <div className="h-24"></div>
        </section>
      </div>
    </PhoneFrame>
  );
}
