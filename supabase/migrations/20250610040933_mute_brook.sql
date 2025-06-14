-- Event Management Database Schema for MySQL
CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

-- Events table
CREATE TABLE IF NOT EXISTS events (
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
    ticket_design_size INT,
    ticket_design_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_type (type),
    INDEX idx_start_time (start_time)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    barcode_url VARCHAR(255),
    qr_code_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_event_id (event_id),
    INDEX idx_is_verified (is_verified)
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(255),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_email (email),
    INDEX idx_registered_at (registered_at)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    template_id INT,
    path VARCHAR(255),
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_participant_id (participant_id),
    INDEX idx_sent (sent)
);

-- Certificate templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    template_path VARCHAR(255) NOT NULL,
    template_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id)
);

-- File uploads table for tracking all uploaded files
CREATE TABLE IF NOT EXISTS file_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    upload_type ENUM('ticket_design', 'certificate_template', 'other') NOT NULL,
    related_id INT, -- Can reference event_id, template_id, etc.
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_upload_type (upload_type),
    INDEX idx_related_id (related_id),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Insert sample events
INSERT IGNORE INTO events (id, name, slug, type, location, description, start_time, end_time, quota) VALUES
(1, 'Artificial Intelligence Seminar 2025', 'ai-seminar-2025', 'Seminar', 'Grand Hall A - Tech Center', 'Comprehensive introduction to Artificial Intelligence, Machine Learning, and Deep Learning technologies. Learn from industry experts about the latest trends and applications in AI.', '2025-06-15 09:00:00', '2025-06-15 17:00:00', 50),
(2, 'Full-Stack Web Development Workshop', 'fullstack-web-dev-workshop', 'Workshop', 'Computer Lab B - Innovation Hub', 'Intensive 3-day hands-on workshop covering modern web development technologies including React, Node.js, databases, and deployment strategies.', '2025-07-20 10:00:00', '2025-07-22 16:00:00', 30),
(3, 'Digital Marketing Strategies Seminar', 'digital-marketing-seminar', 'Seminar', 'Conference Room C - Business Center', 'Learn effective digital marketing strategies, social media marketing, SEO, and content marketing from successful practitioners.', '2025-08-10 13:00:00', '2025-08-10 18:00:00', 75),
(4, 'Mobile App Development Workshop', 'mobile-app-dev-workshop', 'Workshop', 'Tech Lab D - Development Center', 'Build your first mobile application using React Native. Cover both iOS and Android development in this comprehensive workshop.', '2025-09-05 09:00:00', '2025-09-07 17:00:00', 25);

-- Generate sample tickets for each event
-- AI Seminar (50 tickets)
INSERT IGNORE INTO tickets (id, event_id, token, qr_code_url, is_verified) VALUES
(1, 1, 'AI2025001ABC', '/tickets/qr_AI2025001ABC.png', FALSE),
(2, 1, 'AI2025002DEF', '/tickets/qr_AI2025002DEF.png', FALSE),
(3, 1, 'AI2025003GHI', '/tickets/qr_AI2025003GHI.png', TRUE),
(4, 1, 'AI2025004JKL', '/tickets/qr_AI2025004JKL.png', TRUE),
(5, 1, 'AI2025005MNO', '/tickets/qr_AI2025005MNO.png', FALSE);

-- Web Dev Workshop (30 tickets)
INSERT IGNORE INTO tickets (id, event_id, token, qr_code_url, is_verified) VALUES
(6, 2, 'WEB2025001PQR', '/tickets/qr_WEB2025001PQR.png', TRUE),
(7, 2, 'WEB2025002STU', '/tickets/qr_WEB2025002STU.png', FALSE),
(8, 2, 'WEB2025003VWX', '/tickets/qr_WEB2025003VWX.png', TRUE),
(9, 2, 'WEB2025004YZA', '/tickets/qr_WEB2025004YZA.png', FALSE);

-- Digital Marketing Seminar (75 tickets)
INSERT IGNORE INTO tickets (id, event_id, token, qr_code_url, is_verified) VALUES
(10, 3, 'DM2025001BCD', '/tickets/qr_DM2025001BCD.png', FALSE),
(11, 3, 'DM2025002EFG', '/tickets/qr_DM2025002EFG.png', TRUE),
(12, 3, 'DM2025003HIJ', '/tickets/qr_DM2025003HIJ.png', FALSE);

-- Mobile App Workshop (25 tickets)
INSERT IGNORE INTO tickets (id, event_id, token, qr_code_url, is_verified) VALUES
(13, 4, 'MOB2025001KLM', '/tickets/qr_MOB2025001KLM.png', FALSE),
(14, 4, 'MOB2025002NOP', '/tickets/qr_MOB2025002NOP.png', TRUE);

