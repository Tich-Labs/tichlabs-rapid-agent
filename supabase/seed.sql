-- Tich Labs Incident Tracker - Seed Data (from GBV REFERRAL PATHWAY.docx)
-- Run after schema.sql

-- Kakamega County - Health Facilities
INSERT INTO referral_services (name, category, county, description, phone, address, is_active) VALUES
('Kakamega County Referral Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 001', 'Kakamega Town', true),
('Mumias Level 4 Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 002', 'Mumias Town', true),
('Butere Sub-County Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 003', 'Butere', true),
('Malava Sub-County Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 004', 'Malava', true),
('Matungu Sub-County Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 005', 'Matungu', true),
('Likuyani Sub-County Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 006', 'Likuyani', true),
('Shinyalu Sub-County Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 007', 'Shinyalu', true),
('Igukhu Sub-County Hospital', 'health', 'kakamega', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 008', 'Igukhu', true),

-- Vihiga County - Health Facilities
('Vihiga County Referral Hospital', 'health', 'vihiga', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 009', 'Vihiga Town', true),
('Sabatia Sub-County Hospital', 'health', 'vihiga', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 010', 'Sabatia', true),
('Emuhaya Sub-County Hospital', 'health', 'vihiga', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 011', 'Emuhaya', true),
('Hamisi Sub-County Hospital', 'health', 'vihiga', 'Clinical management, treatment of injuries, HIV PEP, and medical evidence collection', '0700 000 012', 'Hamisi', true),
('Coptic Nursing Home', 'health', 'vihiga', 'Clinical management and treatment of injuries', '0700 000 013', 'Vihiga Town', true),

-- Police Stations - Kakamega
('Kakamega Central Police Station', 'police', 'kakamega', 'Record case, fill P3 form, conduct investigations', '0700 000 014', 'Kakamega Town', true),
('Mumias Police Station', 'police', 'kakamega', 'Record case, fill P3 form, conduct investigations', '0700 000 015', 'Mumias Town', true),
('Butere Police Station', 'police', 'kakamega', 'Record case, fill P3 form, conduct investigations', '0700 000 016', 'Butere', true),
('Malava Police Station', 'police', 'kakamega', 'Record case, fill P3 form, conduct investigations', '0700 000 017', 'Malava', true),
('Matungu Police Station', 'police', 'kakamega', 'Record case, fill P3 form, conduct investigations', '0700 000 018', 'Matungu', true),

-- Police Stations - Vihiga
('Vihiga Police Station', 'police', 'vihiga', 'Record case, fill P3 form, conduct investigations', '0700 000 019', 'Vihiga Town', true),
('Hamisi Police Station', 'police', 'vihiga', 'Record case, fill P3 form, conduct investigations', '0700 000 020', 'Hamisi', true),
('Sabatia Police Station', 'police', 'vihiga', 'Record case, fill P3 form, conduct investigations', '0700 000 021', 'Sabatia', true),

-- Rescue & Shelter - Kakamega
('Kakamega GBV Rescue Centre', 'shelter', 'kakamega', 'Emergency shelter, safety planning, basic needs', '0700 000 022', 'Kakamega Town', true),
('Mumias Safe House', 'shelter', 'kakamega', 'Temporary shelter and psychosocial support', '0700 000 023', 'Mumias Town', true),

-- Rescue & Shelter - Vihiga
('Vihiga GBV Rescue Centre', 'shelter', 'vihiga', 'Emergency shelter, safety planning, basic needs', '0700 000 024', 'Vihiga Town', true),

-- Counselling / Psychosocial - Kakamega
('Kakamega County Referral Hospital — Counselling', 'psychosocial', 'kakamega', 'Professional counselling and psychosocial support', '0700 000 025', 'Kakamega Town', true),
('Mumias Level 4 — Counselling', 'psychosocial', 'kakamega', 'Professional counselling and psychosocial support', '0700 000 026', 'Mumias Town', true),
('Butere Sub-County Hospital — Counselling', 'psychosocial', 'kakamega', 'Professional counselling and psychosocial support', '0700 000 027', 'Butere', true),

-- Counselling / Psychosocial - Vihiga
('Vihiga County Referral Hospital — Counselling', 'psychosocial', 'vihiga', 'Professional counselling and psychosocial support', '0700 000 028', 'Vihiga Town', true),
('Sabatia Sub-County Hospital — Counselling', 'psychosocial', 'vihiga', 'Professional counselling and psychosocial support', '0700 000 029', 'Sabatia', true),

-- Legal Services (National)
('FIDA Kenya', 'legal', 'kakamega', 'Legal aid, representation, and advocacy for women', '0707 554 806', 'Nairobi (serves Kakamega)', true),
('FIDA Kenya — Vihiga', 'legal', 'vihiga', 'Legal aid, representation, and advocacy for women', '0707 554 806', 'Nairobi (serves Vihiga)', true),
('COVAW (Coalition on Violence Against Women)', 'legal', 'kakamega', 'Legal support and justice advocacy', '0800 720 553', 'Nairobi (serves Kakamega)', true),
('COVAW — Vihiga', 'legal', 'vihiga', 'Legal support and justice advocacy', '0800 720 553', 'Nairobi (serves Vihiga)', true),
('Kakamega Law Courts — GBV Unit', 'legal', 'kakamega', 'Legal proceedings and protection orders', '0700 000 030', 'Kakamega Town', true),
('Vihiga Law Courts — GBV Unit', 'legal', 'vihiga', 'Legal proceedings and protection orders', '0700 000 031', 'Vihiga Town', true);

-- Sample admin user (password: admin123)
-- Note: In production, use Supabase Auth UI for user management
INSERT INTO users (email, role, name, is_active) VALUES
('admin@tichlabs.com', 'executive_director', 'Executive Director', true),
('counselor@tichlabs.com', 'counselor', 'Jane Counselor', true),
('volunteer@tichlabs.com', 'volunteer', 'John Volunteer', true);
