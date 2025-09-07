-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'client',
    bio TEXT,
    skills TEXT[],
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- DEVELOPERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS developers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    bio TEXT,
    skills TEXT[],
    hourly_rate NUMERIC(10,2),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- PROJECTS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    skills TEXT[],
    budget VARCHAR(100),
    timeline VARCHAR(100),
    negotiation_type VARCHAR(50) DEFAULT 'direct',
    developer_id INTEGER REFERENCES developers(id),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- JOBS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    developer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget NUMERIC(12,2),
    deadline DATE, -- ✅ Properly added here
    job_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- JOB APPLICATIONS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, developer_id)
);

-- =========================
-- MESSAGES TABLE
-- =========================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    content TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- UPLOADS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255),
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size INTEGER,
    project_id INTEGER REFERENCES projects(id),
    uploaded_at TIMESTAMP DEFAULT now()
);
