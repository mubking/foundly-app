import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { logger } from "@/lib/logger";

// Public uptime-monitor endpoint (UptimeRobot etc.) — must stay cheap
// enough to hit every couple of minutes forever. It only proves two things:
// the app process is up, and MongoDB (the one hard dependency every request
// needs) is reachable. It deliberately does NOT touch Cloudinary, OpenAI,
// SMTP, or the socket server — those are optional dependencies whose
// outages shouldn't page anyone as "the whole backend is down". See
// docs/backend-progress.md and the individual lib/* modules for how those
// failures are classified instead.
export const dynamic = "force-dynamic";

const SERVICE_NAME = "foundly-backend";

// Response shape here is intentionally flat ({status, database, ...}), not
// the app's usual {success, message, data} envelope from lib/response.js —
// this endpoint is a contract with an external monitor, not an internal API
// consumer, so it follows the shape UptimeRobot-style checks expect instead.
export async function GET() {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || "development";

  try {
    await connectDB();
    // A cached connection can go stale silently (dropped socket, replica
    // failover) without readyState updating instantly, so ping rather than
    // just trusting the cache. `ping` is the cheapest possible round trip —
    // no collection scan, no document read.
    await mongoose.connection.db.admin().command({ ping: 1 });

    logger.info("health_check", "GET /api/health", {
      route: "/api/health",
      method: "GET",
      status: 200,
      durationMs: Date.now() - start,
    });

    return Response.json(
      {
        status: "ok",
        database: "connected",
        service: SERVICE_NAME,
        environment,
        timestamp,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err) {
    // Never include err.message in the response — driver error strings can
    // echo back connection details. Full message is fine server-side only.
    logger.error("health_check", "GET /api/health failed", {
      route: "/api/health",
      method: "GET",
      status: 503,
      durationMs: Date.now() - start,
      errorCategory: "database",
      error: err?.message,
    });

    return Response.json(
      {
        status: "unhealthy",
        database: "disconnected",
        service: SERVICE_NAME,
        environment,
        timestamp,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }
}
