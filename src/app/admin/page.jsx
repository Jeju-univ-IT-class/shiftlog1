"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { fetchNotices, createNotice, deleteNotice } from "@/lib/noticeStorage";
import NoticeCard from "@/components/NoticeCard";
import PhoneFrame from "@/components/PhoneFrame";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [notices, setNotices] = useState([]);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "owner") {
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

  // 사장님 모드에서 메모 작성 (authorRole: 'owner')
  async function handleRegisterMemo() {
    if (memo.trim().length === 0) return;
    const newNotice = await createNotice(memo, "owner");
    if (newNotice) {
      setNotices((prev) => [newNotice, ...prev]);
    }
    setMemo("");
  }

  // 삭제 처리
  const handleDeleteNotice = async (id) => {
    if (!confirm("이 특이사항 메모를 삭제하시겠습니까?")) return;

    const success = await deleteNotice(id);
    if (success) {
      setNotices((prev) => prev.filter((item) => item.id !== id));
    } else {
      alert("삭제 처리에 실패했습니다.");
    }
  };

  if (!session) return null;

  return (
    <PhoneFrame>
      <main className="px-container-mobile flex flex-col p-4 pt-12 h-full overflow-y-auto">
        {/* 상단 프로필 영역 */}
        <section className="flex justify-between items-start mb-6">
          <div>
            <p className="text-caption text-mid-gray">사장님 모드</p>
            <p className="font-headline-h2-mobile text-headline-h2-mobile font-bold text-primary">
              {session.displayName || session.name || "관리자"} 님
            </p>
            <h1 className="text-xl font-bold text-primary mt-1">
              {session.storeName || "테스트 매장"} 관리자 대시보드
            </h1>
          </div>
          <button 
            onClick={() => router.push("/admin/settings")} 
            className="p-2 text-mid-gray hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </section>

        {/* 근무 타임 선택 */}
        <section className="flex flex-col gap-3 mb-6">
          <h2 className="font-bold text-body-mobile text-primary">근무 타임 선택</h2>
          <div className="grid grid-cols-3 gap-3">
            {["오픈", "미들", "마감"].map((shift) => (
              <button
                key={shift}
                onClick={() => router.push(`/admin/checklist?shift=${encodeURIComponent(shift)}`)}
                className="py-4 bg-pure-white border border-line-gray rounded-xl font-bold text-primary hover:border-primary transition-all active:scale-95"
              >
                {shift}
              </button>
            ))}
          </div>
        </section>

        {/* 출퇴근 기록 열람 버튼 */}
        <section className="mb-6">
          <button
            onClick={() => router.push("/admin/attendance")}
            className="w-full py-4 bg-pure-white border border-line-gray rounded-xl font-bold text-primary hover:border-primary transition-all active:scale-95"
          >
            출근/퇴근 기록 열람
          </button>
        </section>

        {/* 기타 메모 / 특이사항 작성 및 목록 */}
        <section className="flex flex-col gap-4 pb-8">
          <h2 className="font-bold text-body-mobile text-primary">기타 메모 / 특이사항 작성</h2>
          
          {/* 사장님 전용 특이사항 입력창 */}
          <div className="relative group">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full p-4 rounded-[12px] border border-line-gray focus:border-2 focus:border-primary outline-none font-body-mobile text-body-mobile transition-all placeholder:text-mid-gray h-28 bg-surface-container"
              placeholder="알바생들에게 전달할 공지사항이나 전달글을 작성해주세요."
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleRegisterMemo}
              className="py-2.5 px-4 bg-primary text-pure-white rounded-[12px] font-bold text-xs active:scale-95 transition-all shadow-sm"
            >
              사장님 공지 등록
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {notices.map((n) => (
              <NoticeCard
                key={n.id}
                id={n.id}
                text={n.text}
                time={n.time}
                authorRole={n.authorRole}
                onDelete={handleDeleteNotice}
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