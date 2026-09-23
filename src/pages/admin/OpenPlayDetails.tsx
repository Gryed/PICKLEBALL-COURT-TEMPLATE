import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Court } from '../../types/court'
import type {
  OpenPlayParticipant,
  OpenPlayPayment,
  OpenPlaySession,
} from '../../types/openPlay'
import {
  getAdminOpenPlaySessions,
  getOpenPlayParticipants,
  getOpenPlayPayments,
  rejectOpenPlayPayment,
  verifyOpenPlayPayment,
} from '../../services/openPlayService'
import { getCourts } from '../../services/courtService'

export default function AdminOpenPlayDetails() {
  const { sessionId } = useParams()

  const [session, setSession] = useState<OpenPlaySession | null>(null)
  const [courts, setCourts] = useState<Court[]>([])
  const [participants, setParticipants] = useState<OpenPlayParticipant[]>([])
  const [payments, setPayments] = useState<OpenPlayPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [participantsLoading, setParticipantsLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [sessionId])

  async function loadData() {
    if (!sessionId) {
      setError('Open Play session was not found.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [sessions, courtsData] = await Promise.all([
        getAdminOpenPlaySessions(),
        getCourts(),
      ])

      const foundSession = sessions.find((item) => item.id === sessionId)

      if (!foundSession) {
        setError('Open Play session was not found.')
        setSession(null)
        return
      }

      setSession(foundSession)
      setCourts(courtsData)
      await loadParticipants(sessionId)
    } catch (err) {
      console.error('Failed to load admin Open Play details:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load Open Play session details.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadParticipants(id = sessionId) {
    if (!id) return

    try {
      setParticipantsLoading(true)
      setActionError(null)

      const participantData = await getOpenPlayParticipants(id)
      setParticipants(participantData)

      const paymentData = await getOpenPlayPayments(
        participantData.map((participant) => participant.id),
      )
      setPayments(paymentData)
    } catch (err) {
      console.error('Failed to load Open Play participants:', err)
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to load participants and payments.',
      )
    } finally {
      setParticipantsLoading(false)
    }
  }

  async function handleVerify(payment: OpenPlayPayment) {
    if (!payment.id) return

    try {
      setActionId(payment.id)
      setActionError(null)
      await verifyOpenPlayPayment(payment.id)
      await loadParticipants()
    } catch (err) {
      console.error('Failed to verify Open Play payment:', err)
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to verify payment.',
      )
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(payment: OpenPlayPayment) {
    const reason = window.prompt(
      'Rejection reason (optional):',
      payment.rejection_reason ?? '',
    )

    if (reason === null) return

    try {
      setActionId(payment.id)
      setActionError(null)
      await rejectOpenPlayPayment(payment.id, reason.trim() || null)
      await loadParticipants()
    } catch (err) {
      console.error('Failed to reject Open Play payment:', err)
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to reject payment.',
      )
    } finally {
      setActionId(null)
    }
  }

  function getCourtName(courtId: string) {
    return courts.find((court) => court.id === courtId)?.name ?? 'Unknown Court'
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${date}T00:00:00`))
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    return new Intl.DateTimeFormat('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  function formatDateTime(value: string | null) {
    if (!value) return '—'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  function formatAmount(value: number) {
    return `₱${Number(value).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  function getPaymentForParticipant(participantId: string) {
    return payments.find(
      (payment) => payment.open_play_participant_id === participantId,
    ) ?? null
  }

  function statusClass(status: OpenPlayParticipant['status']) {
    const classes: Record<OpenPlayParticipant['status'], string> = {
      held: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
      pending: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
      confirmed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
      rejected: 'border-red-400/30 bg-red-400/10 text-red-300',
      cancelled: 'border-line bg-line/50 text-muted',
      expired: 'border-line bg-line/50 text-muted',
    }

    return classes[status]
  }

  const counts = useMemo(() => {
    const active = participants.filter(
      (participant) =>
        participant.status !== 'cancelled' &&
        participant.status !== 'expired' &&
        participant.status !== 'rejected',
    ).length

    return {
      active,
      confirmed: participants.filter((participant) => participant.status === 'confirmed').length,
      pending: participants.filter((participant) => participant.status === 'pending').length,
      rejected: participants.filter((participant) => participant.status === 'rejected').length,
    }
  }, [participants])

  if (loading) {
    return (
      <main className="pr-page">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="pr-card p-10 text-center">
            <p className="text-sm text-muted">Loading Open Play session...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !session) {
    return (
      <main className="pr-page">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            to="/admin/open-play"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-court"
          >
            ← Back to Open Play
          </Link>

          <div className="pr-card mt-6 p-8 text-center">
            <p className="text-sm font-medium text-red-400">
              {error ?? 'Open Play session was not found.'}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pr-page">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/admin/open-play"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-court"
        >
          ← Back to Open Play
        </Link>

        <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-court">
              {session.session_reference}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {session.title}
            </h1>
            <p className="mt-2 text-sm text-muted">{getCourtName(session.court_id)}</p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-line bg-line/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {session.status}
          </span>
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <section className="pr-card p-6 sm:p-7">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Date</p>
                  <p className="mt-1.5 text-sm font-medium text-ink">{formatDate(session.session_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Time</p>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {formatTime(session.start_time)} – {formatTime(session.end_time)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Price</p>
                  <p className="mt-1.5 font-display text-xl font-bold text-court">
                    {formatAmount(session.price_per_player)}
                    <span className="ml-1 text-xs font-normal text-muted">/ player</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Capacity</p>
                  <p className="mt-1.5 text-sm font-medium text-ink">{session.capacity} players</p>
                </div>
              </div>

              <div className="mt-7 border-t border-line pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Registration Window</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Opens</p>
                    <p className="mt-1 text-sm text-ink">{formatDateTime(session.registration_opens_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Closes</p>
                    <p className="mt-1 text-sm text-ink">{formatDateTime(session.registration_closes_at)}</p>
                  </div>
                </div>
              </div>

              {session.description && (
                <div className="mt-7 border-t border-line pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Description</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{session.description}</p>
                </div>
              )}

              {session.rules && (
                <div className="mt-6 border-t border-line pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rules & Guidelines</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{session.rules}</p>
                </div>
              )}
            </section>

            <section className="pr-card overflow-hidden">
              <div className="border-b border-line px-6 py-5 sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Participants</p>
                    <h2 className="mt-1 font-display text-xl font-bold text-ink">
                      {counts.active} / {session.capacity} active players
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">{counts.confirmed} confirmed</span>
                    <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-blue-300">{counts.pending} pending</span>
                    <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-red-300">{counts.rejected} rejected</span>
                  </div>
                </div>
                {actionError && (
                  <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
                    {actionError}
                  </div>
                )}
              </div>

              {participantsLoading ? (
                <div className="px-6 py-10 text-center text-sm text-muted">Loading participants...</div>
              ) : participants.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium text-ink">No participants yet.</p>
                  <p className="mt-1 text-xs text-muted">Customers who join this Open Play session will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {participants.map((participant) => {
                    const payment = getPaymentForParticipant(participant.id)
                    const isAction = payment ? actionId === payment.id : false

                    return (
                      <article key={participant.id} className="px-6 py-5 sm:px-7">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-ink">{participant.participant_name}</h3>
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass(participant.status)}`}>
                                {participant.status}
                              </span>
                            </div>
                            <div className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2 sm:gap-x-6">
                              <span>Phone: {participant.contact_phone ?? '—'}</span>
                              <span>Joined: {formatDateTime(participant.created_at)}</span>
                              <span>Amount due: {formatAmount(participant.amount_due)}</span>
                              {participant.hold_expires_at && <span>Hold expires: {formatDateTime(participant.hold_expires_at)}</span>}
                            </div>
                            {participant.rejection_reason && (
                              <p className="mt-3 text-xs text-red-300">Rejection: {participant.rejection_reason}</p>
                            )}
                          </div>

                          <div className="w-full rounded-xl border border-line bg-line/20 p-4 xl:max-w-sm">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Payment</p>
                              <span className="text-sm font-bold text-ink">
                                {payment ? formatAmount(payment.amount) : 'Not submitted'}
                              </span>
                            </div>

                            {payment ? (
                              <>
                                <div className="mt-3 space-y-1 text-xs text-muted">
                                  <p>Method: <span className="text-ink">{payment.payment_method.replace('_', ' ')}</span></p>
                                  <p>Reference: <span className="text-ink">{payment.transaction_reference ?? '—'}</span></p>
                                  <p>Submitted: <span className="text-ink">{formatDateTime(payment.submitted_at)}</span></p>
                                  <p>Status: <span className="font-semibold text-ink">{payment.status}</span></p>
                                </div>

                                {payment.proof_url && (
                                  <a
                                    href={payment.proof_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex text-xs font-semibold text-court hover:underline"
                                  >
                                    View payment proof ↗
                                  </a>
                                )}

                                {payment.rejection_reason && (
                                  <p className="mt-3 text-xs text-red-300">Payment rejection: {payment.rejection_reason}</p>
                                )}

                                {payment.status === 'pending' && (
                                  <div className="mt-4 flex gap-2">
                                    <button
                                      type="button"
                                      disabled={isAction}
                                      onClick={() => handleVerify(payment)}
                                      className="flex-1 rounded-lg bg-court px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isAction ? 'Processing...' : 'Verify'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isAction}
                                      onClick={() => handleReject(payment)}
                                      className="flex-1 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="mt-3 text-xs text-muted">No payment record has been submitted for this participant.</p>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="pr-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Session Info</p>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted">Session ID</dt>
                  <dd className="mt-1 break-all font-mono text-[11px] text-ink">{session.id}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted">Created</dt>
                  <dd className="mt-1 text-sm text-ink">{formatDateTime(session.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted">Last Updated</dt>
                  <dd className="mt-1 text-sm text-ink">{formatDateTime(session.updated_at)}</dd>
                </div>
              </dl>
            </section>

            <section className="pr-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Participation Snapshot</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Active</span>
                  <span className="font-semibold text-ink">{counts.active} / {session.capacity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Confirmed</span>
                  <span className="font-semibold text-emerald-300">{counts.confirmed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Pending payment</span>
                  <span className="font-semibold text-blue-300">{counts.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Rejected</span>
                  <span className="font-semibold text-red-300">{counts.rejected}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
