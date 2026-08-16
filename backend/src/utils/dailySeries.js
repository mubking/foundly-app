// Shared by GET /api/admin/dashboard for dailyUsers/dailyReports/
// dailyClaims/dailyMatches — one real `$group`-by-day aggregation per
// series, zero-filled for days with no rows so a quiet day reads as 0,
// never simply missing (and never invented).

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * @param {import("mongoose").Model} Model
 * @param {{ days?: number, dateField?: string }} [options]
 * @returns {Promise<Array<{date: string, count: number}>>}
 */
export async function dailySeries(Model, { days = 30, dateField = "createdAt" } = {}) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await Model.aggregate([
    { $match: { [dateField]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}`, timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const countByDate = new Map(rows.map((r) => [r._id, r.count]));

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since);
    date.setUTCDate(date.getUTCDate() + i);
    const key = toDateKey(date);
    series.push({ date: key, count: countByDate.get(key) || 0 });
  }

  return series;
}
