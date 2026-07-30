"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tasksByShift } from "@/lib/dummyData";
import { getTasks } from "@/lib/taskListStorage";
import { getShiftCompletion, toggleTaskCompletion } from "@/lib/checklistStorage";
import ChecklistItem from "@/components/ChecklistItem";
import PhoneFrame from "@/components/PhoneFrame";

export default function WorkerChecklistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shift = searchParams.get("shift") in tasksByShift ? searchParams.get("shift") : "마감";
  const [tasks, setTasks] = useState(() => getTasks(shift));

  const [completed, setCompleted] = useState({});

  useEffect(() => {
    setTasks(getTasks(shift));
    setCompleted(getShiftCompletion(shift));
  }, [shift]);

  function toggle(id) {
    const next = toggleTaskCompletion(shift, id);
    setCompleted({ ...next });
  }

  function handleCamera(id) {
    // 실제 사진 업로드는 다음 슬라이스에서 연결
    console.log("camera activated for", shift, id);
  }

  return (
    <PhoneFrame>
      <div className="relative h-full min-h-screen sm:min-h-[800px] flex flex-col items-center bg-pure-white">
        <button
          aria-label="Close"
          onClick={() => router.push("/worker")}
          className="material-symbols-outlined absolute top-4 right-4 text-primary p-2 z-50"
        >
          close
        </button>

        <main className="w-full pt-16 pb-24 px-gutter flex flex-col flex-1">
          <section className="mb-section-gap">
            <h2 className="font-display-mobile text-display-mobile font-semibold text-primary">
              {shift} 체크리스트
            </h2>
            <p className="font-caption text-caption text-mid-gray mt-1">
              오늘의 필수 할 일을 확인하고 완료해주세요.
            </p>
          </section>

          <div className="flex flex-col gap-list-gap">
            {tasks.map((task) => (
              <ChecklistItem
                key={task.id}
                title={task.title}
                completed={!!completed[task.id]}
                onToggle={() => toggle(task.id)}
                onCamera={() => handleCamera(task.id)}
                mode="worker"
              />
            ))}
          </div>
        </main>
      </div>
    </PhoneFrame>
  );
}
