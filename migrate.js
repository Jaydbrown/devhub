// migrate.js
import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function migrate() {
  try {
    // Connect to the default postgres database first
    const adminClient = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      database: "postgres",
    });

    await adminClient.connect();

    // Create the devhub database if it doesn’t exist
    const dbName = process.env.DB_NAME;
    const check = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (check.rowCount === 0) {
      console.log(` Creating database '${dbName}'...`);
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(" Database created.");
    } else {
      console.log(" Database already exists.");
    }

    await adminClient.end();

    // Now connect to the devhub DB and run schema.sql
    const client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      database: dbName,
    });

    await client.connect();

    const schemaPath = path.join(process.cwd(), "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    console.log(" Running migration...");
    await client.query(schema);
    console.log(" Migration completed successfully!");

    await client.end();
  } catch (err) {
    console.error(" Migration failed:", err);
  }
}

migrate();
