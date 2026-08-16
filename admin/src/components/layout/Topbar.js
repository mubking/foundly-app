"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg px-6">
      <h1 className="text-lg font-semibold text-text">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-text">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-text-light">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
