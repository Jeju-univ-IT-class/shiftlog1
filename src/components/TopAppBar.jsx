"use client";

import { useRouter } from "next/navigation";

export default function TopAppBar({ title, onSearch, showSearch = true }) {
  const router = useRouter();

  return (
    <header className="w-full top-0 sticky flex justify-between items-center px-gutter h-16 border-b border-line-gray z-50 bg-pure-white">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="material-symbols-outlined text-primary hover:bg-surface-container transition-colors p-2 rounded-full active:opacity-80"
        >
          arrow_back
        </button>
        <h1 className="font-headline-h1-mobile text-headline-h1-mobile text-primary">
          {title}
        </h1>
      </div>
      {showSearch && (
        <div className="flex items-center">
          <button onClick={onSearch} className="material-symbols-outlined text-primary p-2">
            search
          </button>
        </div>
      )}
    </header>
  );
}
