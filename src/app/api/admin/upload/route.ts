import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/upload  (multipart/form-data: field "file")
 *
 * Admin-only image upload for homepage banners. Verifies the caller is an admin,
 * then stores the file in the public `site-assets` bucket via the service role
 * and returns its public URL.
 */
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

export async function POST(request: NextRequest) {
  // Authorise: must be a logged-in admin.
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 })

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const bytes = await file.arrayBuffer()

  const admin = createServiceClient()
  const { error } = await admin.storage
    .from('site-assets')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  const { data } = admin.storage.from('site-assets').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
