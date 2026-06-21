"use strict";

function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const payload = {
    error: err.publicMessage || (status >= 500 ? "Internal server error" : err.message),
  };
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;
  if (status >= 500) console.error("[error]", err);
  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };