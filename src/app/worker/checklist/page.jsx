"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tasksByShift } from "@/lib/dummyData";
import { fetchTasks } from "@/lib/taskListStorage";
import { getShiftCompletion, toggleTaskCompletion } from "@/lib/checklistStorage";
import { getStoredPhotos, uploadTaskPhoto } from "@/lib/photoStorage";
import ChecklistItem from "@/components/ChecklistItem";
import PhoneFrame from "@/components/PhoneFrame";

function WorkerChecklistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawShift = searchParams.get("shift");
  const shift = rawShift && rawShift in tasksByShift ? rawShift : "마감";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState({});
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [uploadNotice, setUploadNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchTasks(shift).then((data) => {
      if (isMounted) {
        setTasks(data);
        setLoading(false);
      }
    });
    setCompleted(getShiftCompletion(shift));
    const storedPhotos = getStoredPhotos();
    if (storedPhotos && Object.keys(storedPhotos).length > 0) {
      setPhotoPreviews(storedPhotos);
    }
    return () => {
      isMounted = false;
    };
  }, [shift]);

  function toggle(id) {
    const next = toggleTaskCompletion(shift, id);
    setCompleted({ ...next });
  }

  async function handleCamera(id) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const result = await uploadTaskPhoto({
        file,
        taskId: id,
        shift,
        title: tasks.find((task) => task.id === id)?.title || "체크리스트",
      });
      if (result?.url) {
        setPhotoPreviews((prev) => ({ ...prev, [id]: result.url }));
        setUploadNotice("사진이 업로드되었습니다.");
      } else {
        setUploadNotice("사진 업로드에 실패했습니다. Supabase Storage 버킷을 확인해주세요.");
      }
    };
    input.click();
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
            {uploadNotice && (
              <p className="font-caption text-caption text-primary mt-2">{uploadNotice}</p>
            )}
          </section>

          {loading ? (
            <div className="py-8 text-center text-mid-gray font-caption text-caption">
              체크리스트 불러오는 중...
            </div>
          ) : (
            <div className="flex flex-col gap-list-gap">
              {tasks.map((task) => (
                <ChecklistItem
                  key={task.id}
                  title={task.title}
                  completed={!!completed[task.id]}
                  onToggle={() => toggle(task.id)}
                  onCamera={() => handleCamera(task.id)}
                  mode="worker"
                  photoPreview={photoPreviews[task.id]}
                />
              ))}
              {tasks.length === 0 && (
                <p className="text-center font-caption text-caption text-mid-gray py-6">
                  등록된 항목이 없습니다.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </PhoneFrame>
  );
}

export default function WorkerChecklistPage() {
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
      <WorkerChecklistContent />
    </Suspense>
  );
}