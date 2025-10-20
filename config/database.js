// database.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// ✅ Secure connection for Neon (requires SSL)
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "devhub",
  port: process.env.DB_PORT || 5432,
  ssl: {
    require: true,
    rejectUnauthorized: false, // important for Neon Cloud DBs
  },
});

export const initializeDatabase = async () => {
  try {
    console.log("✅ Connecting to PostgreSQL...");
    const client = await pool.connect();

    // ✅ Create tables manually if they don’t exist
    const tableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS developers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT,
      skills TEXT[],
      github_link TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      budget DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
      proposal_text TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    await client.query(tableSQL);
    console.log("✅ All tables created or verified successfully.");

    client.release();
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
  }
};

export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error("❌ Query error:", err.message);
    throw err;
  } finally {
    client.release();
  }
};
