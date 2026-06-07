import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/types'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const supabase = await createClient()
  await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    action_url: input.actionUrl ?? null,
    is_read: false,
  })
}
