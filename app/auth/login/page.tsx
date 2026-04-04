import { redirect } from 'next/navigation'

/** Public customer login disabled for MVP (guest checkout only). Staff: use `/admin/login`. */
export default function LegacyLoginPage() {
  redirect('/')
}
