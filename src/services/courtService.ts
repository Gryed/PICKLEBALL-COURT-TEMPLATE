import { supabase } from '../lib/supabase'
import {
  getSelectedAdminOrganizationId,
} from './organizationService'
import type {
  Court,
  Settings,
} from '../types/court'

/* =========================================================
   ADMIN COURTS
========================================================= */

export async function getCourts(): Promise<Court[]> {
  const organizationId =
    await getSelectedAdminOrganizationId()

  const { data, error } =
    await supabase
      .from('courts')
      .select('*')
      .eq(
        'organization_id',
        organizationId
      )
      .order('created_at', {
        ascending: true,
      })

  if (error) throw error

  return data as Court[]
}

/* =========================================================
   PUBLIC COURTS
========================================================= */

export async function getPublicCourts(
  organizationSlug: string
): Promise<Court[]> {
  const { data, error } =
    await supabase.rpc(
      'get_public_courts',
      {
        p_organization_slug:
          organizationSlug,
      }
    )

  if (error) throw error

  return (data ??
    []) as Court[]
}

/* =========================================================
   PUBLIC BOOKING SETTINGS
========================================================= */

/* =========================================================
   PUBLIC COURT ORGANIZATION
========================================================= */
export async function getPublicCourtOrganizationId(
  courtId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('courts')
    .select('id, organization_id')
    .eq('id', courtId)
    .maybeSingle()
  if (error) throw error
  if (!data?.organization_id) {
    throw new Error(
      'The Open Play court organization could not be resolved.'
    )
  }
  return data.organization_id
}
/* =========================================================
   PUBLIC BOOKING SETTINGS
========================================================= */
export async function getPublicBookingSettings(
  courtId: string
): Promise<Settings> {
  const { data, error } =
    await supabase.rpc(
      'get_public_booking_settings',
      {
        p_court_id:
          courtId,
      }
    )

  if (error) throw error

  const row = data?.[0]

  if (!row) {
    throw new Error(
      'Booking settings are not available for this court.'
    )
  }

  return {
    id: 1,
    ...row,
  } as Settings
}

/* =========================================================
   CREATE COURT
========================================================= */

export async function createCourt(
  court: Omit<
    Court,
    'id' | 'created_at'
  >
): Promise<Court> {
  const organizationId =
    await getSelectedAdminOrganizationId()

  const { data, error } =
    await supabase
      .from('courts')
      .insert({
        ...court,
        organization_id:
          organizationId,
      })
      .select()
      .single()

  if (error) throw error

  return data as Court
}

/* =========================================================
   UPDATE COURT
========================================================= */

export async function updateCourt(
  id: string,
  updates: Partial<
    Omit<Court, 'id' | 'created_at'>
  >
): Promise<Court> {
  const organizationId =
    await getSelectedAdminOrganizationId()

  const { data, error } =
    await supabase
      .from('courts')
      .update(updates)
      .eq('id', id)
      .eq(
        'organization_id',
        organizationId
      )
      .select()
      .single()

  if (error) throw error

  return data as Court
}

/* =========================================================
   DELETE COURT
========================================================= */

export async function deleteCourt(
  id: string
): Promise<void> {
  const organizationId =
    await getSelectedAdminOrganizationId()

  const { error } =
    await supabase
      .from('courts')
      .delete()
      .eq('id', id)
      .eq(
        'organization_id',
        organizationId
      )

  if (error) throw error
}

/* =========================================================
   ADMIN SETTINGS
========================================================= */

export async function getSettings(): Promise<Settings> {
  const organizationId =
    await getSelectedAdminOrganizationId()

  const { data, error } =
    await supabase
      .from('organization_settings')
      .select('*')
      .eq(
        'organization_id',
        organizationId
      )
      .single()

  if (error) throw error

  return {
    id: 1,
    ...data,
  } as Settings
}

/* =========================================================
   UPDATE SETTINGS
========================================================= */

export async function updateSettings(
  updates: Partial<
    Omit<Settings, 'id'>
  >
): Promise<Settings> {
  const organizationId =
    await getSelectedAdminOrganizationId()

  const { data, error } =
    await supabase
      .from('organization_settings')
      .update(updates)
      .eq(
        'organization_id',
        organizationId
      )
      .select('*')
      .single()

  if (error) throw error

  return {
    id: 1,
    ...data,
  } as Settings
}
