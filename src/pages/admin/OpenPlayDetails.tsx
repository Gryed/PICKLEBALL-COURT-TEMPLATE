
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  createGuestOpenPlayParticipation,
  getOpenPlaySession,
  joinOpenPlaySession,
} from '../../services/openPlayService'
import type {
  OpenPlayParticipant,
  OpenPlaySessionPublic,
} from '../../types/openPlay'

export default function OpenPlayDetails() {
  const { sessionId } = useParams()
  const { user, username } = useAuth()

  const [session, setSession] =
    useState<OpenPlaySessionPublic | null>(null)

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [showJoinForm, setShowJoinForm] =
    useState(false)

  const [guestMode, setGuestMode] =
    useState(false)

  const [guestAccessToken, setGuestAccessToken] =
    useState<string | null>(null)

  const [participantName, setParticipantName] =
    useState('')

  const [contactPhone, setContactPhone] =
    useState('')

  const [participant, setParticipant] =
    useState<OpenPlayParticipant | null>(null)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  useEffect(() => {
    if (
      username &&
      !guestMode &&
      !participantName
    ) {
      setParticipantName(username)
    }
  }, [
    username,
    participantName,
    guestMode,
  ])

  async function loadSession() {
    if (!sessionId) {
      setError(
        'Open Play session was not found.'
      )
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data =
        await getOpenPlaySession(sessionId)

      setSession(data)
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

  function handleJoinClick() {
    setError(null)

    if (!user) {
      setGuestMode(true)
      setParticipantName('')
      setContactPhone('')
      setShowJoinForm(true)
      return
    }

    setGuestMode(false)
    setParticipantName(username ?? '')
    setContactPhone('')
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

    const phone =
      contactPhone.trim()

    if (!name) {
      setError(
        'Participant name is required.'
      )
      return
    }

    if (guestMode && !phone) {
      setError(
        'Contact number is required.'
      )
      return
    }

    try {
      setJoining(true)
      setError(null)

      if (guestMode) {
        const result =
          await createGuestOpenPlayParticipation({
            session_id: sessionId,
            guest_name: name,
            guest_contact_phone: phone,
          })

        setParticipant(
          result.participant
        )

        setGuestAccessToken(
          result.access_token
        )

        setShowJoinForm(false)

        sessionStorage.setItem(
          `open-play-guest-token:${result.participant.id}`,
          result.access_token,
        )

        return
      }

      const result =
        await joinOpenPlaySession({
          session_id: sessionId,
          participant_name: name,
          contact_phone:
            phone || null,
        })

      setParticipant(result)
      setGuestAccessToken(null)
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
              â† Back to Open Play
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
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-10">

        <div className="mb-6">
          <Link
            to="/open-play"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-court"
          >
            â† Back to Open Play
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm font-medium text-red-400">
              {error}
            </p>
          </div>
        )}

        <div className="pr-card overflow-hidden">

          <div className="border-b border-line p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-court">
                  Open Play
                </p>

                <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                  {session.title}
                </h1>

                {session.session_reference && (
                  <p className="mt-2 text-sm text-muted">
                    Reference:{' '}
                    <span className="font-semibold text-ink">
                      {session.session_reference}
                    </span>
                  </p>
                )}
              </div>

              <div className="inline-flex w-fit rounded-full border border-court/20 bg-court/10 px-3 py-1.5 text-xs font-semibold text-court">
                {session.status === 'open'
                  ? 'Open'
                  : session.status}
              </div>

            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">

            <div className="rounded-xl border border-line p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Date
              </p>

              <p className="mt-2 text-base font-semibold text-ink">
                {formatDate(
                  session.session_date
                )}
              </p>
            </div>

            <div className="rounded-xl border border-line p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Time
              </p>

              <p className="mt-2 text-base font-semibold text-ink">
                {formatTime(
                  session.start_time
                )}{' '}
                â€“{' '}
                {formatTime(
                  session.end_time
                )}
              </p>
            </div>

            <div className="rounded-xl border border-line p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Price per Player
              </p>

              <p className="mt-2 text-base font-semibold text-ink">
                â‚±
                {Number(
                  session.price_per_player
                ).toLocaleString(
                  'en-PH',
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </p>
            </div>

            <div className="rounded-xl border border-line p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Capacity
              </p>

              <p className="mt-2 text-base font-semibold text-ink">
                {session.capacity} players
              </p>
            </div>

          </div>

          {(session.description ||
            session.rules) && (
            <div className="space-y-6 border-t border-line p-6 sm:p-8">

              {session.description && (
                <div>
                  <h2 className="text-sm font-bold text-ink">
                    About this Open Play
                  </h2>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                    {session.description}
                  </p>
                </div>
              )}

              {session.rules && (
                <div>
                  <h2 className="text-sm font-bold text-ink">
                    Rules
                  </h2>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                    {session.rules}
                  </p>
                </div>
              )}

            </div>
          )}

          {(registrationOpens ||
            registrationCloses) && (
            <div className="border-t border-line p-6 sm:p-8">

              <h2 className="text-sm font-bold text-ink">
                Registration
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                {registrationOpens && (
                  <div className="rounded-xl border border-line p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Opens
                    </p>

                    <p className="mt-1 text-sm font-semibold text-ink">
                      {registrationOpens}
                    </p>
                  </div>
                )}

                {registrationCloses && (
                  <div className="rounded-xl border border-line p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Closes
                    </p>

                    <p className="mt-1 text-sm font-semibold text-ink">
                      {registrationCloses}
                    </p>
                  </div>
                )}

              </div>

            </div>
          )}

          <div className="border-t border-line p-6 sm:p-8">

            {participant ? (
              <div className="rounded-2xl border border-court/20 bg-court/5 p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-court/15 text-lg text-court">
                    âœ“
                  </div>

                  <div className="min-w-0 flex-1">

                    <h2 className="text-lg font-bold text-ink">
                      You joined this Open Play
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      Your spot is currently held.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Participant
                        </p>

                        <p className="mt-1 text-sm font-semibold text-ink">
                          {participant.participant_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Status
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-ink">
                          {participant.status}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Amount Due
                        </p>

                        <p className="mt-1 text-sm font-semibold text-ink">
                          â‚±
                          {Number(
                            participant.amount_due
                          ).toLocaleString(
                            'en-PH',
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>

                      {participant.hold_expires_at && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Hold Expires
                          </p>

                          <p className="mt-1 text-sm font-semibold text-ink">
                            {formatDateTime(
                              participant.hold_expires_at
                            ) ?? 'â€”'}
                          </p>
                        </div>
                      )}

                    </div>

                    {guestMode &&
                      guestAccessToken && (
                        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">

                          <p className="text-sm font-bold text-ink">
                            Save your guest access
                            token
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted">
                            Keep this token safe. It will
                            be used for future guest
                            access to your participation.
                          </p>

                          <div className="mt-3 break-all rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink">
                            {guestAccessToken}
                          </div>

                        </div>
                      )}

                  </div>

                </div>

              </div>
            ) : showJoinForm ? (
              <div className="rounded-2xl border border-line p-6">

                <div className="mb-6">
                  <h2 className="text-lg font-bold text-ink">
                    {guestMode
                      ? 'Join as Guest'
                      : 'Join Open Play'}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    {guestMode
                      ? 'Enter your details below to reserve your spot without creating an account.'
                      : 'Confirm your participant details to reserve your spot.'}
                  </p>
                </div>

                <form
                  onSubmit={handleJoin}
                  className="space-y-5"
                >

                  <div>
                    <label
                      htmlFor="participant-name"
                      className="block text-sm font-semibold text-ink"
                    >
                      Participant Name
                    </label>

                    <input
                      id="participant-name"
                      type="text"
                      value={participantName}
                      onChange={(e) =>
                        setParticipantName(
                          e.target.value
                        )
                      }
                      disabled={joining}
                      autoComplete="name"
                      className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-court"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-sm font-semibold text-ink"
                    >
                      Contact Number
                      {guestMode && (
                        <span className="ml-1 text-red-400">
                          *
                        </span>
                      )}
                    </label>

                    <input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) =>
                        setContactPhone(
                          e.target.value
                        )
                      }
                      disabled={joining}
                      autoComplete="tel"
                      className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-court"
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                    <button
                      type="button"
                      onClick={() => {
                        setShowJoinForm(false)
                        setError(null)
                      }}
                      disabled={joining}
                      className="rounded-xl border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-court/30 hover:text-court disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={joining}
                      className="rounded-xl bg-court px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {joining
                        ? 'Joining...'
                        : guestMode
                          ? 'Join as Guest'
                          : 'Join Open Play'}
                    </button>

                  </div>

                </form>

              </div>
            ) : (
              <div>

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-ink">
                    Join this Open Play
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    Reserve your spot for this session.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleJoinClick}
                  disabled={
                    joining ||
                    session.status !== 'open'
                  }
                  className="inline-flex w-full items-center justify-center rounded-xl bg-court px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {session.status === 'open'
                    ? 'Join Open Play'
                    : 'Registration Unavailable'}
                </button>

                {!user && (
                  <p className="mt-3 text-center text-xs text-muted">
                    No account required. You can join
                    as a guest.
                  </p>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  )
}

