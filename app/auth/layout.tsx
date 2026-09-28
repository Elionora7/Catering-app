import { noIndexMetadata } from '@/lib/noIndexMetadata'

export const metadata = noIndexMetadata

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
