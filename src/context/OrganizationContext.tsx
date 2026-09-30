import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  getAdminOrganizationBranding,
  getConfiguredOrganization,
  getMyOrganizations,
  getPublicBranding,
  getPublicLandingContent,
  type AdminOrganization,
  type PublicOrganization,
  type OrganizationBranding,
  type OrganizationLandingContent,
} from '../services/organizationService'

interface OrganizationContextValue {
  organization: PublicOrganization | null
  branding: OrganizationBranding | null
  selectedAdminBranding: OrganizationBranding | null
  landingContent: OrganizationLandingContent | null
  loading: boolean
  error: string | null

  adminOrganizations: AdminOrganization[]
  selectedAdminOrganization: AdminOrganization | null
  adminOrganizationLoading: boolean
  adminOrganizationError: string | null
  setSelectedAdminOrganization: (organizationId: string) => void
}

const OrganizationContext = createContext<
  OrganizationContextValue | undefined
>(undefined)

const SELECTED_ADMIN_ORGANIZATION_KEY =
  'picklereserve.selectedAdminOrganizationId'

function applyBranding(branding: OrganizationBranding) {
  const root = document.documentElement

  root.style.setProperty('--color-court', branding.primary_color)
  root.style.setProperty('--color-court-dark', branding.accent_color)
  root.style.setProperty(
    '--color-court-accent',
    branding.secondary_color
  )
  root.style.setProperty('--color-paper', branding.background_color)
  root.style.setProperty('--color-surface', branding.surface_color)
  root.style.setProperty(
    '--color-surface-elevated',
    branding.surface_elevated_color
  )
  root.style.setProperty('--color-ink', branding.text_color)
  root.style.setProperty('--color-muted', branding.muted_text_color)
  root.style.setProperty('--color-line', branding.line_color)
  root.style.setProperty(
    '--font-display',
    `"${branding.heading_font}", sans-serif`
  )
  root.style.setProperty(
    '--font-body',
    `"${branding.body_font}", sans-serif`
  )
}

function clearBranding() {
  const root = document.documentElement

  root.style.removeProperty('--color-court')
  root.style.removeProperty('--color-court-dark')
  root.style.removeProperty('--color-court-accent')
  root.style.removeProperty('--color-paper')
  root.style.removeProperty('--color-surface')
  root.style.removeProperty('--color-surface-elevated')
  root.style.removeProperty('--color-ink')
  root.style.removeProperty('--color-muted')
  root.style.removeProperty('--color-line')
  root.style.removeProperty('--font-display')
  root.style.removeProperty('--font-body')
}

export function OrganizationProvider({
  children,
}: {
  children: ReactNode
}) {
  const { user, loading: authLoading } = useAuth()

  const [organization, setOrganization] =
    useState<PublicOrganization | null>(null)
  const [branding, setBranding] =
    useState<OrganizationBranding | null>(null)
  const [selectedAdminBranding, setSelectedAdminBranding] =
    useState<OrganizationBranding | null>(null)
  const [landingContent, setLandingContent] =
    useState<OrganizationLandingContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [adminOrganizations, setAdminOrganizations] = useState<
    AdminOrganization[]
  >([])
  const [selectedAdminOrganization, setSelectedAdminOrganization] =
    useState<AdminOrganization | null>(null)
  const [adminOrganizationLoading, setAdminOrganizationLoading] =
    useState(true)
  const [adminOrganizationError, setAdminOrganizationError] =
    useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrganization() {
      try {
        setLoading(true)
        setError(null)

        const [
          resolvedOrganization,
          resolvedBranding,
          resolvedLandingContent,
        ] = await Promise.all([
          getConfiguredOrganization(),
          getPublicBranding(),
          getPublicLandingContent(),
        ])

        if (cancelled) return

        setOrganization(resolvedOrganization)
        setBranding(resolvedBranding)
        setLandingContent(resolvedLandingContent)

        applyBranding(resolvedBranding)
      } catch (err) {
        if (cancelled) return

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load organization configuration.'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadOrganization()

    return () => {
      cancelled = true
      clearBranding()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAdminOrganizations() {
      if (authLoading) return

      if (!user) {
        setAdminOrganizations([])
        setSelectedAdminOrganization(null)
        setSelectedAdminBranding(null)
        setAdminOrganizationError(null)
        setAdminOrganizationLoading(false)
        return
      }

      try {
        setAdminOrganizationLoading(true)
        setAdminOrganizationError(null)

        const organizations = await getMyOrganizations()

        if (cancelled) return

        setAdminOrganizations(organizations)

        if (organizations.length === 0) {
          setSelectedAdminOrganization(null)
          setSelectedAdminBranding(null)
          return
        }

        const storedOrganizationId = window.localStorage.getItem(
          SELECTED_ADMIN_ORGANIZATION_KEY
        )

        const storedOrganization = organizations.find(
          (item) => item.organization_id === storedOrganizationId
        )

        if (storedOrganization) {
          setSelectedAdminOrganization(storedOrganization)
          return
        }

        if (organizations.length === 1) {
          const onlyOrganization = organizations[0]

          setSelectedAdminOrganization(onlyOrganization)

          window.localStorage.setItem(
            SELECTED_ADMIN_ORGANIZATION_KEY,
            onlyOrganization.organization_id
          )

          return
        }

        setSelectedAdminOrganization(null)
        setSelectedAdminBranding(null)
        window.localStorage.removeItem(
          SELECTED_ADMIN_ORGANIZATION_KEY
        )
      } catch (err) {
        if (cancelled) return

        setAdminOrganizations([])
        setSelectedAdminOrganization(null)
        setSelectedAdminBranding(null)
        setAdminOrganizationError(
          err instanceof Error
            ? err.message
            : 'Failed to load assigned organizations.'
        )
      } finally {
        if (!cancelled) {
          setAdminOrganizationLoading(false)
        }
      }
    }

    void loadAdminOrganizations()

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedAdminBranding() {
      if (!selectedAdminOrganization) {
        setSelectedAdminBranding(null)
        return
      }

      try {
        const resolvedBranding =
          await getAdminOrganizationBranding(
            selectedAdminOrganization.organization_id
          )

        if (cancelled) return

        setSelectedAdminBranding(resolvedBranding)
      } catch (err) {
        if (cancelled) return

        setSelectedAdminBranding(null)

        setAdminOrganizationError(
          err instanceof Error
            ? err.message
            : 'Failed to load selected organization branding.'
        )
      }
    }

    void loadSelectedAdminBranding()

    return () => {
      cancelled = true
    }
  }, [selectedAdminOrganization])

  function handleSetSelectedAdminOrganization(
    organizationId: string
  ) {
    const selectedOrganization = adminOrganizations.find(
      (item) => item.organization_id === organizationId
    )

    if (!selectedOrganization) {
      return
    }

    setSelectedAdminBranding(null)
    setSelectedAdminOrganization(selectedOrganization)

    window.localStorage.setItem(
      SELECTED_ADMIN_ORGANIZATION_KEY,
      selectedOrganization.organization_id
    )
  }

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        branding,
        selectedAdminBranding,
        landingContent,
        loading,
        error,
        adminOrganizations,
        selectedAdminOrganization,
        adminOrganizationLoading,
        adminOrganizationError,
        setSelectedAdminOrganization:
          handleSetSelectedAdminOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)

  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    )
  }

  return context
}