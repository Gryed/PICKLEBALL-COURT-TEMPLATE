import { useOrganization } from '../context/OrganizationContext'

export default function AdminFooter({
  section,
}: {
  section?: string
}) {
  const { organization, loading } = useOrganization()

  const organizationName =
    organization?.name ?? 'Pickleball Court'

  return (
    <footer className="py-6 text-center">
      <p className="text-[10px] text-muted">
        {loading ? 'PICKLEBALL COURT' : organizationName}
        {section ? ` • ${section}` : ''}
      </p>
    </footer>
  )
}
