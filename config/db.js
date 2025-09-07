const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false // Supabase needs this for SSL
  },
  keepAlive: true,
  statement_timeout: 0,
  query_timeout: 0,
  application_name: "devhub-backend",
  family: 4 //  Forces IPv4, fixes ENETUNREACH
});

pool.on("connect", () => {
  console.log(" Connected to Supabase PostgreSQL Database");
});

pool.on("error", (err) => {
  console.error(" Unexpected DB Error:", err);
});

module.exports = { pool };
