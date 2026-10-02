import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { createGuestOpenPlaySession } from '../services/openPlayService'
import { supabase } from '../lib/supabase'

type CourtOption = {
  id: string
  name: string
  price_per_hour: number
  status: string
  organization_id: string
}

export default function CreateOpenPlay() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [error, setError] = useState('')

  const [hostName, setHostName] = useState('')
  const [hostContactPhone, setHostContactPhone] = useState('')

  const [courts, setCourts] = useState<CourtOption[]>([])

  const [title, setTitle] = useState('')
  const [courtId, setCourtId] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [pricePerPlayer, setPricePerPlayer] = useState('')
  const [capacity, setCapacity] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')

  const selectedCourt = useMemo(
    () => courts.find((court) => court.id === courtId),
    [courts, courtId],
  )

  useEffect(() => {
    let mounted = true

    async function loadCourts() {
      setLoadingCourts(true)
      setError('')

      const { data, error } = await supabase
        .from('courts')
        .select('id, name, price_per_hour, status, organization_id')
        .eq('status', 'available')
        .order('name')

      if (!mounted) return

      if (error) {
        console.error('Error loading courts:', error)
        setError('Unable to load available courts.')
        setCourts([])
      } else {
        setCourts((data ?? []) as CourtOption[])
      }

      setLoadingCourts(false)
    }

    loadCourts()

    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!hostName.trim()) {
      setError('Please enter the host name.')
      return
    }

    if (!hostContactPhone.trim()) {
      setError('Please enter a contact phone number.')
      return
    }

    if (!title.trim()) {
      setError('Please enter an Open Play title.')
      return
    }

    if (!courtId) {
      setError('Please select a court.')
      return
    }

    if (!sessionDate) {
      setError('Please select a session date.')
      return
    }

    if (!startTime || !endTime) {
      setError('Please select the start and end time.')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be later than start time.')
      return
    }

    const [, startMinute] = startTime.split(':').map(Number)
    const [, endMinute] = endTime.split(':').map(Number)

    if (startMinute !== 0 || endMinute !== 0) {
      setError(
        'Open Play sessions must start and end on whole-hour times.',
      )
      return
    }

    if (!pricePerPlayer.trim()) {
  setError('Please enter the price per player.')
  return
}

if (!capacity.trim()) {
  setError('Please enter the player capacity.')
  return
}

const price = Number(pricePerPlayer)
const playerCapacity = Number(capacity)

if (!Number.isFinite(price) || price < 0) {
  setError('Price per player must be zero or greater.')
  return
}

if (!Number.isInteger(playerCapacity) || playerCapacity < 1) {
  setError('Capacity must be at least 1 player.')
  return
}

    try {
      setLoading(true)

      const session = await createGuestOpenPlaySession({
        host_name: hostName.trim(),
        host_contact_phone: hostContactPhone.trim(),
        title: title.trim(),
        court_id: courtId,
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        price_per_player: price,
        capacity: playerCapacity,
        description: description.trim() || null,
        rules: rules.trim() || null,
        registration_opens_at: null,
        registration_closes_at: null,
      })

      navigate(`/open-play/${session.id}`)
    } catch (err) {
      console.error('Error creating customer Open Play:', err)

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to create Open Play session.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/open-play')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink"
        >
          ←
          Back to Open Play
        </button>

        <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
          <div className="border-b border-line bg-surface px-6 py-7 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                🏆
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                  Community Game
                </p>
                <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
                  Create Open Play
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  Create a game, choose an available court, and invite
                  other players to join your session.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7 p-6 sm:p-8">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-ink">
                  Host Name
                </label>

                <input
                  value={hostName}
                  onChange={(event) => setHostName(event.target.value)}
                  placeholder="Your name"
                  maxLength={120}
                  autoComplete="name"
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-ink">
                  Contact Phone
                </label>

                <input
                  type="tel"
                  value={hostContactPhone}
                  onChange={(event) =>
                    setHostContactPhone(event.target.value)
                  }
                  placeholder="09XXXXXXXXX"
                  maxLength={30}
                  autoComplete="tel"
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-ink">
                Game Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Saturday Morning Open Play"
                maxLength={120}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                🏆
                Court
              </label>

              <select
                value={courtId}
                onChange={(event) => setCourtId(event.target.value)}
                disabled={loadingCourts}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {loadingCourts
                    ? 'Loading available courts...'
                    : 'Select a court'}
                </option>

                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>

              {selectedCourt && (
                <p className="mt-2 text-xs text-muted">
                  Court rate: ₱
                  {Number(selectedCourt.price_per_hour).toLocaleString()}
                  /hour
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  📅
                  Date
                </label>

                <input
                  type="date"
                  value={sessionDate}
                  onChange={(event) => setSessionDate(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  🕐
                  Start
                </label>

                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  step="3600"
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  🕐
                  End
                </label>

                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  step="3600"
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  👥
                  Price per Player
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pricePerPlayer}
                  onChange={(event) =>
                    setPricePerPlayer(event.target.value)
                  }
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  👥
                  Player Capacity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={capacity}
                  onChange={(event) =>
                    setCapacity(event.target.value)
                  }
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-ink">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell players what this session is about..."
                rows={4}
                maxLength={1000}
                className="w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-ink">
                Rules / Notes
              </label>

              <textarea
                value={rules}
                onChange={(event) => setRules(event.target.value)}
                placeholder="Optional rules, skill level, equipment notes, etc."
                rows={4}
                maxLength={1000}
                className="w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/open-play')}
                disabled={loading}
                className="rounded-2xl border border-line px-5 py-3 text-sm font-bold text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-court inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3 text-sm font-black shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-court/20 active:translate-y-0"
              >
                {loading ? 'Creating...' : 'Create Open Play'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}







