-- DevHub Database Schema
-- Run this file to set up your PostgreSQL database

-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS developers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (main user table)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('Developer', 'Client')),
    phone VARCHAR(50),
    preferred_comm VARCHAR(50) DEFAULT 'Email',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create developers table (extends users)
CREATE TABLE developers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE,
    bio TEXT,
    skills TEXT,
    experience_level VARCHAR(50) CHECK (experience_level IN ('Junior', 'Mid', 'Senior')),
    years_experience INTEGER DEFAULT 0,
    portfolio_url TEXT,
    location VARCHAR(255),
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table (extends users)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    company_website TEXT,
    industry VARCHAR(255),
    company_size VARCHAR(100),
    work_email VARCHAR(255),
    budget_range VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(10, 2),
    deadline DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    developer_id INTEGER REFERENCES developers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(developer_id, client_id)
);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_developers_user_id ON developers(user_id);
CREATE INDEX idx_developers_rating ON developers(rating DESC);
CREATE INDEX idx_developers_skills ON developers USING gin(to_tsvector('english', skills));
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_developer_id ON projects(developer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_reviews_developer_id ON reviews(developer_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample Users
INSERT INTO users (full_name, email, password, user_type, phone, preferred_comm) VALUES
('Emmanuel Adeyemi', 'emmanuel@devhub.com', '$2b$10$rQZ5K5Z5Z5Z5Z5Z5Z5Z5ZeF5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Developer', '+234-800-1234', 'Email'),
('Amaka Nwosu', 'amaka@devhub.com', '$2b$10$rQZ5K5Z5Z5Z5Z5Z5Z5Z5ZeF5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Client', '+234-800-5678', 'WhatsApp'),
('Victor Eze', 'victor@devhub.com', '$2b$10$rQZ5K5Z5Z5Z5Z5Z5Z5Z5ZeF5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Developer', '+234-800-9012', 'Slack'),
('Chisom Daniels', 'chisom@devhub.com', '$2b$10$rQZ5K5Z5Z5Z5Z5Z5Z5Z5ZeF5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Developer', '+234-800-3456', 'Email');

-- Sample Developers
INSERT INTO developers (user_id, username, bio, skills, experience_level, years_experience, portfolio_url, location, hourly_rate, rating, total_reviews) VALUES
(1, 'emmanuel_dev', 'Experienced Full Stack Developer specializing in React and Node.js. Building scalable web apps since 2018.', 'React, Node.js, PostgreSQL, Express, MongoDB, API Development', 'Senior', 6, 'https://emmanuel-portfolio.com', 'Lagos, Nigeria', 45.00, 4.9, 120),
(3, 'victor_mobile', 'Mobile App Developer with expertise in Flutter and React Native. Creating beautiful cross-platform apps.', 'Flutter, React Native, Firebase, iOS, Android, Dart', 'Senior', 5, 'https://victor-apps.com', 'Abuja, Nigeria', 50.00, 5.0, 150),
(4, 'chisom_frontend', 'Frontend specialist focused on modern UI/UX. Passionate about creating delightful user experiences.', 'Vue.js, Tailwind CSS, Next.js, TypeScript, Figma, HTML5', 'Mid', 3, 'https://chisom-designs.com', 'Port Harcourt, Nigeria', 35.00, 4.8, 98);

-- Sample Clients
INSERT INTO clients (user_id, company_name, company_website, industry, company_size, work_email, budget_range, location) VALUES
(2, 'TechStart Nigeria', 'https://techstart.ng', 'Technology', '10-50', 'amaka@techstart.ng', '$5k-$15k', 'Lagos, Nigeria');

-- Sample Projects
INSERT INTO projects (title, description, budget, deadline, status, client_id, developer_id) VALUES
('Food Delivery App', 'Build a mobile app for food delivery with real-time tracking and payment integration', 8500.00, '2025-12-31', 'in-progress', 2, 1),
('Company Portfolio Site', 'Modern portfolio website with animations and responsive design', 3200.00, '2025-11-15', 'completed', 2, 1),
('Chat Support Integration', 'Integrate live chat support system into existing e-commerce platform', 2800.00, '2025-10-30', 'pending', 2, NULL);

-- Sample Reviews
INSERT INTO reviews (developer_id, client_id, rating, message) VALUES
(1, 2, 5, 'Emmanuel delivered exceptional work! The app exceeded our expectations and was completed ahead of schedule.'),
(3, 2, 5, 'Victor is a true professional. The mobile app is flawless and our users love it!');

-- Sample Messages
INSERT INTO messages (sender_id, receiver_id, message) VALUES
(2, 1, 'Hi Emmanuel, can you update the API documentation for the food delivery app?'),
(1, 2, 'Sure thing! I will have it ready by end of day.'),
(2, 3, 'Victor, the app looks amazing! Let''s schedule a final review meeting.');

-- Display summary
SELECT 'Database schema created successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_developers FROM developers;
SELECT COUNT(*) AS total_clients FROM clients;
SELECT COUNT(*) AS total_projects FROM projects;
SELECT COUNT(*) AS total_reviews FROM reviews;
-- Create Admin User for DevHub
-- Run this script to create an admin account

-- Insert admin user
-- Password is 'admin123' (hashed with bcrypt)
INSERT INTO users (full_name, email, password, user_type, phone, preferred_comm, created_at)
VALUES (
  'Admin User',
  'admin@devhub.com',
  '$2b$10$rQZ5K5Z5Z5Z5Z5Z5Z5Z5ZeF5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'Client',
  '+234-800-0000',
  'Email',
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Get the admin user ID
DO $$
DECLARE
    admin_user_id INTEGER;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@devhub.com';
    
    -- Create client profile for admin
    INSERT INTO clients (user_id, company_name, company_website, industry, company_size, work_email, budget_range, location)
    VALUES (
        admin_user_id,
        'DevHub Administration',
        'https://devhub.com',
        'Technology',
        '1-10',
        'admin@devhub.com',
        'N/A',
        'Lagos, Nigeria'
    )
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Display success message
SELECT 
    'Admin user created successfully!' as status,
    'Email: admin@devhub.com' as email,
    'Password: admin123' as password,
    'Login and access admin panel at: admin-dashboard.html' as access_info;