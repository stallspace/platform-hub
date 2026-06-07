/**
 * Fire a notification event from a client component.
 * Calls the internal /api/notifications/send route.
 * Silently swallows errors — notifications must never block UX.
 */
export async function fireNotification(
  event: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    })
  } catch {
    // Notification failure must never break the main action
  }
}
