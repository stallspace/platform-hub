import { createServiceClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  // Service role: we are writing a notification for another user (e.g. admin
  // notifying a vendor), which RLS would otherwise block.
  const supabase = createServiceClient()
  await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    action_url: input.actionUrl ?? null,
    is_read: false,
  })
}
