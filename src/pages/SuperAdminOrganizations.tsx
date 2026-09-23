import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Organization = {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'archived'
  created_at: string
  member_count: number
}

type Member = {
  user_id: string
  username: string | null
  profile_role: string
  member_role: 'owner' | 'admin' | 'staff'
  member_status: 'active' | 'invited' | 'suspended'
  created_at: string
}

const emptyForm = { name: '', slug: '', status: 'active' as Organization['status'] }

export default function SuperAdminOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [memberUsername, setMemberUsername] = useState('')
  const [memberRole, setMemberRole] = useState<Member['member_role']>('admin')

  const selected = useMemo(
    () => organizations.find((organization) => organization.id === selectedId) ?? null,
    [organizations, selectedId],
  )

  async function loadOrganizations(selectFirst = false) {
    setLoading(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('get_super_admin_organizations')
    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }
    const rows = (data ?? []) as Organization[]
    setOrganizations(rows)
    if (selectFirst && rows.length > 0) setSelectedId(rows[0].id)
    setLoading(false)
  }

  async function loadMembers(organizationId: string) {
    setMembersLoading(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('get_super_admin_organization_members', {
      p_organization_id: organizationId,
    })
    if (rpcError) setError(rpcError.message)
    else setMembers((data ?? []) as Member[])
    setMembersLoading(false)
  }

  useEffect(() => { void loadOrganizations(true) }, [])
  useEffect(() => { if (selectedId) void loadMembers(selectedId) }, [selectedId])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setNotice('')
    setError('')
  }

  function startEdit(organization: Organization) {
    setEditingId(organization.id)
    setForm({ name: organization.name, slug: organization.slug, status: organization.status })
    setNotice('')
    setError('')
  }

  async function saveOrganization(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const result = editingId
      ? await supabase.rpc('super_admin_update_organization', {
          p_organization_id: editingId,
          p_name: form.name,
          p_slug: form.slug,
          p_status: form.status,
        })
      : await supabase.rpc('super_admin_create_organization', {
          p_name: form.name,
          p_slug: form.slug,
        })

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    const organization = (result.data as Organization | null)
    setNotice(editingId ? 'Organization updated.' : 'Organization created.')
    setSaving(false)
    setEditingId(null)
    setForm(emptyForm)
    await loadOrganizations()
    if (organization?.id) setSelectedId(organization.id)
  }

  async function assignMember(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !memberUsername.trim()) return
    setSaving(true)
    setError('')
    setNotice('')

    const { data: profiles, error: profileError } = await supabase.rpc('super_admin_find_admin_by_username', {
      p_username: memberUsername.trim(),
    })
    const profile = (profiles?.[0] as { id: string } | undefined) ?? null

    if (profileError || !profile) {
      setError(profileError?.message ?? 'Admin username not found.')
      setSaving(false)
      return
    }

    const { error: rpcError } = await supabase.rpc('super_admin_upsert_organization_member', {
      p_organization_id: selectedId,
      p_user_id: profile.id,
      p_member_role: memberRole,
    })

    if (rpcError) setError(rpcError.message)
    else {
      setMemberUsername('')
      setNotice('Organization member saved.')
      await loadMembers(selectedId)
      await loadOrganizations()
    }
    setSaving(false)
  }

  async function toggleMember(member: Member) {
    if (!selectedId) return
    const nextStatus = member.member_status === 'active' ? 'suspended' : 'active'
    setSaving(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('super_admin_set_organization_member_status', {
      p_organization_id: selectedId,
      p_user_id: member.user_id,
      p_status: nextStatus,
    })
    if (rpcError) setError(rpcError.message)
    else await loadMembers(selectedId)
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/super-admin" className="text-xs font-semibold uppercase tracking-[0.2em] text-court hover:underline">← Platform Dashboard</Link>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Organizations</h1>
            <p className="mt-1 text-sm text-muted">Manage client facilities and their back-office membership.</p>
          </div>
          <button onClick={startCreate} className="rounded-xl bg-court px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">+ New organization</button>
        </div>

        {(error || notice) && (
          <div className={`mb-6 rounded-xl border p-4 text-sm ${error ? 'border-red-400/30 bg-red-400/5 text-red-400' : 'border-court/30 bg-court/5 text-court'}`}>
            {error || notice}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
          <section className="rounded-2xl border border-line bg-surface">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">Client facilities</h2>
            </div>
            {loading ? <div className="p-6 text-sm text-muted">Loading organizations...</div> : (
              <div className="divide-y divide-line">
                {organizations.map((organization) => (
                  <button key={organization.id} onClick={() => setSelectedId(organization.id)} className={`w-full px-5 py-4 text-left transition ${selectedId === organization.id ? 'bg-court/5' : 'hover:bg-paper'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-ink">{organization.name}</p>
                        <p className="mt-1 text-xs text-muted">{organization.slug}</p>
                      </div>
                      <span className="rounded-full border border-line px-2 py-1 text-[10px] uppercase tracking-wide text-muted">{organization.status}</span>
                    </div>
                    <p className="mt-3 text-xs text-muted">{organization.member_count} active member{organization.member_count === 1 ? '' : 's'}</p>
                  </button>
                ))}
                {!organizations.length && <div className="p-6 text-sm text-muted">No organizations found.</div>}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <form onSubmit={saveOrganization} className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-display text-lg font-semibold text-ink">{editingId ? 'Edit organization' : 'Create organization'}</h2>
              <div className="mt-4 space-y-4">
                <label className="block text-sm text-muted">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-court" /></label>
                <label className="block text-sm text-muted">Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-court" placeholder="client-facility-name" /></label>
                {editingId && <label className="block text-sm text-muted">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Organization['status'] })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-court"><option value="active">Active</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select></label>}
                <div className="flex gap-2"><button disabled={saving} className="rounded-xl bg-court px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create organization'}</button>{editingId && <button type="button" onClick={startCreate} className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted">Cancel</button>}</div>
              </div>
            </form>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-display text-lg font-semibold text-ink">Organization members</h2><p className="mt-1 text-xs text-muted">{selected ? selected.name : 'Select an organization first.'}</p></div>
                {selected && <button onClick={() => startEdit(selected)} className="text-xs font-medium text-court hover:underline">Edit</button>}
              </div>
              {selected ? <>
                <form onSubmit={assignMember} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input required value={memberUsername} onChange={(event) => setMemberUsername(event.target.value)} placeholder="Admin username" className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-court" />
                  <select value={memberRole} onChange={(event) => setMemberRole(event.target.value as Member['member_role'])} className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-court"><option value="admin">Admin</option><option value="owner">Owner</option><option value="staff">Staff</option></select>
                  <button disabled={saving} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Assign</button>
                </form>
                <div className="mt-4 divide-y divide-line">
                  {membersLoading ? <div className="py-4 text-sm text-muted">Loading members...</div> : members.length ? members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between gap-3 py-3">
                      <div><p className="text-sm font-medium text-ink">{member.username ?? member.user_id.slice(0, 8)}</p><p className="text-xs text-muted">{member.member_role} · {member.member_status}</p></div>
                      <button disabled={saving} onClick={() => void toggleMember(member)} className="text-xs text-muted hover:text-ink">{member.member_status === 'active' ? 'Suspend' : 'Activate'}</button>
                    </div>
                  )) : <div className="py-4 text-sm text-muted">No members assigned.</div>}
                </div>
              </> : <div className="mt-5 rounded-xl border border-dashed border-line p-5 text-sm text-muted">Select a client facility to manage its back-office members.</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
