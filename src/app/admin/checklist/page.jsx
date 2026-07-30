"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tasksByShift } from "@/lib/dummyData";
import { fetchTasks, addTask, updateTaskTitle, deleteTask } from "@/lib/taskListStorage";
import ChecklistItem from "@/components/ChecklistItem";
import PhoneFrame from "@/components/PhoneFrame";

function AdminChecklistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawShift = searchParams.get("shift");
  const shift = rawShift && rawShift in tasksByShift ? rawShift : "마감";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchTasks(shift).then((tasks) => {
      if (isMounted) {
        setItems(tasks);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [shift]);

  async function handleSaveTitle(taskId, newTitle) {
    const updated = await updateTaskTitle(shift, taskId, newTitle);
    setItems(updated);
  }

  async function handleDelete(taskId) {
    const updated = await deleteTask(shift, taskId);
    setItems(updated);
  }

  async function handleAdd() {
    const title = window.prompt("추가할 항목명");
    if (title && title.trim().length > 0) {
      const updated = await addTask(shift, title.trim());
      setItems(updated);
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

          {loading ? (
            <div className="py-8 text-center text-mid-gray font-caption text-caption">
              체크리스트 불러오는 중...
            </div>
          ) : (
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
              {items.length === 0 && (
                <p className="text-center text-caption text-mid-gray py-6">
                  등록된 항목이 없습니다.
                </p>
              )}
            </div>
          )}

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

export default function AdminChecklistPage() {
  return (
    <Suspense
      fallback={
        <PhoneFrame>
          <div className="flex items-center justify-center h-full min-h-[400px] text-mid-gray text-caption font-caption">
            로딩 중...
          </div>
        </PhoneFrame>
      }
    >
      <AdminChecklistContent />
    </Suspense>
  );
}
