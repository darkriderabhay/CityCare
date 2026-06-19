-- ============================================
-- CityCare Database Schema
-- Online Civic Issue Reporting System
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS citycare_db;
USE citycare_db;

-- ============================================
-- Table 1: departments
-- ============================================
CREATE TABLE departments (
    dept_id INT PRIMARY KEY AUTO_INCREMENT,
    dept_name VARCHAR(100) NOT NULL UNIQUE,
    dept_email VARCHAR(100),
    dept_phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table 2: users
-- ============================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    role ENUM('citizen', 'admin') DEFAULT 'citizen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table 3: complaints
-- ============================================
CREATE TABLE complaints (
    complaint_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    dept_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_path VARCHAR(255),
    status ENUM('pending', 'assigned', 'in-progress', 'resolved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL
);

-- ============================================
-- Table 4: complaint_status_logs
-- ============================================
CREATE TABLE complaint_status_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    remarks TEXT,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================
-- Insert Sample Departments
-- ============================================
INSERT INTO departments (dept_name, dept_email, dept_phone) VALUES
('Roads and Transport', 'roads@citycare.gov.in', '1800-111-001'),
('Water Supply', 'water@citycare.gov.in', '1800-111-002'),
('Electricity', 'electricity@citycare.gov.in', '1800-111-003'),
('Sanitation', 'sanitation@citycare.gov.in', '1800-111-004'),
('Street Lights', 'lights@citycare.gov.in', '1800-111-005'),
('Parks and Gardens', 'parks@citycare.gov.in', '1800-111-006');

-- ============================================
-- Insert Sample Users
-- Password: 'password123' (hashed using bcrypt)
-- Note: In real application, passwords will be hashed by backend
-- ============================================
INSERT INTO users (full_name, email, password, phone, address, role) VALUES
('Rahul Kumar', 'rahul@example.com', '$2a$10$XqZ9Z9Z9Z9Z9Z9Z9Z9Z9ZuK', '9876543210', 'MG Road, Delhi', 'citizen'),
('Priya Sharma', 'priya@example.com', '$2a$10$XqZ9Z9Z9Z9Z9Z9Z9Z9Z9ZuK', '9876543211', 'CP, Delhi', 'citizen'),
('Admin User', 'admin@citycare.gov.in', '$2a$10$XqZ9Z9Z9Z9Z9Z9Z9Z9Z9ZuK', '9876543212', 'City Hall, Delhi', 'admin');

-- ============================================
-- Insert Sample Complaints
-- ============================================
INSERT INTO complaints (user_id, dept_id, title, description, location, status, priority) VALUES
(1, 1, 'Pothole on Main Road', 'Large pothole causing accidents near market area', 'Connaught Place, Delhi', 'pending', 'high'),
(2, 2, 'Water Supply Issue', 'No water supply for last 3 days in our locality', 'Karol Bagh, Delhi', 'pending', 'high'),
(1, 4, 'Garbage Not Collected', 'Garbage has not been collected for a week', 'Lajpat Nagar, Delhi', 'assigned', 'medium'),
(2, 5, 'Street Light Not Working', 'Street light broken for 2 weeks, area is dark at night', 'Rohini Sector 10, Delhi', 'in-progress', 'medium');

-- ============================================
-- Insert Sample Status Logs
-- ============================================
INSERT INTO complaint_status_logs (complaint_id, old_status, new_status, remarks, changed_by) VALUES
(3, 'pending', 'assigned', 'Assigned to Sanitation Department Team A', 3),
(4, 'pending', 'assigned', 'Assigned to Electrician Team', 3),
(4, 'assigned', 'in-progress', 'Technician dispatched to location', 3);

-- ============================================
-- Verify Data
-- ============================================
SELECT 'Database created successfully!' AS Status;
SELECT COUNT(*) AS Total_Departments FROM departments;
SELECT COUNT(*) AS Total_Users FROM users;
SELECT COUNT(*) AS Total_Complaints FROM complaints;