-- Tich Labs Incident Tracker - Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('pending', 'volunteer', 'counselor', 'program_lead', 'executive_director')),
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _creation_time BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  incident_type TEXT NOT NULL,
  incident_date TEXT NOT NULL,
  incident_time TEXT,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'pfa_in_progress', 'under_review', 'escalated', 'resolved', 'closed')),
  is_escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  reporter_type TEXT NOT NULL DEFAULT 'self' CHECK (reporter_type IN ('self', 'on_behalf', 'volunteer')),
  volunteer_id TEXT,
  survivor_age_group TEXT,
  survivor_gender TEXT,
  submitter_contact TEXT,
  submitted_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  offline_id TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Referral services table
CREATE TABLE IF NOT EXISTS referral_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _creation_time BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('health', 'police', 'shelter', 'psychosocial', 'legal')),
  county TEXT NOT NULL CHECK (county IN ('kakamega', 'vihiga')),
  description TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),
  performed_by_name TEXT,
  previous_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Offline submissions table
CREATE TABLE IF NOT EXISTS offline_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_data JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI recommendations table (for tracking approved/rejected)
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  service_id UUID REFERENCES referral_services(id) ON DELETE CASCADE,
  relevance_score INTEGER NOT NULL DEFAULT 0,
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(incident_id, service_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_category ON referral_services(category);
CREATE INDEX IF NOT EXISTS idx_services_county ON referral_services(county);
CREATE INDEX IF NOT EXISTS idx_audit_incident ON audit_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_incident ON ai_recommendations(incident_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can read all users" ON users
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('counselor', 'program_lead', 'executive_director')
  );

-- RLS Policies for incidents
CREATE POLICY "Anyone can create incidents" ON incidents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read own submitted incident" ON incidents
  FOR SELECT USING (submitted_by IS NULL OR submitted_by = auth.uid());

CREATE POLICY "Staff can read all incidents" ON incidents
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('volunteer', 'counselor', 'program_lead', 'executive_director')
  );

CREATE POLICY "Staff can update incidents" ON incidents
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('counselor', 'program_lead', 'executive_director')
  );

-- RLS Policies for referral services
CREATE POLICY "Anyone can read services" ON referral_services
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage services" ON referral_services
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('program_lead', 'executive_director')
  );
