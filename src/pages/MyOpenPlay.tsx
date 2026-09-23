import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  cancelOpenPlayParticipation,
  getMyOpenPlayParticipations,
} from '../services/openPlayService'

interface MyOpenPlayParticipation {
  id: string
  session_id: string
  participant_name: string
  participant_status: string
  amount_due: number
  hold_expires_at: string | null
  rejection_reason: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  session_reference: string
  session_title: string
  court_name: string
  session_date: string
  start_time: string
  end_time: string
  session_status: string
  payment_status: string | null
  payment_submitted_at: string | null
  payment_rejection_reason: string | null
}

export default function MyOpenPlay() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<MyOpenPlayParticipation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/login?redirect=/my-open-play')
      return
    }

    loadParticipations()
  }, [user, authLoading])

  async function loadParticipations() {
    try {
      setLoading(true)
      setError('')
      const data = await getMyOpenPlayParticipations()
      setItems(data as unknown as MyOpenPlayParticipation[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Open Play participation.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(item: MyOpenPlayParticipation) {
    const reason = window.prompt('Optional cancellation reason:')
    if (reason === null) return

    if (!window.confirm(`Cancel your spot for ${item.session_title}?`)) return

    try {
      setCancellingId(item.id)
      setError('')
      await cancelOpenPlayParticipation({
        participant_id: item.id,
        cancellation_reason: reason.trim() || null,
      })
      await loadParticipations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel Open Play participation.')
    } finally {
      setCancellingId(null)
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`))
  }

  function formatTime(value: string) {
    const [hours, minutes] = value.split(':').map(Number)
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

  function statusClass(status: string) {
    const classes: Record<string, string> = {
      held: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
      pending: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
      confirmed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
      rejected: 'border-red-400/30 bg-red-400/10 text-red-300',
      cancelled: 'border-line bg-line/50 text-muted',
      expired: 'border-line bg-line/50 text-muted',
    }
    return classes[status] ?? 'border-line bg-line/50 text-muted'
  }

  function paymentLabel(status: string | null) {
    if (status === 'verified') return 'Payment verified'
    if (status === 'rejected') return 'Payment rejected'
    if (status === 'pending') return 'Payment under review'
    return 'Payment not submitted'
  }

  const cancellable = (status: string) =>
    status === 'held' || status === 'pending' || status === 'confirmed'

  if (authLoading || loading) {
    return (
      <main className="pr-page">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <div className="pr-card p-10 text-center text-sm text-muted">
            Loading your Open Play participation...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pr-page">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-court">
              Open Play
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
              My Open Play
            </h1>
            <p className="mt-2 text-sm text-muted">
              Track your spots, payment status, and cancellations.
            </p>
          </div>

          <Link
            to="/open-play"
            className="inline-flex w-fit rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-court/30 hover:text-court"
          >
            Browse Open Play
          </Link>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="pr-card mt-7 p-10 text-center">
            <p className="text-sm font-medium text-ink">No Open Play participation yet.</p>
            <p className="mt-2 text-sm text-muted">
              Browse available sessions and join one when you&apos;re ready.
            </p>
            <Link
              to="/open-play"
              className="btn-court mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Browse Open Play
            </Link>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            {items.map((item) => (
              <article key={item.id} className="pr-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-court">
                      {item.session_reference}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-ink">
                      {item.session_title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{item.court_name}</p>
                  </div>

                  <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass(item.participant_status)}`}>
                    {item.participant_status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Schedule</p>
                    <p className="mt-1 text-sm text-ink">{formatDate(item.session_date)}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Amount</p>
                    <p className="mt-1 font-display text-lg font-bold text-court">
                      ₱{Number(item.amount_due).toLocaleString('en-PH')}
                    </p>
                    <p className="mt-1 text-xs text-muted">per player</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Payment</p>
                    <p className="mt-1 text-sm font-medium text-ink">{paymentLabel(item.payment_status)}</p>
                    {item.payment_rejection_reason && (
                      <p className="mt-1 text-xs text-red-400">{item.payment_rejection_reason}</p>
                    )}
                  </div>
                </div>

                {item.hold_expires_at && item.participant_status === 'held' && (
                  <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">
                    Your temporary hold expires {formatDateTime(item.hold_expires_at)}.
                  </div>
                )}

                {item.rejection_reason && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                    Participation note: {item.rejection_reason}
                  </div>
                )}

                {item.cancellation_reason && (
                  <div className="mt-4 rounded-xl border border-line bg-paper p-3 text-xs text-muted">
                    Cancellation reason: {item.cancellation_reason}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to={`/open-play/${item.session_id}`}
                    className="text-sm font-semibold text-court hover:underline"
                  >
                    View session →
                  </Link>

                  {cancellable(item.participant_status) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(item)}
                      disabled={cancellingId === item.id}
                      className="text-left text-sm font-semibold text-red-400 hover:underline disabled:opacity-50 sm:text-right"
                    >
                      {cancellingId === item.id ? 'Cancelling...' : 'Cancel my spot'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
