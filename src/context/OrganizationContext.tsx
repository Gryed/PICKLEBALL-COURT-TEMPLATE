import { createContext, useContext, useEffect, useState } from 'react'
import {
  getConfiguredOrganization,
  getPublicBranding,
  type PublicOrganization,
  type OrganizationBranding,
} from '../services/organizationService'

interface OrganizationContextValue {
  organization: PublicOrganization | null
  branding: OrganizationBranding | null
  loading: boolean
  error: string | null
}

const OrganizationContext =
  createContext<OrganizationContextValue | undefined>(undefined)

function applyBranding(branding: OrganizationBranding) {
  const root = document.documentElement

  root.style.setProperty('--color-court', branding.primary_color)
  root.style.setProperty('--color-court-dark', branding.accent_color)
  root.style.setProperty('--color-court-accent', branding.secondary_color)

  root.style.setProperty('--font-display', `"${branding.heading_font}", sans-serif`)
  root.style.setProperty('--font-body', `"${branding.body_font}", sans-serif`)
}

function clearBranding() {
  const root = document.documentElement

  root.style.removeProperty('--color-court')
  root.style.removeProperty('--color-court-dark')
  root.style.removeProperty('--color-court-accent')
  root.style.removeProperty('--font-display')
  root.style.removeProperty('--font-body')
}

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [organization, setOrganization] =
    useState<PublicOrganization | null>(null)

  const [branding, setBranding] =
    useState<OrganizationBranding | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrganization() {
      try {
        setLoading(true)
        setError(null)

        const [resolvedOrganization, resolvedBranding] =
          await Promise.all([
            getConfiguredOrganization(),
            getPublicBranding(),
          ])

        if (cancelled) return

        setOrganization(resolvedOrganization)
        setBranding(resolvedBranding)
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

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        branding,
        loading,
        error,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)

  if (!context) {
    throw new Error(
      'useOrganization must be used inside OrganizationProvider.'
    )
  }

  return context
}
