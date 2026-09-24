import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, username, signOut } = useAuth()
  const { organization, branding, loading, error } = useOrganization()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  const organizationName =
    organization?.name ?? 'Pickleball Court'

  const logoUrl =
    branding?.logo_url ?? '/images/alexxamie-hero.jpg'

  const organizationParts = organizationName.split(' ')
  const displayName =
    organizationParts.length > 1
      ? organizationParts.slice(0, -2).join(' ') ||
        organizationParts[0]
      : organizationName

  const displaySubtitle =
    organizationParts.length > 1
      ? organizationParts.slice(-2).join(' ')
      : 'COURT RESERVATION'

  if (error) {
    console.error('Organization configuration error:', error)
  }

  return (
    <nav className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src={logoUrl}
            alt={organizationName}
            className="h-9 w-9 rounded-xl object-cover"
          />

          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-tight text-ink sm:text-base">
              {loading ? 'Loading...' : displayName}
            </p>

            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[10px]">
              {loading ? 'COURT RESERVATION' : displaySubtitle}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link
            to="/open-play"
            className="text-muted transition-colors hover:text-court"
          >
            Open Play
          </Link>

          {user ? (
            <>
              <span className="hidden text-ink sm:inline">
                Hi! {username ?? 'there'}
              </span>

              <NotificationBell userId={user.id} />

              <Link
                to="/my-bookings"
                className="text-muted transition-colors hover:text-court"
              >
                My bookings
              </Link>

              <Link
                to="/my-open-play"
                className="text-muted transition-colors hover:text-court"
              >
                My Open Play
              </Link>

              <Link
                to="/find-booking"
                className="text-muted transition-colors hover:text-court"
              >
                Find booking
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-muted transition-colors hover:text-court"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/find-booking"
              className="text-muted transition-colors hover:text-court"
            >
              Find booking
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
