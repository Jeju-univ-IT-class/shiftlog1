"use client";

const SHIFTS = ["오픈", "미들", "마감"];

export default function ShiftChips({ selected, onSelect }) {
  return (
    <section className="flex flex-col gap-4 mb-8">
      <h2 className="font-headline-h2-mobile text-headline-h2-mobile font-bold text-primary">
        근무 타임 선택
      </h2>
      <div className="flex flex-wrap gap-2">
        {SHIFTS.map((shift) => {
          const active = shift === selected;
          return (
            <button
              key={shift}
              onClick={() => onSelect?.(shift)}
              className={`shift-chip flex-1 py-4 px-2 border-2 rounded-[12px] font-bold transition-all active:scale-95 text-center ${
                active
                  ? "bg-primary text-pure-white border-primary"
                  : "bg-pure-white text-primary border-line-gray"
              }`}
            >
              {shift}
            </button>
          );
        })}
      </div>
    </section>
  );
}
