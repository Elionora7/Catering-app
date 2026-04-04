import { redirect } from 'next/navigation'

/** Public registration disabled for MVP (guest checkout only). */
export default function LegacyRegisterPage() {
  redirect('/')
}
