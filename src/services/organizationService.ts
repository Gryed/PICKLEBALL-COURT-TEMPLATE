import { supabase } from '../lib/supabase'

export interface PublicOrganization {
  id: string
  name: string
  slug: string
}

export interface AdminOrganization {
  organization_id: string
  organization_name: string
  organization_slug: string
  organization_status: string
}

export interface SuperAdminOrganizationSettings {
  organization_id: string
  show_court_type: boolean
  payment_mode: 'manual' | 'api'
  gcash_qr_url: string | null
  gcash_number: string | null
  gcash_name: string | null
  deposit_percentage: number
  booking_horizon_days: number
  booking_reference_prefix: string
  created_at: string
  updated_at: string
}

export interface SuperAdminOrganizationBranding {
  organization_id: string
  logo_url: string | null
  favicon_url: string | null
  hero_image_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  surface_color: string
  surface_elevated_color: string
  text_color: string
  muted_text_color: string
  line_color: string
  heading_font: string
  body_font: string
  contact_url: string | null
  faq_url: string | null
  terms_url: string | null
  primary_button_color: string | null
  created_at: string
  updated_at: string
}

export interface SuperAdminOrganizationLandingContent {
  organization_id: string

  hero_content: {
    eyebrow: string
    title: string
    description: string
    primary_cta: string
    secondary_cta: string
  }

  how_it_works: {
    title: string
    label: string
    description: string
    steps: Array<{
      number: string
      title: string
      description: string
    }>
  }

  final_cta: {
    label: string
    title: string
    button: string
    description: string
  }

  created_at: string
  updated_at: string
}

export interface OrganizationBranding {
  organization_id: string
  logo_url: string | null
  favicon_url: string | null
  hero_image_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  surface_color: string
  surface_elevated_color: string
  text_color: string
  muted_text_color: string
  line_color: string
  heading_font: string
  body_font: string
  contact_url: string | null
  faq_url: string | null
  terms_url: string | null
}

export interface OrganizationLandingContent {
  organization_id: string

  hero_content: {
    eyebrow: string
    title: string
    subtitle: string
    description: string
    primary_cta: string
    primary_cta_url: string
    secondary_cta: string
    secondary_cta_url: string
  }

  how_it_works: {
    title: string
    label: string
    description: string
    steps: Array<{
      number: number
      title: string
      description: string
      icon: string
    }>
  }

  final_cta: {
    title: string
    description: string
    label: string
    button: string
    button_url: string
  }
}

const SELECTED_ADMIN_ORGANIZATION_KEY =
  'picklereserve.selectedAdminOrganizationId'

export function getConfiguredOrganizationSlug(): string {
  const slug =
    import.meta.env.VITE_ORGANIZATION_SLUG
      ?.trim()
      .toLowerCase()

  if (!slug) {
    throw new Error(
      'VITE_ORGANIZATION_SLUG is not configured for this deployment.'
    )
  }

  return slug
}

