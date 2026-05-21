export type Id<T extends string> = string & { _table: T }

export interface SupabaseUser {
  id: Id<'users'>
  email: string
  role: 'pending' | 'volunteer' | 'counselor' | 'program_lead' | 'executive_director'
  isActive: boolean
  createdAt: string
}

export interface Incident {
  id: Id<'incidents'>
  incidentType: string
  location: string
  status: string
  survivorAge?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ReferralService {
  id: Id<'referralServices'>
  name: string
  category: string
  county: string
  status: 'Active' | 'Inactive'
  contact?: string
  createdAt: string
}
