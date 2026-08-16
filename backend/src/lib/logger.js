// Small structured logger for request-level observability (see /api/health
// and the withRequestLogging wrapper below). Deliberately not a full logging
// library — this project has no log aggregator today, so the only job here
// is to emit one-line JSON that's easy to grep/parse later (route, status,
// duration, error category) instead of the ad-hoc `console.error("X error:",
// err)` calls scattered across route handlers.
const REDACTED_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "jwt",
  "secret",
  "apikey",
  "api_key",
  "smtp_pass",
  "code",
  "resetcode",
  "reset_code",
]);

function redact(meta) {
  if (!meta || typeof meta !== "object") return meta;
  const out = {};
  for (const [key, value] of Object.entries(meta)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase()) ? "[redacted]" : value;
  }
  return out;
}

function log(level, category, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...redact(meta),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (category, message, meta) => log("info", category, message, meta),
  warn: (category, message, meta) => log("warn", category, message, meta),
  error: (category, message, meta) => log("error", category, message, meta),
};

/**
 * Wraps an App Router route handler with timing + outcome logging. Logs
 * exactly once per request: route, method, status, and duration. On a
 * thrown exception (uncaught by the handler's own try/catch) it logs a 500
 * and re-throws unchanged, so Next.js's own error handling still applies.
 *
 * Only metadata is logged — never headers or the request/response body — so
 * this can't leak Authorization headers, tokens, or reset codes.
 *
 * @param {(request: Request, context?: any) => Promise<Response>} handler
 * @param {{ route: string }} options
 */
export function withRequestLogging(handler, { route }) {
  return async function wrapped(request, context) {
    const start = Date.now();
    const method = request.method;

    try {
      const response = await handler(request, context);
      logger.info("http_request", `${method} ${route}`, {
        route,
        method,
        status: response.status,
        durationMs: Date.now() - start,
      });
      return response;
    } catch (err) {
      logger.error("http_request", `${method} ${route} threw`, {
        route,
        method,
        status: 500,
        durationMs: Date.now() - start,
        error: err?.message,
      });
      throw err;
    }
  };
}

export default logger;
