const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase on Render
  }
});

pool.on("connect", () => {
  console.log(" Connected to Supabase PostgreSQL Database");
});

pool.on("error", (err) => {
  console.error(" Unexpected DB Error:", err);
  process.exit(-1);
});

module.exports = { pool };
