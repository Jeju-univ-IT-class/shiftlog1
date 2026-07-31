"use client";

export default function NoticeCard({ id, text, time, authorRole, onDelete }) {
  const isOwner = authorRole === "owner";

  return (
    <div
      className={`p-3.5 rounded-xl border flex justify-between items-start gap-2 transition-all ${
        isOwner
          ? "bg-blue-50/80 border-primary/40 shadow-sm" // 사장님 작성글 하이라이팅 스타일
          : "bg-surface-container border-line-gray" // 일반 알바생 작성글 스타일
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-mid-gray">
            {time}
          </span>
          {isOwner && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-pure-white">
              사장님 공지
            </span>
          )}
        </div>
        <p className="text-body-mobile text-on-background whitespace-pre-wrap leading-relaxed">
          {text}
        </p>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(id)}
          className="px-2.5 py-1 text-xs font-bold text-error bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
        >
          삭제
        </button>
      )}
    </div>
  );
}