const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ✅ Load .env database credentials
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "devhub",
    password: process.env.DB_PASSWORD || "your_password",
    port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
    try {
        console.log("🚀 Running migrations...");

        // ✅ Read schema.sql file
        const schemaPath = path.join(__dirname, "schema.sql");
        const schemaSQL = fs.readFileSync(schemaPath, "utf-8");

        // ✅ Execute SQL commands
        await pool.query(schemaSQL);

        console.log("✅ Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    } finally {
        pool.end();
    }
}

runMigrations();
