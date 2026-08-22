// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/account/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url')
    .eq('id', user.id)
    .single()

  return <ProfileClient profile={profile} userId={user.id} />
}
