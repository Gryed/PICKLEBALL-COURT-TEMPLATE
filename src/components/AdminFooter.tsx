
import { useOrganization } from '../context/OrganizationContext'

export default function AdminFooter({
  section,
}: {
  section?: string
}) {
  const {
    organization,
    selectedAdminOrganization,
    loading,
  } = useOrganization()

  const organizationName =
    selectedAdminOrganization?.organization_name ??
    organization?.name ??
    'Pickleball Court'

  return (
    <footer className="py-6 text-center">
      <p className="text-[10px] text-muted">
        {loading ? 'PICKLEBALL COURT' : organizationName}
        {section ? ` • ${section}` : ''}
      </p>
    </footer>
  )
}
