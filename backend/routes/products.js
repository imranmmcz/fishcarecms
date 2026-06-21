"use strict";

const router = require("express").Router();
const { query, getOne } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await query(
      "SELECT id, name, price, stock_quantity, is_active FROM products WHERE is_active = 1 ORDER BY id DESC LIMIT ?",
      [limit],
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const row = await getOne("SELECT * FROM products WHERE id = ? LIMIT 1", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.json(row);
  } catch (e) { next(e); }
});

router.post("/", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, price, stock_quantity = 0, is_active = 1 } = req.body || {};
    if (!name || price == null) return res.status(400).json({ error: "name and price required" });
    const result = await query(
      "INSERT INTO products (name, price, stock_quantity, is_active) VALUES (?, ?, ?, ?)",
      [name, price, stock_quantity, is_active ? 1 : 0],
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) { next(e); }
});

module.exports = router;