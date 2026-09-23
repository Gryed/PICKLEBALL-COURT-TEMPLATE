import { supabase } from '../lib/supabase'
import type { Court, Settings } from '../types/court'

export async function getCourts(): Promise<Court[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Court[]
}


export async function getPublicCourts(
  organizationSlug: string
): Promise<Court[]> {
  const { data, error } = await supabase.rpc('get_public_courts', {
    p_organization_slug: organizationSlug,
  })

  if (error) throw error
  return (data ?? []) as Court[]
}

export async function getPublicBookingSettings(courtId: string): Promise<Settings> {
  const { data, error } = await supabase.rpc('get_public_booking_settings', {
    p_court_id: courtId,
  })

  if (error) throw error
  const row = data?.[0]
  if (!row) throw new Error('Booking settings are not available for this court.')

  return { id: 1, ...row } as Settings
}

export async function createCourt(court: Omit<Court, 'id' | 'created_at'>): Promise<Court> {
  const { data, error } = await supabase
    .from('courts')
    .insert(court)
    .select()
    .single()

  if (error) throw error
  return data as Court
}

export async function updateCourt(id: string, updates: Partial<Omit<Court, 'id' | 'created_at'>>): Promise<Court> {
  const { data, error } = await supabase
    .from('courts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Court
}

export async function deleteCourt(id: string): Promise<void> {
  const { error } = await supabase
    .from('courts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

async function getMyOrganizationId(): Promise<string> {
  const { data, error } = await supabase.rpc('get_my_organization_context')
  if (error) throw error
  if (!data?.length) throw new Error('No active organization is assigned to this account.')
  if (data.length > 1) throw new Error('Multiple active organizations are assigned. Organization selection is required.')
  return data[0].organization_id
}

export async function getSettings(): Promise<Settings> {
  const organizationId = await getMyOrganizationId()
  const { data, error } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) throw error
  return { id: 1, ...data } as Settings
}

export async function updateSettings(updates: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const organizationId = await getMyOrganizationId()
  const { data, error } = await supabase
    .from('organization_settings')
    .update(updates)
    .eq('organization_id', organizationId)
    .select('*')
    .single()

  if (error) throw error
  return { id: 1, ...data } as Settings
}


