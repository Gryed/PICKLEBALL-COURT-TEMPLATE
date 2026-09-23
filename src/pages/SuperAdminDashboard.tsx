import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Overview = {
  organization_count: number
  active_organization_count: number
  admin_user_count: number
  customer_user_count: number
  super_admin_count: number
}

type Organization = {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
  member_count: number
}

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      const [overviewResult, organizationsResult] = await Promise.all([
        supabase.rpc('get_super_admin_overview'),
        supabase.rpc('get_super_admin_organizations'),
      ])

      if (overviewResult.error || organizationsResult.error) {
        setError(overviewResult.error?.message ?? organizationsResult.error?.message ?? 'Unable to load platform data.')
        setLoading(false)
        return
      }

      setOverview((overviewResult.data?.[0] as Overview | undefined) ?? null)
      setOrganizations((organizationsResult.data ?? []) as Organization[])
      setLoading(false)
    }

    void load()
  }, [])

  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-court">PickleReserve Platform</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Super Admin</h1>
            <p className="mt-1 text-sm text-muted">Platform-wide administration and tenant management.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/super-admin/organizations" className="text-sm font-medium text-court hover:underline">Manage organizations →</Link>
            <Link to="/admin" className="text-sm font-medium text-court hover:underline">Open client back office →</Link>
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-400">{error}</div>}

        {loading ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">Loading platform data...</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Organizations', overview?.organization_count ?? 0],
                ['Active', overview?.active_organization_count ?? 0],
                ['Admins', overview?.admin_user_count ?? 0],
                ['Customers', overview?.customer_user_count ?? 0],
                ['Super Admins', overview?.super_admin_count ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-line bg-surface p-5">
                  <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
                </div>
              ))}
            </div>

            <section className="mt-8 rounded-2xl border border-line bg-surface">
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-display text-lg font-semibold text-ink">Organizations</h2>
                <p className="mt-1 text-xs text-muted">Facilities currently registered on the platform.</p>
              </div>

              <div className="divide-y divide-line">
                {organizations.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-muted">No organizations found.</div>
                ) : organizations.map((organization) => (
                  <div key={organization.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-ink">{organization.name}</p>
                      <p className="text-xs text-muted">{organization.slug}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>{organization.member_count} members</span>
                      <span className="rounded-full border border-line px-2 py-1 uppercase tracking-wide">{organization.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
