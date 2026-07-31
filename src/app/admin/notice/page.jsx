"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { fetchNotices, deleteNotice } from "@/lib/noticeStorage";
import TopAppBar from "@/components/TopAppBar";
import PhoneFrame from "@/components/PhoneFrame";

export default function AdminNoticesPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "owner") {
      router.replace("/");
      return;
    }
    setSession(s);

    async function loadNotices() {
      setLoading(true);
      const data = await fetchNotices();
      setNotices(data);
      setLoading(false);
    }
    loadNotices();
  }, [router]);

  const handleDelete = async (id) => {
    if (!confirm("이 특이사항 메모를 삭제하시겠습니까?")) return;

    const success = await deleteNotice(id);
    if (success) {
      setNotices((prev) => prev.filter((item) => item.id !== id));
      alert("삭제되었습니다.");
    } else {
      alert("삭제 처리에 실패했습니다.");
    }
  };

  if (!session) return null;

  return (
    <PhoneFrame>
      <div className="h-full min-h-screen sm:min-h-[800px] flex flex-col bg-pure-white">
        <TopAppBar title="특이사항 관리 (사장님)" showSearch={false} />

        <main className="flex-1 px-gutter py-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-body-mobile text-primary">
              등록된 특이사항 목록
            </h2>
            <span className="text-xs text-mid-gray">전체 {notices.length}건</span>
          </div>

          {loading ? (
            <p className="text-center text-caption text-mid-gray py-8">
              특이사항을 불러오는 중...
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-xl border border-line-gray bg-surface-container flex justify-between items-start gap-3"
                >
                  <div className="flex-1">
                    {/* 년월일 시:분 명확한 시간 표시 */}
                    <p className="text-[11px] text-mid-gray font-semibold mb-1">
                      {notice.time}
                    </p>
                    <p className="text-body-mobile text-on-background whitespace-pre-wrap">
                      {notice.text}
                    </p>
                  </div>
                  {/* 사장님 전용 삭제 버튼 */}
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="px-2.5 py-1 bg-red-50 text-error text-xs rounded-lg font-bold hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))}

              {notices.length === 0 && (
                <p className="text-center text-caption text-mid-gray py-8">
                  등록된 특이사항이 없습니다.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </PhoneFrame>
  );
}