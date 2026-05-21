import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://fytspbolszccphbdmyzi.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHNwYm9sc3pjY3BoYmRteXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDE5NzYsImV4cCI6MjA5MzkxNzk3Nn0.EW7rWSrB_mPy-Jhp_jWK_dmZHUd6iR63mgrVEg79qeM";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetch.bind(globalThis) },
});

export interface Incident {
  _id: string;
  _creationTime: number;
  description: string;
  incidentDate: string;
  incidentTime?: string;
  incidentType: string;
  isEscalated: boolean;
  location: string;
  notes?: string;
  status: string;
  survivorAgeGroup: string;
  survivorGender: string;
  submitterContact?: string;
}

export interface ReferralService {
  _id: string;
  name: string;
  category: string;
  county: string;
  description?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export async function getIncident(id: string): Promise<Incident | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as Incident;
}

export async function getActiveServices(): Promise<ReferralService[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("referral_services")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) return [];
  return data as unknown as ReferralService[];
}

export async function listIncidents(): Promise<Incident[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as unknown as Incident[];
}
