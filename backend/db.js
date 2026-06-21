"use strict";

const mysql = require("mysql2/promise");
require("dotenv").config();

function buildSslConfig() {
  if (String(process.env.DB_SSL).toLowerCase() !== "true") return undefined;
  if (process.env.DB_SSL_CA_BASE64) {
    return {
      ca: Buffer.from(process.env.DB_SSL_CA_BASE64, "base64").toString("utf8"),
      rejectUnauthorized: true,
    };
  }
  return { rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "fishcare",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true,
  charset: "utf8mb4",
  ssl: buildSslConfig(),
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getOne(sql, params = []) {
  const rows = await query(sql, params);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, getOne, withTransaction, ping };