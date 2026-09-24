import { supabase } from '../lib/supabase'

export interface PublicOrganization {
  id: string
  name: string
  slug: string
}

export interface OrganizationBranding {
  organization_id: string
  logo_url: string | null
  favicon_url: string | null
  hero_image_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  heading_font: string
  body_font: string
}

export function getConfiguredOrganizationSlug(): string {
  const slug = import.meta.env.VITE_ORGANIZATION_SLUG?.trim().toLowerCase()

  if (!slug) {
    throw new Error(
      'VITE_ORGANIZATION_SLUG is not configured for this deployment.'
    )
  }

  return slug
}

export async function getConfiguredOrganization(): Promise<PublicOrganization> {
  const slug = getConfiguredOrganizationSlug()

  const { data, error } = await supabase.rpc(
    'get_public_organizations'
  )

  if (error) throw error

  const organizations = (data ?? []) as PublicOrganization[]

  const organization = organizations.find(
    (item) => item.slug.toLowerCase() === slug
  )

  if (!organization) {
    throw new Error(
      `Configured organization "${slug}" was not found or is not active.`
    )
  }

  return organization
}

export async function getPublicBranding(): Promise<OrganizationBranding> {
  const slug = getConfiguredOrganizationSlug()

  const { data, error } = await supabase.rpc(
    'get_public_branding',
    {
      p_organization_slug: slug,
    }
  )

  if (error) throw error

  const branding = data?.[0]

  if (!branding) {
    throw new Error(
      `Branding is not configured for organization "${slug}".`
    )
  }

  return branding as OrganizationBranding
}
