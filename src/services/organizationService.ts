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