-- Insert sample participants
INSERT IGNORE INTO participants (id, ticket_id, name, email, phone, organization, registered_at) VALUES
(1, 3, 'John Smith', 'john.smith@email.com', '+62812345678', 'Tech Innovations Inc.', '2025-06-01 10:30:00'),
(2, 4, 'Sarah Johnson', 'sarah.johnson@email.com', '+62823456789', 'Digital Solutions Ltd.', '2025-06-02 14:15:00'),
(3, 6, 'Michael Chen', 'michael.chen@email.com', '+62834567890', 'StartupHub', '2025-06-03 09:45:00'),
(4, 8, 'Emily Davis', 'emily.davis@email.com', '+62845678901', 'WebCraft Agency', '2025-06-04 16:20:00'),
(5, 11, 'David Wilson', 'david.wilson@email.com', '+62856789012', 'Marketing Pro', '2025-06-05 11:10:00'),
(6, 14, 'Lisa Anderson', 'lisa.anderson@email.com', '+62867890123', 'Mobile First Co.', '2025-06-06 13:30:00');

-- Insert sample certificates
INSERT IGNORE INTO certificates (id, participant_id, path, sent) VALUES
(1, 1, '/certificates/cert_john_smith_ai_seminar.pdf', TRUE),
(2, 2, '/certificates/cert_sarah_johnson_ai_seminar.pdf', FALSE),
(3, 3, '/certificates/cert_michael_chen_web_workshop.pdf', TRUE),
(4, 5, '/certificates/cert_david_wilson_marketing_seminar.pdf', FALSE);

-- Insert sample certificate templates
INSERT IGNORE INTO certificate_templates (id, event_id, template_path, template_fields) VALUES
(1, 1, '/templates/ai_seminar_certificate.html', '{"participant_name": "text", "event_name": "text", "date": "date", "signature": "image"}'),
(2, 2, '/templates/web_workshop_certificate.html', '{"participant_name": "text", "event_name": "text", "completion_date": "date", "hours": "number"}'),
(3, 3, '/templates/marketing_seminar_certificate.html', '{"participant_name": "text", "event_name": "text", "date": "date", "instructor": "text"}'),
(4, 4, '/templates/mobile_workshop_certificate.html', '{"participant_name": "text", "event_name": "text", "completion_date": "date", "project_completed": "text"}');

-- Insert sample file uploads tracking
INSERT IGNORE INTO file_uploads (id, filename, original_name, file_path, file_size, file_type, upload_type, related_id) VALUES
(1, 'ticket-ai-seminar-design.png', 'ai_seminar_ticket_design.png', '/uploads/ticket-ai-seminar-design.png', 245760, 'image/png', 'ticket_design', 1),
(2, 'ticket-web-workshop-design.jpg', 'web_workshop_ticket.jpg', '/uploads/ticket-web-workshop-design.jpg', 189440, 'image/jpeg', 'ticket_design', 2),
(3, 'certificate-template-ai.html', 'ai_certificate_template.html', '/templates/ai_seminar_certificate.html', 5120, 'text/html', 'certificate_template', 1),
(4, 'certificate-template-web.html', 'web_certificate_template.html', '/templates/web_workshop_certificate.html', 4896, 'text/html', 'certificate_template', 2);

-- Create views for easier data access
CREATE OR REPLACE VIEW event_statistics AS
SELECT 
    e.id,
    e.name,
    e.slug,
    e.type,
    e.location,
    e.start_time,
    e.end_time,
    e.quota,
    COUNT(t.id) as total_tickets,
    COUNT(CASE WHEN t.is_verified = TRUE THEN 1 END) as verified_tickets,
    COUNT(CASE WHEN t.is_verified = FALSE THEN 1 END) as available_tickets,
    ROUND((COUNT(CASE WHEN t.is_verified = TRUE THEN 1 END) / COUNT(t.id)) * 100, 2) as registration_percentage
FROM events e
LEFT JOIN tickets t ON e.id = t.event_id
GROUP BY e.id, e.name, e.slug, e.type, e.location, e.start_time, e.end_time, e.quota;

CREATE OR REPLACE VIEW participant_details AS
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    p.organization,
    p.registered_at,
    t.token,
    t.is_verified,
    e.name as event_name,
    e.type as event_type,
    e.start_time as event_start_time
FROM participants p
JOIN tickets t ON p.ticket_id = t.id
JOIN events e ON t.event_id = e.id;