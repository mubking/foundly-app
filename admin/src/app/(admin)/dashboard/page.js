"use client";

import Link from "next/link";

import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import StatCard from "@/components/ui/StatCard";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import DailyBarChart from "@/components/dashboard/DailyBarChart";

const CARDS = [
  { key: "totalUsers", label: "Total users" },
  { key: "activeUsersCount", label: "Active users" },
  { key: "totalLostItems", label: "Lost items" },
  { key: "totalFoundItems", label: "Found items" },
  { key: "totalClaims", label: "Claims" },
  { key: "totalMatches", label: "Matches" },
  { key: "pendingReports", label: "Pending reports", tone: "danger" },
  { key: "pendingVerifications", label: "Pending verifications", tone: "danger" },
  { key: "suspendedUsersCount", label: "Suspended users", tone: "danger" },
  { key: "removedListingsCount", label: "Removed listings" },
];

const DAILY_CHARTS = [
  { key: "dailyUsers", title: "Daily new users" },
  { key: "dailyReports", title: "Daily reports" },
  { key: "dailyClaims", title: "Daily claims" },
  { key: "dailyMatches", title: "Daily matches" },
];

function activityHref(link) {
  if (!link) return null;
  if (link.type === "user") return `/users/${link.id}`;
  if (link.type === "listing") return `/listings/${link.itemType}/${link.id}`;
  if (link.type === "verification") return "/verification";
  if (link.type === "report") return "/reports";
  return null;
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsync(() => api.dashboard(), []);

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={data?.[card.key]}
            tone={card.tone}
            loading={loading}
          />
        ))}
        <StatCard
          label="Recovery rate"
          value={data?.recoveryRate == null ? "—" : `${data.recoveryRate}%`}
          loading={loading}
        />
        <StatCard
          label="Monthly growth (users)"
          value={data?.monthlyGrowth?.growthPercent == null ? "—" : `${data.monthlyGrowth.growthPercent > 0 ? "+" : ""}${data.monthlyGrowth.growthPercent}%`}
          loading={loading}
        />
      </div>
      <p className="-mt-3 text-xs text-text-light">
        Recovery rate = lost items reunited with an owner (status &quot;claimed&quot;) ÷ total lost item reports.
        Monthly growth compares new signups this calendar month to last month.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DAILY_CHARTS.map((chart) => (
          <DailyBarChart key={chart.key} title={chart.title} series={data?.[chart.key] || []} loading={loading} />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-text">Recent activity</h2>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-surface-alt" />
            ))}
          </div>
        ) : !data?.recentActivity?.length ? (
          <EmptyState title="No recent activity" />
        ) : (
          <ul className="divide-y divide-border">
            {data.recentActivity.map((entry) => {
              const href = activityHref(entry.link);
              const row = (
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text">{entry.summary}</span>
                  <span className="shrink-0 pl-4 text-xs text-text-light">{formatDate(entry.createdAt)}</span>
                </div>
              );
              return (
                <li key={`${entry.type}-${entry.id}`}>
                  {href ? (
                    <Link href={href} className="block hover:bg-surface">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
