import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getSuperAdminOrganizationBranding,
  getSuperAdminOrganizationLandingContent,
  getSuperAdminOrganizationSettings,
  updateSuperAdminOrganizationBranding,
  updateSuperAdminOrganizationLandingContent,
  updateSuperAdminOrganizationSettings,
  type SuperAdminOrganizationBranding,
  type SuperAdminOrganizationLandingContent,
  type SuperAdminOrganizationSettings,
} from '../services/organizationService'

type Organization = {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'archived'
  created_at: string
  member_count: number
}

type Tab = 'general' | 'settings' | 'branding' | 'landing'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'settings', label: 'Settings' },
  { id: 'branding', label: 'Branding' },
  { id: 'landing', label: 'Landing Content' },
]

const emptySettings: Omit<
  SuperAdminOrganizationSettings,
  'organization_id' | 'created_at' | 'updated_at'
> = {
  show_court_type: true,
  payment_mode: 'manual',
  gcash_qr_url: null,
  gcash_number: null,
  gcash_name: null,
  deposit_percentage: 50,
  booking_horizon_days: 60,
  booking_reference_prefix: 'AX',
}

const emptyBranding: Omit<
  SuperAdminOrganizationBranding,
  'organization_id' | 'created_at' | 'updated_at'
> = {
  logo_url: null,
  favicon_url: null,
  hero_image_url: null,
  primary_color: '#A3DB38',
  secondary_color: '#4B8EC7',
  accent_color: '#8DC63F',
  background_color: '#0D1B36',
  surface_color: '#1A3561',
  surface_elevated_color: '#2F69A3',
  text_color: '#FFFFFF',
  muted_text_color: '#B8C7DC',
  line_color: '#315789',
  heading_font: 'Space Grotesk',
  body_font: 'Inter',
  contact_url: null,
  faq_url: null,
  terms_url: null,
  primary_button_color: null,
}

const emptyLanding: Omit<
  SuperAdminOrganizationLandingContent,
  'organization_id' | 'created_at' | 'updated_at'
> = {
  hero_content: {
    eyebrow: '',
    title: '',
    description: '',
    primary_cta: '',
    secondary_cta: '',
  },
  how_it_works: {
    title: '',
    label: '',
    description: '',
    steps: [
      {
        number: '01',
        title: '',
        description: '',
      },
      {
        number: '02',
        title: '',
        description: '',
      },
      {
        number: '03',
        title: '',
        description: '',
      },
    ],
  },
  final_cta: {
    label: '',
    title: '',
    button: '',
    description: '',
  },
}

function nullableValue(value: string) {
  return value.trim() || null
}

