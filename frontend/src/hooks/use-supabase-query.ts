import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { snakeToCamel } from '@/lib/supabase-utils'

// Hook for querying Supabase data
export function useSupabaseQuery<T>(queryFn?: () => Promise<T>) {
  return useQuery({
    queryKey: ['supabase', queryFn?.toString() ?? 'noop'],
    queryFn: queryFn ?? (async () => null as unknown as T),
    enabled: !!queryFn,
  })
}

export function useSupabaseQueryCamel<T>(queryFn: () => Promise<any>) {
  return useQuery({
    queryKey: ['supabase', queryFn.toString()],
    queryFn: async () => {
      const data = await queryFn()
      return snakeToCamel<T>(data)
    },
  })
}

// Hook for mutating Supabase data
export function useSupabaseMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: { onSuccess?: () => void }
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase'] })
      options?.onSuccess?.()
    },
  })
}

// Common query factories
export const supabaseQueries = {
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { id: 'demo-user', name: 'Demo Admin', email: 'demo@tichlabs.com', role: 'executive_director', isActive: true }
    }
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    return data
  },
  
  listUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  
  listServices: async () => {
    const { data, error } = await supabase
      .from('referral_services')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return data
  },
  
  listIncidents: async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getDashboardStats: async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('status')
    if (error || !data) return { total: 0, new: 0, inProgress: 0, escalated: 0, resolved: 0 }
    const total = data.length
    const newCount = data.filter(i => i.status === 'new').length
    const inProgress = data.filter(i => ['assigned', 'pfa_in_progress', 'under_review'].includes(i.status)).length
    const escalated = data.filter(i => i.status === 'escalated').length
    const resolved = data.filter(i => ['resolved', 'closed'].includes(i.status)).length
    return { total, new: newCount, inProgress, escalated, resolved }
  },

  getEscalatedIncidents: async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('status', 'escalated')
      .order('created_at', { ascending: false })
      .limit(5)
    if (error || !data) return []
    return data
  },

  getNewIncidents: async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5)
    if (error || !data) return []
    return data
  },
}

// Temp stubs for Convex migration remnants
export class ConvexError extends Error {
  constructor(message: string) { super(message); this.name = 'ConvexError'; }
}
export function usePaginatedQuery(name: any, args?: any, opts?: any) {
  return { results: [], status: 'success', loadMore: () => {} };
}

// Common mutation factories
export const supabaseMutations = {
  createService: async (service: any) => {
    const { data, error } = await supabase
      .from('referralServices')
      .insert(service)
      .select()
      .single()
    if (error) throw error
    return data
  },
  
  updateService: async ({ id, ...updates }: any) => {
    const { data, error } = await supabase
      .from('referralServices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  
  deleteService: async (id: string) => {
    const { error } = await supabase
      .from('referralServices')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
  
  updateUserRole: async ({ userId, role }: { userId: string; role: string }) => {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },
  
  toggleUserActive: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
    const { data, error } = await supabase
      .from('users')
      .update({ isActive })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
