/**
 * Centralized error middleware. Emits a structured JSON envelope and
 * records the message onto res.locals so metrics.js can attach it to
 * the recent-errors ring buffer.
 */
const { recordErrorMessage } = require('./metrics');

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const message = err.message || 'Internal server error';

  if (err.message && err.message.includes('CORS')) {
    recordErrorMessage(req, res, 'CORS blocked');
    return res.status(403).json({
      error: 'Access denied: CORS policy violation',
      code: 'CORS_BLOCKED',
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Log server-side (never leak stack in prod response body)
  if (status >= 500) {
    console.error(`[${req.id}] ${req.method} ${req.originalUrl} →`, err);
  }
  recordErrorMessage(req, res, message);

  res.status(status).json({
    error: message,
    code,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;