export default function SuperAdminOrganizationConfiguration() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [organization, setOrganization] =
    useState<Organization | null>(null)

  const [settings, setSettings] =
    useState(emptySettings)

  const [branding, setBranding] =
    useState(emptyBranding)

  const [landing, setLanding] =
    useState(emptyLanding)

  const [activeTab, setActiveTab] =
    useState<Tab>('general')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [generalForm, setGeneralForm] = useState({
    name: '',
    slug: '',
    status: 'active' as Organization['status'],
  })

  useEffect(() => {
    let cancelled = false

    async function loadConfiguration() {
      if (!id) {
        setError('Organization ID is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      setNotice('')

      try {
        const { data, error: organizationError } =
          await supabase.rpc('get_super_admin_organizations')

        if (organizationError) {
          throw organizationError
        }

        const organizations =
          (data ?? []) as Organization[]

        const selectedOrganization =
          organizations.find(
            (item) => item.id === id
          )

        if (!selectedOrganization) {
          throw new Error(
            'Organization not found or you do not have access to it.'
          )
        }

        const [
          resolvedSettings,
          resolvedBranding,
          resolvedLanding,
        ] = await Promise.all([
          getSuperAdminOrganizationSettings(id),
          getSuperAdminOrganizationBranding(id),
          getSuperAdminOrganizationLandingContent(id),
        ])

        if (cancelled) return

        setOrganization(selectedOrganization)

        setGeneralForm({
          name: selectedOrganization.name,
          slug: selectedOrganization.slug,
          status: selectedOrganization.status,
        })

        setSettings({
          show_court_type:
            resolvedSettings.show_court_type,
          payment_mode:
            resolvedSettings.payment_mode,
          gcash_qr_url:
            resolvedSettings.gcash_qr_url,
          gcash_number:
            resolvedSettings.gcash_number,
          gcash_name:
            resolvedSettings.gcash_name,
          deposit_percentage:
            Number(resolvedSettings.deposit_percentage),
          booking_horizon_days:
            Number(resolvedSettings.booking_horizon_days),
          booking_reference_prefix:
            resolvedSettings.booking_reference_prefix,
        })

        setBranding({
          logo_url: resolvedBranding.logo_url,
          favicon_url:
            resolvedBranding.favicon_url,
          hero_image_url:
            resolvedBranding.hero_image_url,
          primary_color:
            resolvedBranding.primary_color,
          secondary_color:
            resolvedBranding.secondary_color,
          accent_color:
            resolvedBranding.accent_color,
          background_color:
            resolvedBranding.background_color,
          surface_color:
            resolvedBranding.surface_color,
          surface_elevated_color:
            resolvedBranding.surface_elevated_color,
          text_color:
            resolvedBranding.text_color,
          muted_text_color:
            resolvedBranding.muted_text_color,
          line_color:
            resolvedBranding.line_color,
          heading_font:
            resolvedBranding.heading_font,
          body_font:
            resolvedBranding.body_font,
          contact_url:
            resolvedBranding.contact_url,
          faq_url:
            resolvedBranding.faq_url,
          terms_url:
            resolvedBranding.terms_url,
          primary_button_color:
            resolvedBranding.primary_button_color,
        })

        setLanding({
          hero_content: {
            eyebrow:
              resolvedLanding.hero_content.eyebrow ?? '',
            title:
              resolvedLanding.hero_content.title ?? '',
            description:
              resolvedLanding.hero_content.description ?? '',
            primary_cta:
              resolvedLanding.hero_content.primary_cta ?? '',
            secondary_cta:
              resolvedLanding.hero_content.secondary_cta ?? '',
          },
          how_it_works: {
            title:
              resolvedLanding.how_it_works.title ?? '',
            label:
              resolvedLanding.how_it_works.label ?? '',
            description:
              resolvedLanding.how_it_works.description ?? '',
            steps:
              resolvedLanding.how_it_works.steps?.length === 3
                ? resolvedLanding.how_it_works.steps.map(
                    (step, index) => ({
                      number:
                        String(
                          step.number ??
                            String(index + 1).padStart(2, '0')
                        ),
                      title: step.title ?? '',
                      description:
                        step.description ?? '',
                    })
                  )
                : emptyLanding.how_it_works.steps,
          },
          final_cta: {
            label:
              resolvedLanding.final_cta.label ?? '',
            title:
              resolvedLanding.final_cta.title ?? '',
            button:
              resolvedLanding.final_cta.button ?? '',
            description:
              resolvedLanding.final_cta.description ?? '',
          },
        })
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

    void loadConfiguration()

    return () => {
      cancelled = true
    }
  }, [id])

  function clearMessages() {
    setError('')
    setNotice('')
  }

  async function saveGeneral(event: FormEvent) {
    event.preventDefault()

    if (!id) return

    setSaving(true)
    clearMessages()

    try {
      const { data, error: rpcError } =
        await supabase.rpc(
          'super_admin_update_organization',
          {
            p_organization_id: id,
            p_name: generalForm.name.trim(),
            p_slug: generalForm.slug.trim().toLowerCase(),
            p_status: generalForm.status,
          }
        )

      if (rpcError) throw rpcError

      const updated =
        data as Organization | null

      if (updated) {
        setOrganization((current) => ({
          ...(current ?? updated),
          ...updated,
        }))
      }

      setNotice('General organization settings saved.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save organization settings.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()

    if (!id) return

    setSaving(true)
    clearMessages()

    try {
      const saved =
        await updateSuperAdminOrganizationSettings(
          id,
          settings
        )

      setSettings({
        show_court_type:
          saved.show_court_type,
        payment_mode:
          saved.payment_mode,
        gcash_qr_url:
          saved.gcash_qr_url,
        gcash_number:
          saved.gcash_number,
        gcash_name:
          saved.gcash_name,
        deposit_percentage:
          Number(saved.deposit_percentage),
        booking_horizon_days:
          Number(saved.booking_horizon_days),
        booking_reference_prefix:
          saved.booking_reference_prefix,
      })

      setNotice('Organization settings saved.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save organization settings.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveBranding(event: FormEvent) {
    event.preventDefault()

    if (!id) return

    setSaving(true)
    clearMessages()

    try {
      const saved =
        await updateSuperAdminOrganizationBranding(
          id,
          branding
        )

      setBranding({
        logo_url: saved.logo_url,
        favicon_url:
          saved.favicon_url,
        hero_image_url:
          saved.hero_image_url,
        primary_color:
          saved.primary_color,
        secondary_color:
          saved.secondary_color,
        accent_color:
          saved.accent_color,
        background_color:
          saved.background_color,
        surface_color:
          saved.surface_color,
        surface_elevated_color:
          saved.surface_elevated_color,
        text_color:
          saved.text_color,
        muted_text_color:
          saved.muted_text_color,
        line_color:
          saved.line_color,
        heading_font:
          saved.heading_font,
        body_font:
          saved.body_font,
        contact_url:
          saved.contact_url,
        faq_url:
          saved.faq_url,
        terms_url:
          saved.terms_url,
        primary_button_color:
          saved.primary_button_color,
      })

      setNotice('Branding configuration saved.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save branding configuration.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveLanding(event: FormEvent) {
    event.preventDefault()

    if (!id) return

    setSaving(true)
    clearMessages()

    try {
      const saved =
        await updateSuperAdminOrganizationLandingContent(
          id,
          landing
        )

      setLanding({
        hero_content: {
          eyebrow:
            saved.hero_content.eyebrow ?? '',
          title:
            saved.hero_content.title ?? '',
          description:
            saved.hero_content.description ?? '',
          primary_cta:
            saved.hero_content.primary_cta ?? '',
          secondary_cta:
            saved.hero_content.secondary_cta ?? '',
        },
        how_it_works: {
          title:
            saved.how_it_works.title ?? '',
          label:
            saved.how_it_works.label ?? '',
          description:
            saved.how_it_works.description ?? '',
          steps:
            saved.how_it_works.steps?.length === 3
              ? saved.how_it_works.steps.map(
                  (step, index) => ({
                    number:
                      String(
                        step.number ??
                          String(index + 1).padStart(2, '0')
                      ),
                    title: step.title ?? '',
                    description:
                      step.description ?? '',
                  })
                )
              : landing.how_it_works.steps,
        },
        final_cta: {
          label:
            saved.final_cta.label ?? '',
          title:
            saved.final_cta.title ?? '',
          button:
            saved.final_cta.button ?? '',
          description:
            saved.final_cta.description ?? '',
        },
      })

      setNotice('Landing content saved.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save landing content.'
      )
    } finally {
      setSaving(false)
    }
  }

  function updateLandingStep(
    index: number,
    field: 'number' | 'title' | 'description',
    value: string
  ) {
    setLanding((current) => ({
      ...current,
      how_it_works: {
        ...current.how_it_works,
        steps: current.how_it_works.steps.map(
          (step, stepIndex) =>
            stepIndex === index
              ? { ...step, [field]: value }
              : step
        ),
      },
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <div className="text-sm text-muted">
          Loading organization configuration...
        </div>
      </div>
    )
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-paper px-6 py-10 text-ink">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/super-admin/organizations"
            className="text-sm font-semibold text-court hover:underline"
          >
            ← Back to Organizations
          </Link>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
            <h1 className="text-xl font-bold">
              Unable to load organization
            </h1>
            <p className="mt-2 text-sm text-muted">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) return null

  return (
    <div className="min-h-screen bg-paper text-ink px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            to="/super-admin/organizations"
            className="text-sm font-semibold text-court hover:underline"
          >
            ← Back to Organizations
          </Link>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
                Super Admin
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">
                Organization Configuration
              </h1>
              <p className="mt-2 text-sm text-muted">
                Configure the tenant identity, booking behavior,
                branding, and landing page content.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Organization
              </p>
              <p className="mt-1 font-bold">
                {organization.name}
              </p>
              <p className="text-sm text-muted">
                {organization.slug}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            {notice}
          </div>
        )}

        <div className="rounded-2xl border border-line bg-surface shadow-sm">
          <div className="border-b border-line px-4 pt-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    clearMessages()
                  }}
                  className={`whitespace-nowrap rounded-t-xl px-4 py-3 text-sm font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-court text-white'
                      : 'text-muted hover:bg-surface-elevated hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'general' && (
              <form
                onSubmit={saveGeneral}
                className="space-y-6"
              >
                <SectionHeader
                  title="General"
                  description="Manage the organization's core identity and lifecycle status."
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Organization Name"
                    value={generalForm.name}
                    onChange={(value) =>
                      setGeneralForm((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    required
                  />

                  <Field
                    label="Slug"
                    value={generalForm.slug}
                    onChange={(value) =>
                      setGeneralForm((current) => ({
                        ...current,
                        slug: value.toLowerCase(),
                      }))
                    }
                    required
                    hint="Used to identify the tenant deployment."
                  />

                  <SelectField
                    label="Status"
                    value={generalForm.status}
                    onChange={(value) =>
                      setGeneralForm((current) => ({
                        ...current,
                        status:
                          value as Organization['status'],
                      }))
                    }
                    options={[
                      {
                        value: 'active',
                        label: 'Active',
                      },
                      {
                        value: 'suspended',
                        label: 'Suspended',
                      },
                      {
                        value: 'archived',
                        label: 'Archived',
                      },
                    ]}
                  />
                </div>

                <SaveButton saving={saving} />
              </form>
            )}

            {activeTab === 'settings' && (
              <form
                onSubmit={saveSettings}
                className="space-y-6"
              >
                <SectionHeader
                  title="Settings"
                  description="Configure booking rules and payment behavior for this organization."
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <ToggleField
                    label="Show Court Type"
                    description="Display court type information in booking flows."
                    checked={settings.show_court_type}
                    onChange={(checked) =>
                      setSettings((current) => ({
                        ...current,
                        show_court_type: checked,
                      }))
                    }
                  />

                  <SelectField
                    label="Payment Mode"
                    value={settings.payment_mode}
                    onChange={(value) =>
                      setSettings((current) => ({
                        ...current,
                        payment_mode:
                          value as 'manual' | 'api',
                      }))
                    }
                    options={[
                      {
                        value: 'manual',
                        label: 'Manual',
                      },
                      {
                        value: 'api',
                        label: 'API',
                      },
                    ]}
                  />

                  <NumberField
                    label="Deposit Percentage"
                    value={settings.deposit_percentage}
                    min={1}
                    max={100}
                    onChange={(value) =>
                      setSettings((current) => ({
                        ...current,
                        deposit_percentage: value,
                      }))
                    }
                    hint="Allowed range: 1–100%."
                  />

                  <NumberField
                    label="Booking Horizon"
                    value={settings.booking_horizon_days}
                    min={1}
                    max={3650}
                    onChange={(value) =>
                      setSettings((current) => ({
                        ...current,
                        booking_horizon_days: value,
                      }))
                    }
                    hint="Number of days customers can book ahead."
                  />

                  <Field
                    label="Booking Reference Prefix"
                    value={settings.booking_reference_prefix}
                    onChange={(value) =>
                      setSettings((current) => ({
                        ...current,
                        booking_reference_prefix:
                          value.toUpperCase(),
                      }))
                    }
                    required
                    hint="2–6 uppercase letters or numbers."
                  />
                </div>

                <div className="rounded-2xl border border-line bg-surface-elevated p-5">
                  <h3 className="font-bold">
                    GCash Payment Details
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Used when the organization is configured for
                    manual payment verification.
                  </p>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <Field
                      label="GCash QR URL"
                      value={
                        settings.gcash_qr_url ?? ''
                      }
                      onChange={(value) =>
                        setSettings((current) => ({
                          ...current,
                          gcash_qr_url:
                            nullableValue(value),
                        }))
                      }
                    />

                    <Field
                      label="GCash Number"
                      value={
                        settings.gcash_number ?? ''
                      }
                      onChange={(value) =>
                        setSettings((current) => ({
                          ...current,
                          gcash_number:
                            nullableValue(value),
                        }))
                      }
                    />

                    <Field
                      label="GCash Account Name"
                      value={
                        settings.gcash_name ?? ''
                      }
                      onChange={(value) =>
                        setSettings((current) => ({
                          ...current,
                          gcash_name:
                            nullableValue(value),
                        }))
                      }
                    />
                  </div>
                </div>

                <SaveButton saving={saving} />
              </form>
            )}

            {activeTab === 'branding' && (
              <form
                onSubmit={saveBranding}
                className="space-y-6"
              >
                <SectionHeader
                  title="Branding"
                  description="Configure the tenant's visual identity, typography, and external links."
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Logo URL"
                    value={branding.logo_url ?? ''}
                    onChange={(value) =>
                      setBranding((current) => ({
                        ...current,
                        logo_url:
                          nullableValue(value),
                      }))
                    }
                  />

                  <Field
                    label="Favicon URL"
                    value={
                      branding.favicon_url ?? ''
                    }
                    onChange={(value) =>
                      setBranding((current) => ({
                        ...current,
                        favicon_url:
                          nullableValue(value),
                      }))
                    }
                  />

                  <Field
                    label="Hero Image URL"
                    value={
                      branding.hero_image_url ?? ''
                    }
                    onChange={(value) =>
                      setBranding((current) => ({
                        ...current,
                        hero_image_url:
                          nullableValue(value),
                      }))
                    }
                  />

                  <Field
                    label="Heading Font"
                    value={branding.heading_font}
                    onChange={(value) =>
                      setBranding((current) => ({
                        ...current,
                        heading_font: value,
                      }))
                    }
                    required
                  />

                  <Field
                    label="Body Font"
                    value={branding.body_font}
                    onChange={(value) =>
                      setBranding((current) => ({
                        ...current,
                        body_font: value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-bold">
                    Colors
                  </h3>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <ColorField
                      label="Primary"
                      value={branding.primary_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          primary_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Secondary"
                      value={branding.secondary_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          secondary_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Accent"
                      value={branding.accent_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          accent_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Background"
                      value={branding.background_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          background_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Surface"
                      value={branding.surface_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          surface_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Elevated Surface"
                      value={
                        branding.surface_elevated_color
                      }
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          surface_elevated_color:
                            value,
                        }))
                      }
                    />

                    <ColorField
                      label="Text"
                      value={branding.text_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          text_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Muted Text"
                      value={branding.muted_text_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          muted_text_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Line"
                      value={branding.line_color}
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          line_color: value,
                        }))
                      }
                    />

                    <ColorField
                      label="Primary Button"
                      value={
                        branding.primary_button_color ??
                        branding.accent_color
                      }
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          primary_button_color:
                            value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-bold">
                    Links
                  </h3>

                  <div className="grid gap-5 md:grid-cols-3">
                    <Field
                      label="Contact URL"
                      value={
                        branding.contact_url ?? ''
                      }
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          contact_url:
                            nullableValue(value),
                        }))
                      }
                    />

                    <Field
                      label="FAQ URL"
                      value={
                        branding.faq_url ?? ''
                      }
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          faq_url:
                            nullableValue(value),
                        }))
                      }
                    />

                    <Field
                      label="Terms URL"
                      value={
                        branding.terms_url ?? ''
                      }
                      onChange={(value) =>
                        setBranding((current) => ({
                          ...current,
                          terms_url:
                            nullableValue(value),
                        }))
                      }
                    />
                  </div>
                </div>

                <SaveButton saving={saving} />
              </form>
            )}

            {activeTab === 'landing' && (
              <form
                onSubmit={saveLanding}
                className="space-y-8"
              >
                <SectionHeader
                  title="Landing Content"
                  description="Customize the tenant's public landing page copy."
                />

                <div className="rounded-2xl border border-line bg-surface-elevated p-5">
                  <h3 className="text-lg font-bold">
                    Hero
                  </h3>

                  <div className="mt-5 grid gap-5">
                    <Field
                      label="Eyebrow"
                      value={
                        landing.hero_content.eyebrow
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          hero_content: {
                            ...current.hero_content,
                            eyebrow: value,
                          },
                        }))
                      }
                    />

                    <Field
                      label="Title"
                      value={
                        landing.hero_content.title
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          hero_content: {
                            ...current.hero_content,
                            title: value,
                          },
                        }))
                      }
                    />

                    <TextAreaField
                      label="Description"
                      value={
                        landing.hero_content.description
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          hero_content: {
                            ...current.hero_content,
                            description: value,
                          },
                        }))
                      }
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Primary CTA"
                        value={
                          landing.hero_content.primary_cta
                        }
                        onChange={(value) =>
                          setLanding((current) => ({
                            ...current,
                            hero_content: {
                              ...current.hero_content,
                              primary_cta: value,
                            },
                          }))
                        }
                      />

                      <Field
                        label="Secondary CTA"
                        value={
                          landing.hero_content.secondary_cta
                        }
                        onChange={(value) =>
                          setLanding((current) => ({
                            ...current,
                            hero_content: {
                              ...current.hero_content,
                              secondary_cta: value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-surface-elevated p-5">
                  <h3 className="text-lg font-bold">
                    How It Works
                  </h3>

                  <div className="mt-5 grid gap-5">
                    <Field
                      label="Label"
                      value={
                        landing.how_it_works.label
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          how_it_works: {
                            ...current.how_it_works,
                            label: value,
                          },
                        }))
                      }
                    />

                    <Field
                      label="Title"
                      value={
                        landing.how_it_works.title
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          how_it_works: {
                            ...current.how_it_works,
                            title: value,
                          },
                        }))
                      }
                    />

                    <TextAreaField
                      label="Description"
                      value={
                        landing.how_it_works.description
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          how_it_works: {
                            ...current.how_it_works,
                            description: value,
                          },
                        }))
                      }
                    />

                    <div className="grid gap-5 lg:grid-cols-3">
                      {landing.how_it_works.steps.map(
                        (step, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-line bg-surface p-4"
                          >
                            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">
                              Step {index + 1}
                            </p>

                            <div className="space-y-4">
                              <Field
                                label="Number"
                                value={step.number}
                                onChange={(value) =>
                                  updateLandingStep(
                                    index,
                                    'number',
                                    value
                                  )
                                }
                              />

                              <Field
                                label="Title"
                                value={step.title}
                                onChange={(value) =>
                                  updateLandingStep(
                                    index,
                                    'title',
                                    value
                                  )
                                }
                              />

                              <TextAreaField
                                label="Description"
                                value={
                                  step.description
                                }
                                onChange={(value) =>
                                  updateLandingStep(
                                    index,
                                    'description',
                                    value
                                  )
                                }
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-surface-elevated p-5">
                  <h3 className="text-lg font-bold">
                    Final CTA
                  </h3>

                  <div className="mt-5 grid gap-5">
                    <Field
                      label="Label"
                      value={
                        landing.final_cta.label
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          final_cta: {
                            ...current.final_cta,
                            label: value,
                          },
                        }))
                      }
                    />

                    <Field
                      label="Title"
                      value={
                        landing.final_cta.title
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          final_cta: {
                            ...current.final_cta,
                            title: value,
                          },
                        }))
                      }
                    />

                    <TextAreaField
                      label="Description"
                      value={
                        landing.final_cta.description
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          final_cta: {
                            ...current.final_cta,
                            description: value,
                          },
                        }))
                      }
                    />

                    <Field
                      label="Button"
                      value={
                        landing.final_cta.button
                      }
                      onChange={(value) =>
                        setLanding((current) => ({
                          ...current,
                          final_cta: {
                            ...current.final_cta,
                            button: value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <SaveButton saving={saving} />
              </form>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/super-admin/organizations')}
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← Return to Organization Management
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {description}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required = false,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  hint?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/20"
      />

      {hint && (
        <span className="mt-1 block text-xs text-muted">
          {hint}
        </span>
      )}
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={4}
        className="mt-2 w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/20"
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">
        {label}
      </span>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/20"
      />

      {hint && (
        <span className="mt-1 block text-xs text-muted">
          {hint}
        </span>
      )}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{
    value: string
    label: string
  }>
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/20"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">
        {label}
      </span>

      <div className="mt-2 flex gap-2">
        <input
          type="color"
          value={
            /^#[0-9A-Fa-f]{6}$/.test(value)
              ? value
              : '#000000'
          }
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-12 w-14 cursor-pointer rounded-lg border border-line bg-paper p-1"
        />

        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-court focus:ring-2 focus:ring-court/20"
        />
      </div>
    </label>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-line bg-surface-elevated p-5">
      <span>
        <span className="block text-sm font-bold">
          {label}
        </span>
        <span className="mt-1 block text-xs text-muted">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-5 w-5 accent-court"
      />
    </label>
  )
}

function SaveButton({
  saving,
}: {
  saving: boolean
}) {
  return (
    <div className="flex justify-end border-t border-line pt-5">
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-court px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
