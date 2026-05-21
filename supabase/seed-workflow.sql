-- ============================================================
-- Workflow Demo Seed — Users + Incidents at Every Stage
-- Run AFTER schema.sql and seed.sql
-- ============================================================

-- 1. Users for each role
-- NOTE: To use these with real auth, create matching Supabase Auth users
-- with the SAME UUIDs below via the Supabase Dashboard > Authentication > Users > Add User
-- The app also falls back to a hardcoded demo@tichlabs.com admin if no auth session exists.

INSERT INTO users (id, email, role, name, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'volunteer@demo.ke',  'volunteer',          'Alice Volunteer',  true),
  ('a0000000-0000-0000-0000-000000000002', 'counselor@demo.ke',  'counselor',          'Brian Counselor',  true),
  ('a0000000-0000-0000-0000-000000000003', 'programlead@demo.ke','program_lead',       'Carol Lead',       true),
  ('a0000000-0000-0000-0000-000000000004', 'director@demo.ke',   'executive_director', 'Daniel Director',  true)
ON CONFLICT (id) DO NOTHING;

-- 2. Incidents — one at each workflow stage
-- Stage: new (Logged)
INSERT INTO incidents (incident_type, incident_date, incident_time, location, description, status, reporter_type, survivor_age_group, survivor_gender, submitted_by, created_at, updated_at)
VALUES ('missing_child', '2026-05-10', '14:30', 'Kakamega Town', 'Child went missing after school. Last seen near the market area wearing blue uniform. Community search underway.', 'new', 'self', '10_14', 'female', 'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');

-- Stage: assigned
INSERT INTO incidents (incident_type, incident_date, incident_time, location, description, status, reporter_type, survivor_age_group, survivor_gender, submitted_by, assigned_to, created_at, updated_at)
VALUES ('physical_abuse', '2026-05-11', '09:15', 'Mumias', 'Survivor reports being beaten by guardian. Visible bruises on arms and back. Neighbor intervened and brought survivor to the center.', 'assigned', 'on_behalf', '15_18', 'female', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Stage: pfa_in_progress
INSERT INTO incidents (incident_type, incident_date, incident_time, location, description, status, reporter_type, survivor_age_group, survivor_gender, submitted_by, assigned_to, created_at, updated_at)
VALUES ('sexual_abuse', '2026-05-12', '20:00', 'Vihiga Town', 'Survivor reports sexual assault by known person. Incident occurred evening of May 12. Survivor is in distress. Referred to Vihiga County Referral Hospital for medical exam and PEP.', 'pfa_in_progress', 'self', '18_22', 'female', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

-- Stage: under_review
INSERT INTO incidents (incident_type, incident_date, incident_time, location, description, status, reporter_type, survivor_age_group, survivor_gender, submitted_by, assigned_to, created_at, updated_at)
VALUES ('domestic_violence', '2026-05-08', '22:30', 'Butere', 'Survivor physically attacked by partner. Needed medical treatment at Butere Sub-County Hospital. Shelter referral requested. Perpetrator arrested.', 'under_review', 'volunteer', '28_35', 'female', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days');

-- Stage: escalated
INSERT INTO incidents (incident_type, incident_date, incident_time, location, description, status, is_escalated, escalated_at, reporter_type, survivor_age_group, survivor_gender, submitted_by, assigned_to, created_at, updated_at)
VALUES ('child_exploitation', '2026-05-05', '16:00', 'Hamisi', 'Minor (age 12) involved in exploitative labor. Mandatory reporting triggered. Children officer notified. Police case opened. Requires executive oversight.', 'under_review', true, NOW() - INTERVAL '3 days', 'on_behalf', 'under_10', 'male', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days');

-- Stage: resolved
INSERT INTO incidents (incident_type, incident_date, incident_time, location, description, status, reporter_type, survivor_age_group, survivor_gender, submitted_by, assigned_to, resolved_at, created_at, updated_at)
VALUES ('emotional_abuse', '2026-05-01', '11:00', 'Shinyalu', 'Survivor experienced repeated emotional abuse and threats from family member. Psychosocial counseling provided. Safety plan in place. Case resolved after follow-up.', 'resolved', 'self', '15_18', 'female', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days');

-- Stage: closed
INSERT INTO incidents (incident_type, incident_date, incident_time, location, description, status, reporter_type, survivor_age_group, survivor_gender, submitted_by, assigned_to, resolved_at, created_at, updated_at)
VALUES ('bullying_harassment', '2026-04-20', '08:00', 'Kakamega Town', 'Student experienced persistent bullying at school. School administration involved. Counseling sessions completed. Perpetrator disciplined. Case closed.', 'closed', 'on_behalf', '10_14', 'male', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days');

-- 3. Audit log entries for workflow history
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'created', submitted_by, 'Alice Volunteer', NULL, 'new', created_at
FROM incidents;

-- For the assigned incident
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'new', 'assigned', created_at + INTERVAL '1 hour'
FROM incidents WHERE status = 'assigned';

-- For pfa_in_progress — full timeline
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'new', 'assigned', created_at + INTERVAL '30 minutes'
FROM incidents WHERE status = 'pfa_in_progress';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000002', 'Brian Counselor', 'assigned', 'pfa_in_progress', created_at + INTERVAL '1 day'
FROM incidents WHERE status = 'pfa_in_progress';

-- For under_review
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'new', 'assigned', created_at + INTERVAL '1 hour'
FROM incidents WHERE status = 'under_review';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000002', 'Brian Counselor', 'assigned', 'pfa_in_progress', created_at + INTERVAL '1 day'
FROM incidents WHERE status = 'under_review';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'pfa_in_progress', 'under_review', created_at + INTERVAL '2 days'
FROM incidents WHERE status = 'under_review';

-- For escalated
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'new', 'assigned', created_at + INTERVAL '1 hour'
FROM incidents WHERE is_escalated = true;
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000002', 'Brian Counselor', 'assigned', 'pfa_in_progress', created_at + INTERVAL '1 day'
FROM incidents WHERE is_escalated = true;
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'escalated', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', NULL, 'escalated', created_at + INTERVAL '5 days'
FROM incidents WHERE is_escalated = true;
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000004', 'Daniel Director', 'pfa_in_progress', 'under_review', created_at + INTERVAL '6 days'
FROM incidents WHERE is_escalated = true;

-- For resolved
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'new', 'assigned', created_at + INTERVAL '2 hours'
FROM incidents WHERE status = 'resolved';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000002', 'Brian Counselor', 'assigned', 'pfa_in_progress', created_at + INTERVAL '1 day'
FROM incidents WHERE status = 'resolved';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000002', 'Brian Counselor', 'pfa_in_progress', 'resolved', created_at + INTERVAL '8 days'
FROM incidents WHERE status = 'resolved';

-- For closed
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'new', 'assigned', created_at + INTERVAL '1 hour'
FROM incidents WHERE status = 'closed';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000002', 'Brian Counselor', 'assigned', 'pfa_in_progress', created_at + INTERVAL '1 day'
FROM incidents WHERE status = 'closed';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000002', 'Brian Counselor', 'pfa_in_progress', 'resolved', created_at + INTERVAL '5 days'
FROM incidents WHERE status = 'closed';
INSERT INTO audit_log (incident_id, action, performed_by, performed_by_name, previous_value, new_value, timestamp)
SELECT id, 'status_change', 'a0000000-0000-0000-0000-000000000003', 'Carol Lead', 'resolved', 'closed', created_at + INTERVAL '10 days'
FROM incidents WHERE status = 'closed';
