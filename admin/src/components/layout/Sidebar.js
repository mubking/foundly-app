"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, UPCOMING_NAV_ITEMS } from "./nav";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-bg">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          F
        </div>
        <span className="text-sm font-semibold text-text">Foundly Admin</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-primary-tint text-primary" : "text-ink2 hover:bg-surface"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div className="mt-4 border-t border-border pt-4">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-subtle">Coming soon</p>
          {UPCOMING_NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ghost"
              title="Not built yet"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
