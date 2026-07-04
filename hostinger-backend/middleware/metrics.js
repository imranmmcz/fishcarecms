/**
 * Lightweight in-memory metrics for the health/observability dashboard.
 * - Rolling ring buffer of the last N requests (latency + status).
 * - Separate ring buffer for the last N errors (>= 400).
 * No persistence: cleared on restart. Cheap: O(1) push per request.
 */

const MAX_REQUESTS = 500;
const MAX_ERRORS = 100;

const requestBuffer = [];
const errorBuffer = [];

function push(buf, item, cap) {
  buf.push(item);
  if (buf.length > cap) buf.splice(0, buf.length - cap);
}

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  // Attach a request id (used by errorHandler + response header)
  if (!req.id) {
    try {
      req.id = (require('crypto').randomUUID && require('crypto').randomUUID()) || String(Date.now());
    } catch {
      req.id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    }
  }
  res.setHeader('X-Request-Id', req.id);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const route = (req.route && req.route.path) || req.originalUrl.split('?')[0];
    push(
      requestBuffer,
      {
        id: req.id,
        method: req.method,
        route,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        ts: new Date().toISOString(),
      },
      MAX_REQUESTS
    );
    if (res.statusCode >= 400) {
      push(
        errorBuffer,
        {
          id: req.id,
          method: req.method,
          route,
          status: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          ts: new Date().toISOString(),
          message: res.locals.errorMessage || null,
        },
        MAX_ERRORS
      );
    }
  });
  next();
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function getLatencySummary() {
  const byRoute = new Map();
  for (const r of requestBuffer) {
    const key = `${r.method} ${r.route}`;
    if (!byRoute.has(key)) byRoute.set(key, []);
    byRoute.get(key).push(r.durationMs);
  }
  const routes = [];
  for (const [key, arr] of byRoute) {
    const sorted = [...arr].sort((a, b) => a - b);
    routes.push({
      route: key,
      count: arr.length,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      max: sorted[sorted.length - 1],
    });
  }
  routes.sort((a, b) => b.p95 - a.p95);
  const all = requestBuffer.map((r) => r.durationMs).sort((a, b) => a - b);
  return {
    total_requests: requestBuffer.length,
    overall: {
      p50: percentile(all, 50),
      p95: percentile(all, 95),
      p99: percentile(all, 99),
    },
    routes: routes.slice(0, 30),
  };
}

function getRecentErrors(limit = 50) {
  return errorBuffer.slice(-limit).reverse();
}

function recordErrorMessage(req, res, message) {
  res.locals.errorMessage = message;
}

module.exports = {
  metricsMiddleware,
  getLatencySummary,
  getRecentErrors,
  recordErrorMessage,
};