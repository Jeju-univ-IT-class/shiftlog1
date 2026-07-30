"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tasksByShift } from "@/lib/dummyData";
import { getTasks, addTask, updateTaskTitle, deleteTask } from "@/lib/taskListStorage";
import ChecklistItem from "@/components/ChecklistItem";
import PhoneFrame from "@/components/PhoneFrame";

export default function AdminChecklistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shift = searchParams.get("shift") in tasksByShift ? searchParams.get("shift") : "마감";

  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getTasks(shift));
  }, [shift]);

  function handleSaveTitle(taskId, newTitle) {
    setItems(updateTaskTitle(shift, taskId, newTitle));
  }

  function handleDelete(taskId) {
    setItems(deleteTask(shift, taskId));
  }

  function handleAdd() {
    const title = window.prompt("추가할 항목명");
    if (title && title.trim().length > 0) {
      setItems(addTask(shift, title.trim()));
    }
  }

  return (
    <PhoneFrame>
      <div className="relative h-full min-h-screen sm:min-h-[800px] flex flex-col items-center bg-pure-white">
        <button
          aria-label="Close"
          onClick={() => router.push("/admin")}
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
              항목을 추가/수정/삭제할 수 있어요.
            </p>
          </section>

          <div className="flex flex-col gap-list-gap">
            {items.map((task) => (
              <ChecklistItem
                key={task.id}
                title={task.title}
                completed={false}
                onCamera={() => console.log("camera activated for", task.id)}
                onSaveTitle={(newTitle) => handleSaveTitle(task.id, newTitle)}
                onDelete={() => handleDelete(task.id)}
                mode="admin"
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 w-full bg-primary text-pure-white py-4 rounded-lg font-button transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">add</span>
              <span>항목 추가하기</span>
            </button>
          </div>
        </main>
      </div>
    </PhoneFrame>
  );
}
