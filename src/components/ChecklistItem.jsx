"use client";

import { useState } from "react";

export default function ChecklistItem({
  title,
  completed,
  onToggle,
  onCamera,
  onSaveTitle,
  onDelete,
  mode = "worker", // "worker" | "admin"
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  function startEdit() {
    setDraft(title);
    setIsEditing(true);
  }

  function commitEdit() {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== title) {
      onSaveTitle?.(trimmed);
    } else {
      setDraft(title);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      setDraft(title);
      setIsEditing(false);
    }
  }

  const isAdmin = mode === "admin";

  return (
    <div
      className={`checklist-item group flex items-center justify-between bg-pure-white border border-line-gray p-card-padding transition-all duration-200 ${
        completed ? "completed" : ""
      }`}
    >
      <div
        className={`flex items-center gap-4 flex-1 ${isAdmin ? "" : "cursor-pointer"}`}
        onClick={isAdmin ? undefined : onToggle}
      >
        <div
          className={`checkbox-box w-6 h-6 border-2 border-line-gray flex items-center justify-center transition-colors ${
            isAdmin ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <span
            className="material-symbols-outlined text-pure-white text-[18px] hidden"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            check
          </span>
        </div>

        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="task-text font-body-mobile text-body-mobile text-on-background bg-transparent border-b border-line-gray outline-none flex-1"
          />
        ) : (
          <span className="task-text font-body-mobile text-body-mobile text-on-background transition-all">
            {title}
          </span>
        )}
      </div>

      {isAdmin && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEdit();
            }}
            className="material-symbols-outlined text-primary p-2 hover:bg-surface-gray rounded-lg transition-colors"
          >
            edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="material-symbols-outlined text-primary p-2 hover:bg-surface-gray rounded-lg transition-colors"
          >
            delete
          </button>
        </>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onCamera?.();
        }}
        className="material-symbols-outlined text-primary p-2 hover:bg-surface-gray rounded-lg transition-colors"
      >
        photo_camera
      </button>
    </div>
  );
}
