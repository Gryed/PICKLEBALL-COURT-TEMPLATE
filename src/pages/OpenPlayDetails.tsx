import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getMyOpenPlayParticipations,
  getOpenPlaySession,
  joinOpenPlaySession,
} from '../services/openPlayService'
import { getPublicBookingSettings } from '../services/courtService'
import OpenPlayPaymentForm from '../components/OpenPlayPaymentForm'
import type {
  OpenPlayParticipant,
  OpenPlaySessionPublic,
} from '../types/openPlay'

export default function OpenPlayDetails() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user, username } = useAuth()

  const [session, setSession] =
    useState<OpenPlaySessionPublic | null>(null)

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [showJoinForm, setShowJoinForm] =
    useState(false)

  const [participantName, setParticipantName] =
    useState('')

  const [contactPhone, setContactPhone] =
    useState('')

  const [participant, setParticipant] =
    useState<OpenPlayParticipant | null>(null)

  const [bookingSettings, setBookingSettings] =
    useState<Awaited<ReturnType<typeof getPublicBookingSettings>> | null>(null)

  const [paymentStatus, setPaymentStatus] =
    useState<'pending' | 'verified' | 'rejected' | null>(null)

  const [paymentRejectionReason, setPaymentRejectionReason] =
    useState<string | null>(null)

  const [holdSecondsRemaining, setHoldSecondsRemaining] =
    useState<number | null>(null)

  useEffect(() => {
    loadSession()
  }, [sessionId, user?.id])

  useEffect(() => {
    if (username && !participantName) {
      setParticipantName(username)
    }
  }, [username, participantName])

  useEffect(() => {
    if (
      !participant ||
      participant.status !== 'held' ||
      !participant.hold_expires_at
    ) {
      setHoldSecondsRemaining(null)
      return
    }

    const expiresAt = new Date(
      participant.hold_expires_at
    ).getTime()

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((expiresAt - Date.now()) / 1000)
      )

      setHoldSecondsRemaining(remaining)
    }

    updateCountdown()

    const timer = window.setInterval(
      updateCountdown,
      1000
    )

    return () => {
      window.clearInterval(timer)
    }
  }, [
    participant?.status,
    participant?.hold_expires_at,
  ])

  async function loadSession() {
    if (!sessionId) {
      setError('Open Play session was not found.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await getOpenPlaySession(sessionId)

      if (!data) {
        throw new Error('Open Play session was not found.')
      }

      setSession(data)

      const settings = await getPublicBookingSettings(
        data.court_id
      )

      setBookingSettings(settings)

      if (user) {
        const rows = await getMyOpenPlayParticipations()

        const row = rows.find(
          (item) => String(item.session_id) === sessionId
        )

        if (row) {
          const restoredParticipant: OpenPlayParticipant = {
            id: String(row.id),
            session_id: String(row.session_id),
            user_id: String(row.user_id),
            participant_name: String(row.participant_name ?? ''),
            contact_phone:
              row.contact_phone == null
                ? null
                : String(row.contact_phone),
            guest_name: null,
            guest_contact_phone: null,
            guest_access_token_hash: null,
            status:
              String(row.participant_status) as OpenPlayParticipant['status'],
            amount_due: Number(row.amount_due),
            hold_expires_at:
              row.hold_expires_at == null
                ? null
                : String(row.hold_expires_at),
            rejection_reason:
              row.rejection_reason == null
                ? null
                : String(row.rejection_reason),
            cancelled_at:
              row.cancelled_at == null
                ? null
                : String(row.cancelled_at),
            cancelled_by:
              row.cancelled_by == null
                ? null
                : String(row.cancelled_by),
            cancellation_reason:
              row.cancellation_reason == null
                ? null
                : String(row.cancellation_reason),
            created_at: String(row.participant_created_at),
            updated_at: String(row.participant_updated_at),
          }

          setParticipant(restoredParticipant)

          setPaymentStatus(
            row.payment_status == null
              ? null
              : String(row.payment_status) as
                  | 'pending'
                  | 'verified'
                  | 'rejected'
          )

          setPaymentRejectionReason(
            row.payment_rejection_reason == null
              ? null
              : String(row.payment_rejection_reason)
          )
        } else {
          setParticipant(null)
          setPaymentStatus(null)
          setPaymentRejectionReason(null)
        }
      }
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load Open Play session.'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(
      new Date(`${date}T00:00:00`)
    )
  }

  function formatTime(time: string) {
    const [hours, minutes] =
      time.split(':').map(Number)

    const date = new Date()

    date.setHours(
      hours,
      minutes,
      0,
      0
    )

    return new Intl.DateTimeFormat('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  function formatDateTime(
    value: string | null
  ) {
    if (!value) {
      return null
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return null
    }

    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  function formatCountdown(
    totalSeconds: number
  ) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`
  }

  async function refreshParticipation() {
    if (!user || !sessionId) {
      return
    }

    try {
      setError(null)

      const rows = await getMyOpenPlayParticipations()

      const row = rows.find(
        (item) => String(item.session_id) === sessionId
      )

      if (!row) {
        setParticipant(null)
        setPaymentStatus(null)
        setPaymentRejectionReason(null)
        return
      }

      setParticipant({
        id: String(row.id),
        session_id: String(row.session_id),
        user_id: String(row.user_id),
        participant_name: String(row.participant_name ?? ''),
        contact_phone:
          row.contact_phone == null
            ? null
            : String(row.contact_phone),
        guest_name: null,
        guest_contact_phone: null,
        guest_access_token_hash: null,
        status:
          String(row.participant_status) as OpenPlayParticipant['status'],
        amount_due: Number(row.amount_due),
        hold_expires_at:
          row.hold_expires_at == null
            ? null
            : String(row.hold_expires_at),
        rejection_reason:
          row.rejection_reason == null
            ? null
            : String(row.rejection_reason),
        cancelled_at:
          row.cancelled_at == null
            ? null
            : String(row.cancelled_at),
        cancelled_by:
          row.cancelled_by == null
            ? null
            : String(row.cancelled_by),
        cancellation_reason:
          row.cancellation_reason == null
            ? null
            : String(row.cancellation_reason),
        created_at: String(row.participant_created_at),
        updated_at: String(row.participant_updated_at),
      })

      setPaymentStatus(
        row.payment_status == null
          ? null
          : String(row.payment_status) as
              | 'pending'
              | 'verified'
              | 'rejected'
      )

      setPaymentRejectionReason(
        row.payment_rejection_reason == null
          ? null
          : String(row.payment_rejection_reason)
      )
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to refresh your Open Play status.'
      )
    }
  }

  function handleJoinClick() {
    if (!user) {
      navigate(
        `/login?redirect=/open-play/${sessionId}`
      )
      return
    }

    setParticipantName(
      username ?? ''
    )

    setShowJoinForm(true)
  }

  async function handleJoin(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!sessionId) {
      return
    }

    const name =
      participantName.trim()

    if (!name) {
      setError(
        'Participant name is required.'
      )
      return
    }

    try {
      setJoining(true)
      setError(null)

      const result =
        await joinOpenPlaySession({
          session_id: sessionId,
          participant_name: name,
          contact_phone:
            contactPhone.trim() || null,
        })

      setParticipant(result)
      setPaymentStatus(null)
      setPaymentRejectionReason(null)
      setShowJoinForm(false)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to join Open Play session.'
      )
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <main className="pr-page">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <div className="pr-card p-10 text-center">
            <p className="text-sm text-muted">
              Loading Open Play session...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (error && !session) {
    return (
      <main className="pr-page">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <div className="pr-card p-8 text-center">
            <p className="text-sm font-medium text-red-400">
              {error}
            </p>

            <Link
              to="/open-play"
              className="mt-5 inline-flex rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-court/30 hover:text-court"
            >
              ← Back to Open Play
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!session) {
    return null
  }

  const registrationOpens =
    formatDateTime(
      session.registration_opens_at
    )

  const registrationCloses =
    formatDateTime(
      session.registration_closes_at
    )

  return (
    <main className="pr-page">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">

        {/* BACK */}
        <Link
          to="/open-play"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-court"
        >
          ← Back to Open Play
        </Link>

        {/* HEADER */}
        <section className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-court">
                {session.session_reference}
              </p>

              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {session.title}
              </h1>

              <p className="mt-2 text-sm text-muted">
                {session.court_name}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${session.spots_remaining === 0 ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-court/20 bg-court/10 text-court'}`}>
                {session.spots_remaining === 0 ? 'Full' : session.status}
              </span>
              <span className="text-xs font-semibold text-muted">
                {session.spots_remaining === 0 ? 'No spots remaining' : `${session.spots_remaining} spot${session.spots_remaining === 1 ? '' : 's'} remaining`}
              </span>
            </div>
          </div>
        </section>

        {/* MAIN CARD */}
        <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_300px]">

          {/* DETAILS */}
          <div className="pr-card p-6 sm:p-7">

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                  Date
                </p>

                <p className="mt-1.5 text-sm font-medium text-ink">
                  {formatDate(
                    session.session_date
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                  Time
                </p>

                <p className="mt-1.5 text-sm font-medium text-ink">
                  {formatTime(
                    session.start_time
                  )}{' '}
                  –{' '}
                  {formatTime(
                    session.end_time
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                  Price
                </p>

                <p className="mt-1.5 font-display text-xl font-bold text-court">
                  ₱
                  {session.price_per_player.toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-muted">
                    / player
                  </span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                  Capacity
                </p>

                <p className="mt-1.5 text-sm font-medium text-ink">
                  {session.capacity} players
                </p>
              </div>
            </div>

            {session.description && (
              <div className="mt-7 border-t border-line pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  About this session
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">
                  {session.description}
                </p>
              </div>
            )}

            {session.rules && (
              <div className="mt-6 border-t border-line pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Rules & Guidelines
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">
                  {session.rules}
                </p>
              </div>
            )}

            {(registrationOpens ||
              registrationCloses) && (
              <div className="mt-6 border-t border-line pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Registration Window
                </p>

                <div className="mt-2 space-y-1 text-sm text-ink">
                  {registrationOpens && (
                    <p>
                      Opens:{' '}
                      {registrationOpens}
                    </p>
                  )}

                  {registrationCloses && (
                    <p>
                      Closes:{' '}
                      {registrationCloses}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* JOIN PANEL */}
          <aside className="h-fit pr-card p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              Open Play
            </p>

            <p className="mt-2 font-display text-2xl font-bold text-ink">
              ₱
              {session.price_per_player.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-muted">
              per player
            </p>

            {participant ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-court/20 bg-court/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-court">
                    You're on the list
                  </p>

                  <p className="mt-2 text-sm font-medium text-ink">
                    {participant.participant_name}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Status:{' '}
                    <span className="font-semibold text-court">
                      {participant.status}
                    </span>
                  </p>

                  {participant.hold_expires_at && (
                    <p className="mt-2 text-xs text-muted">
                      Hold expires:{' '}
                      {formatDateTime(
                        participant.hold_expires_at
                      )}
                    </p>
                  )}

                  {participant.status === 'held' &&
                    holdSecondsRemaining !== null && (
                      <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                          Payment hold countdown
                        </p>

                        {holdSecondsRemaining > 0 ? (
                          <>
                            <p className="mt-1 font-display text-2xl font-bold text-amber-200">
                              {formatCountdown(
                                holdSecondsRemaining
                              )}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-100/70">
                              Complete your payment before the
                              countdown reaches zero.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-1 font-semibold text-red-300">
                              Payment hold expired
                            </p>

                            <p className="mt-1 text-xs leading-5 text-red-100/70">
                              Your spot may have been released.
                              Refresh the status to check.
                            </p>

                            <button
                              type="button"
                              onClick={refreshParticipation}
                              className="mt-3 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition hover:border-court/30 hover:text-court"
                            >
                              Refresh Status
                            </button>
                          </>
                        )}
                      </div>
                    )}

                  {participant.status === 'held' &&
                    holdSecondsRemaining !== 0 && (
                      <p className="mt-4 text-xs leading-5 text-muted">
                        Your spot is temporarily held.
                        Complete the payment step before
                        the hold expires.
                      </p>
                    )}

                  {participant.status === 'expired' && (
                    <p className="mt-4 text-xs leading-5 text-red-400">
                      Your payment hold has expired and your
                      spot is no longer reserved.
                    </p>
                  )}

                  {participant.status === 'cancelled' && (
                    <p className="mt-4 text-xs leading-5 text-muted">
                      Your participation has been cancelled.
                    </p>
                  )}
                </div>

                {(participant.status === 'held' ||
                  participant.status === 'rejected') &&
                  paymentStatus !== 'pending' &&
                  paymentStatus !== 'verified' &&
                  bookingSettings && (
                    <OpenPlayPaymentForm
                      participant={participant}
                      sessionCourtId={session.court_id}
                      settings={bookingSettings}
                      paymentStatus={paymentStatus}
                      rejectionReason={
                        paymentRejectionReason
                      }
                      onSubmitted={refreshParticipation}
                    />
                  )}

                {paymentStatus === 'pending' && (
                  <OpenPlayPaymentForm
                    participant={participant}
                    sessionCourtId={session.court_id}
                    settings={bookingSettings}
                    paymentStatus="pending"
                    rejectionReason={
                      paymentRejectionReason
                    }
                    onSubmitted={refreshParticipation}
                  />
                )}

                {paymentStatus === 'verified' && (
                  <OpenPlayPaymentForm
                    participant={participant}
                    sessionCourtId={session.court_id}
                    settings={bookingSettings}
                    paymentStatus="verified"
                    rejectionReason={
                      paymentRejectionReason
                    }
                    onSubmitted={refreshParticipation}
                  />
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={
                    handleJoinClick
                  }
                  disabled={session.spots_remaining === 0}
                  className="btn-court mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Join Open Play
                </button>

                <p className="mt-3 text-center text-[10px] leading-5 text-muted">
                  Login is required to join a session.
                </p>
              </>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs leading-5 text-red-400">
                  {error}
                </p>
              </div>
            )}
          </aside>
        </section>
      </div>

      {/* JOIN MODAL */}
      {showJoinForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              if (!joining) {
                setShowJoinForm(false)
              }
            }
          }}
        >
          <div className="w-full max-w-lg rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl">

            <div className="border-b border-line px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-court">
                    Join Open Play
                  </p>

                  <h2 className="mt-1 font-display text-xl font-bold text-ink">
                    {session.title}
                  </h2>

                  <p className="mt-1 text-xs text-muted">
                    Your spot will be held for 15 minutes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowJoinForm(false)
                  }
                  disabled={joining}
                  className="rounded-xl border border-line px-2.5 py-1.5 text-xl leading-none text-muted transition hover:border-court/30 hover:text-ink disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleJoin}
              className="space-y-4 p-5 sm:p-6"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  Participant Name
                </label>

                <input
                  type="text"
                  value={participantName}
                  onChange={(e) =>
                    setParticipantName(
                      e.target.value
                    )
                  }
                  className="pr-input px-3 py-2.5 text-sm"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  Contact Phone
                </label>

                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) =>
                    setContactPhone(
                      e.target.value
                    )
                  }
                  className="pr-input px-3 py-2.5 text-sm"
                  placeholder="09XXXXXXXXX"
                />
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-xs leading-5 text-blue-300">
                  Joining will temporarily hold your
                  Open Play slot for 15 minutes. You
                  will need to complete the payment
                  submission before the hold expires.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setShowJoinForm(false)
                  }
                  disabled={joining}
                  className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={joining}
                  className="btn-court flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joining
                    ? 'Joining...'
                    : 'Confirm Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}