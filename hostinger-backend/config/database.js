const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Timezone settings for Bangladesh
  timezone: '+06:00',
  // Character set for Bengali support
  charset: 'utf8mb4',
  // Auto reconnect on connection loss
  multipleStatements: false,
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Database connected successfully');
    console.log(`📦 Database: ${process.env.DB_NAME}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Database connection failed:', err.message);
    console.error('💡 .env ফাইলে DB_HOST, DB_USER, DB_PASSWORD, DB_NAME সঠিকভাবে সেট করুন');
  });

module.exports = pool;
