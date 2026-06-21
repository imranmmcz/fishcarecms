"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");
const { ping } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 4000);

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("CORS blocked for origin: " + origin));
    },
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await ping();
    console.log("[db] MySQL connection OK");
  } catch (e) {
    console.error("[db] MySQL connection FAILED:", e.message);
    console.error("    Server will still start; /api/health will report db=down.");
  }
  app.listen(PORT, () => console.log("[server] listening on http://localhost:" + PORT));
}

start();

process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
process.on("uncaughtException", (err) => console.error("[uncaughtException]", err));