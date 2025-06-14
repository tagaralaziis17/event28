-- Event Management Database Schema
CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

-- Events table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type ENUM('Seminar', 'Workshop') NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    quota INT DEFAULT 0,
    ticket_design VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    barcode_url VARCHAR(255),
    qr_code_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Participants table
CREATE TABLE participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(255),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Certificates table
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    template_id INT,
    path VARCHAR(255),
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Certificate templates table
CREATE TABLE certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    template_path VARCHAR(255) NOT NULL,
    template_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO events (name, slug, type, location, description, start_time, end_time, quota) VALUES
('AI Seminar', 'ai-seminar', 'Seminar', 'Hall A', 'Introduction to Artificial Intelligence and Machine Learning', '2025-06-15 09:00:00', '2025-06-15 17:00:00', 3),
('Web Development Workshop', 'web-dev-workshop', 'Workshop', 'Lab B', 'Hands-on workshop on modern web development technologies', '2025-07-20 10:00:00', '2025-07-22 16:00:00', 5);

-- Insert sample tickets
INSERT INTO tickets (event_id, token, barcode_url, qr_code_url, is_verified) VALUES
(1, 'ABC123XYZ', '/tickets/barcode_ABC123XYZ.png', '/tickets/qr_ABC123XYZ.png', FALSE),
(1, 'DEF456LMN', '/tickets/barcode_DEF456LMN.png', '/tickets/qr_DEF456LMN.png', FALSE),
(1, 'GHI789QRS', '/tickets/barcode_GHI789QRS.png', '/tickets/qr_GHI789QRS.png', FALSE),
(2, 'JKL012TUV', '/tickets/barcode_JKL012TUV.png', '/tickets/qr_JKL012TUV.png', FALSE),
(2, 'MNO345WXY', '/tickets/barcode_MNO345WXY.png', '/tickets/qr_MNO345WXY.png', FALSE);

-- Insert sample participant
INSERT INTO participants (ticket_id, name, email, phone, organization, registered_at) VALUES
(1, 'John Smith', 'john@example.com', '08123456789', 'Company A', '2025-06-01 10:00:00');

-- Update ticket verification status
UPDATE tickets SET is_verified = TRUE WHERE id = 1;

-- Insert sample certificate
INSERT INTO certificates (participant_id, path, sent) VALUES
(1, '/certificates/cert_john.pdf', TRUE);