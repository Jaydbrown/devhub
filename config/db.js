const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  keepAlive: true,      //  Keeps connections open
  statement_timeout: 0, //  Avoid early timeouts
  query_timeout: 0,
  application_name: "devhub-backend"
});

pool.on("connect", () => {
  console.log(" Connected to Supabase PostgreSQL Database");
});

pool.on("error", (err) => {
  console.error(" Unexpected DB Error:", err);
});

module.exports = { pool };
