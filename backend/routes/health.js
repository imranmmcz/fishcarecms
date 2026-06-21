"use strict";

const router = require("express").Router();
const { ping } = require("../db");

router.get("/", async (_req, res) => {
  try {
    await ping();
    res.json({ status: "ok", db: "up", time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: "degraded", db: "down", error: e.message });
  }
});

module.exports = router;