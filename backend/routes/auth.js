"use strict";

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, getOne } = require("../db");

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const lower = String(email).toLowerCase();
    const existing = await getOne("SELECT id FROM users WHERE email = ? LIMIT 1", [lower]);
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'user')",
      [lower, hash, full_name || null],
    );
    const user = { id: result.insertId, email: lower, role: "user" };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    res.status(201).json({ token, user });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const user = await getOne(
      "SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [String(email).toLowerCase()],
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    res.json({ token, user: payload });
  } catch (e) { next(e); }
});

module.exports = router;