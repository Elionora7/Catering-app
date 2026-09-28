import { AdminShell } from '@/components/AdminShell'
import { noIndexMetadata } from '@/lib/noIndexMetadata'

export const metadata = noIndexMetadata

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
