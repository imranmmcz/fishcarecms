const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * Auto-bootstrap the MySQL database on successful backend connection.
 *
 * Steps:
 *  1. Connect to the MySQL server WITHOUT selecting a database, then
 *     `CREATE DATABASE IF NOT EXISTS` so a fresh install works end-to-end.
 *  2. Connect to the target database with `multipleStatements: true` and
 *     execute every `*.sql` file in `database/` in a deterministic order.
 *  3. Log a summary per file (created / skipped / failed).
 *
 * The SQL files are written with `CREATE TABLE IF NOT EXISTS` / `INSERT IGNORE`,
 * so this is safe to run on every boot — no data loss on existing installs.
 */

const SCHEMA_DIR = path.join(__dirname, '..', 'database');

// Run order: base schema first, feature add-ons after, complete_schema last
// as it is the consolidated superset and uses IF NOT EXISTS / INSERT IGNORE.
const RUN_ORDER = [
  'schema.sql',
  'ecommerce_schema.sql',
  'reviews_schema.sql',
  'shipment_tracking_schema.sql',
  'pos_schema.sql',
  'catalog_schema.sql',
  'complete_schema.sql',
  'auth_upgrade.sql',
];

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME;
  if (!dbName) throw new Error('DB_NAME is not set in .env');

  const admin = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: 'utf8mb4',
    multipleStatements: false,
  });

  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`📦 Ensured database exists: ${dbName}`);
  } finally {
    await admin.end();
  }
}

async function runSchemaFile(conn, file) {
  const fullPath = path.join(SCHEMA_DIR, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⏭️  Skipped (not found): ${file}`);
    return;
  }
  const sql = fs.readFileSync(fullPath, 'utf8').trim();
  if (!sql) {
    console.log(`   ⏭️  Skipped (empty): ${file}`);
    return;
  }
  try {
    await conn.query(sql);
    console.log(`   ✅ Applied: ${file}`);
  } catch (err) {
    // Fall back to statement-by-statement so one benign failure (duplicate
    // column, unsupported ALTER) doesn't skip the rest of the file.
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));
    let ok = 0;
    let failed = 0;
    for (const stmt of statements) {
      try {
        await conn.query(stmt);
        ok++;
      } catch (e) {
        failed++;
        console.warn(`   ⚠️  ${file}: ${e.code || ''} ${e.sqlMessage || e.message}`);
      }
    }
    console.log(`   ✅ Applied: ${file} (${ok} ok, ${failed} skipped)`);
  }
}

async function applyAllSchemas() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    await conn.query("SET NAMES utf8mb4");
    await conn.query("SET FOREIGN_KEY_CHECKS=1");

    console.log('🛠  Auto-bootstrapping database schema…');

    // Run the curated order first
    const ran = new Set();
    for (const file of RUN_ORDER) {
      await runSchemaFile(conn, file);
      ran.add(file);
    }

    // Then run any other *.sql files we don't know about (future-proof)
    const extras = fs
      .readdirSync(SCHEMA_DIR)
      .filter((f) => f.endsWith('.sql') && !ran.has(f))
      .sort();
    for (const file of extras) {
      await runSchemaFile(conn, file);
    }

    console.log('✅ Database bootstrap complete');
  } finally {
    await conn.end();
  }
}

async function initDatabase() {
  if (process.env.AUTO_INIT_DB === 'false') {
    console.log('ℹ️  AUTO_INIT_DB=false → skipping schema bootstrap');
    return;
  }
  try {
    await ensureDatabaseExists();
    await applyAllSchemas();
  } catch (err) {
    console.error('❌ Database auto-init failed:', err.message);
    console.error('💡 Verify DB_HOST, DB_USER, DB_PASSWORD in .env and that the MySQL user has CREATE privileges.');
    // Re-throw so the server can decide whether to exit
    throw err;
  }
}

module.exports = { initDatabase, ensureDatabaseExists, applyAllSchemas };