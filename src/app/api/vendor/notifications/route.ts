import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, is_read, action_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw new Error(error.message)

    const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

    return NextResponse.json({ data: notifications ?? [], unreadCount })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()

    if (body.all) {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      if (error) throw new Error(error.message)
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).in('id', body.ids)
      if (error) throw new Error(error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update notifications' }, { status: 500 })
  }
}
