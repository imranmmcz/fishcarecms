"use strict";

const router = require("express").Router();
const { query, getOne } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await getOne(
      "SELECT id, email, full_name, role, created_at FROM users WHERE id = ? LIMIT 1",
      [req.user.id],
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) { next(e); }
});

router.get("/", authRequired, requireRole("admin"), async (_req, res, next) => {
  try {
    const rows = await query(
      "SELECT id, email, full_name, role, created_at FROM users ORDER BY id DESC LIMIT 200",
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;