export async function getConfiguredOrganization(): Promise<PublicOrganization> {
  const slug = getConfiguredOrganizationSlug()

  const { data, error } =
    await supabase.rpc('get_public_organizations')

  if (error) throw error

  const organizations =
    (data ?? []) as PublicOrganization[]

  const organization = organizations.find(
    (item) =>
      item.slug.toLowerCase() === slug
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

  const { data, error } =
    await supabase.rpc('get_public_branding', {
      p_organization_slug: slug,
    })

  if (error) throw error

  const branding = data?.[0]

  if (!branding) {
    throw new Error(
      `Branding is not configured for organization "${slug}".`
    )
  }

  return branding as OrganizationBranding
}

export async function getPublicLandingContent(): Promise<OrganizationLandingContent> {
  const slug = getConfiguredOrganizationSlug()

  const { data, error } =
    await supabase.rpc(
      'get_public_landing_content',
      {
        p_organization_slug: slug,
      }
    )

  if (error) throw error

  const content = data?.[0]

  if (!content) {
    throw new Error(
      `Landing content is not configured for organization "${slug}".`
    )
  }

  return content as OrganizationLandingContent
}

/* =========================================================
   ADMIN ORGANIZATIONS
========================================================= */

export async function getMyOrganizations(): Promise<
  AdminOrganization[]
> {
  const { data, error } =
    await supabase.rpc(
      'get_my_organization_context'
    )

  if (error) throw error

  return (data ?? []) as AdminOrganization[]
}

export async function getAdminOrganizationBranding(
  organizationId: string
): Promise<OrganizationBranding> {
  const { data, error } = await supabase.rpc(
    'get_admin_organization_branding',
    {
      p_organization_id: organizationId,
    }
  )

  if (error) throw error

  return data as OrganizationBranding
}
/* =========================================================
   SELECTED ADMIN ORGANIZATION
========================================================= */

export async function getSelectedAdminOrganizationId(): Promise<string> {
  const organizations =
    await getMyOrganizations()

  if (organizations.length === 0) {
    throw new Error(
      'No active organization is assigned to this account.'
    )
  }

  const storedOrganizationId =
    window.localStorage.getItem(
      SELECTED_ADMIN_ORGANIZATION_KEY
    )

  /*
   * If the user only belongs to one active
   * organization, select it automatically.
   */
  if (organizations.length === 1) {
    const onlyOrganization =
      organizations[0]

    if (
      storedOrganizationId !==
      onlyOrganization.organization_id
    ) {
      window.localStorage.setItem(
        SELECTED_ADMIN_ORGANIZATION_KEY,
        onlyOrganization.organization_id
      )
    }

    return onlyOrganization.organization_id
  }

  /*
   * Multiple organizations:
   * the user must explicitly select one.
   */
  const selectedOrganization =
    organizations.find(
      (organization) =>
        organization.organization_id ===
        storedOrganizationId
    )

  if (!selectedOrganization) {
    throw new Error(
      'Multiple active organizations are assigned. Organization selection is required.'
    )
  }

  return selectedOrganization.organization_id
}

export async function getSuperAdminOrganizationSettings(
  organizationId: string
): Promise<SuperAdminOrganizationSettings> {
  const { data, error } = await supabase.rpc(
    'super_admin_get_organization_settings',
    {
      p_organization_id: organizationId,
    }
  )

  if (error) throw error

  return data as SuperAdminOrganizationSettings
}

export async function getSuperAdminOrganizationBranding(
  organizationId: string
): Promise<SuperAdminOrganizationBranding> {
  const { data, error } = await supabase.rpc(
    'super_admin_get_organization_branding',
    {
      p_organization_id: organizationId,
    }
  )

  if (error) throw error

  return data as SuperAdminOrganizationBranding
}

export async function getSuperAdminOrganizationLandingContent(
  organizationId: string
): Promise<SuperAdminOrganizationLandingContent> {
  const { data, error } = await supabase.rpc(
    'super_admin_get_organization_landing_content',
    {
      p_organization_id: organizationId,
    }
  )

  if (error) throw error

  return data as SuperAdminOrganizationLandingContent
}

export async function updateSuperAdminOrganizationSettings(
  organizationId: string,
  settings: Omit<
    SuperAdminOrganizationSettings,
    'organization_id' | 'created_at' | 'updated_at'
  >
): Promise<SuperAdminOrganizationSettings> {
  const { data, error } = await supabase.rpc(
    'super_admin_update_organization_settings',
    {
      p_organization_id: organizationId,
      p_show_court_type: settings.show_court_type,
      p_payment_mode: settings.payment_mode,
      p_gcash_qr_url: settings.gcash_qr_url,
      p_gcash_number: settings.gcash_number,
      p_gcash_name: settings.gcash_name,
      p_deposit_percentage: settings.deposit_percentage,
      p_booking_horizon_days: settings.booking_horizon_days,
      p_booking_reference_prefix:
        settings.booking_reference_prefix,
    }
  )

  if (error) throw error

  return data as SuperAdminOrganizationSettings
}

export async function updateSuperAdminOrganizationBranding(
  organizationId: string,
  branding: Omit<
    SuperAdminOrganizationBranding,
    'organization_id' | 'created_at' | 'updated_at'
  >
): Promise<SuperAdminOrganizationBranding> {
  const { data, error } = await supabase.rpc(
    'super_admin_update_organization_branding',
    {
      p_organization_id: organizationId,
      p_logo_url: branding.logo_url,
      p_favicon_url: branding.favicon_url,
      p_hero_image_url: branding.hero_image_url,
      p_primary_color: branding.primary_color,
      p_secondary_color: branding.secondary_color,
      p_accent_color: branding.accent_color,
      p_background_color: branding.background_color,
      p_surface_color: branding.surface_color,
      p_surface_elevated_color:
        branding.surface_elevated_color,
      p_text_color: branding.text_color,
      p_muted_text_color: branding.muted_text_color,
      p_line_color: branding.line_color,
      p_heading_font: branding.heading_font,
      p_body_font: branding.body_font,
      p_contact_url: branding.contact_url,
      p_faq_url: branding.faq_url,
      p_terms_url: branding.terms_url,
      p_primary_button_color:
        branding.primary_button_color,
    }
  )

  if (error) throw error

  return data as SuperAdminOrganizationBranding
}

export async function updateSuperAdminOrganizationLandingContent(
  organizationId: string,
  content: Omit<
    SuperAdminOrganizationLandingContent,
    'organization_id' | 'created_at' | 'updated_at'
  >
): Promise<SuperAdminOrganizationLandingContent> {
  const { data, error } = await supabase.rpc(
    'super_admin_update_organization_landing_content',
    {
      p_organization_id: organizationId,
      p_hero_content: content.hero_content,
      p_how_it_works: content.how_it_works,
      p_final_cta: content.final_cta,
    }
  )

  if (error) throw error

  return data as SuperAdminOrganizationLandingContent
}