'use client'

import { useEffect, useState } from 'react'
import { X, Share } from 'lucide-react'

/**
 * "Add to Home Screen" prompt.
 *
 * Android/Chrome: uses the native beforeinstallprompt event.
 * iOS Safari: shows manual instructions (iOS has no install API).
 *
 * Deliberately unobtrusive — only shown to returning visitors, dismissible,
 * and remembered for 30 days. Never shown when already installed.
 */

const DISMISS_KEY = 'ss_install_dismissed_at'
const VISIT_KEY = 'ss_visits'
const DISMISS_DAYS = 30
const MIN_VISITS = 2

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function recentlyDismissed(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY)
    if (!at) return false
    return Date.now() - Number(at) < DISMISS_DAYS * 86_400_000
  } catch {
    return false
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return

    // Only prompt returning visitors — don't interrupt a first look.
    let visits = 1
    try {
      visits = Number(localStorage.getItem(VISIT_KEY) ?? '0') + 1
      localStorage.setItem(VISIT_KEY, String(visits))
    } catch {
      /* storage unavailable — treat as first visit */
    }
    if (visits < MIN_VISITS) return

    if (isIos()) {
      const t = setTimeout(() => { setIosHint(true); setShow(true) }, 3000)
      return () => clearTimeout(t)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  if (!show) return null

  return (
    <div
      className="fixed z-[60] left-3 right-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-auto
                 pb-[env(safe-area-inset-bottom)] animate-[slideUp_.25s_ease-out]"
      role="dialog"
      aria-label="Install Stallspace"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-[#0D3B2E]/95 backdrop-blur text-white
                      shadow-lg border border-white/10 pl-2.5 pr-1.5 py-2 sm:max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="w-7 h-7 rounded-lg bg-white/10 flex-shrink-0" />

        {iosHint ? (
          <p className="text-xs text-white/85 flex-1 min-w-0 leading-snug">
            Tap <Share className="w-3 h-3 inline -mt-0.5" /> then{' '}
            <span className="font-medium whitespace-nowrap">Add to Home Screen</span>
          </p>
        ) : (
          <p className="text-xs font-medium flex-1 min-w-0 truncate">Install the app</p>
        )}

        {!iosHint && (
          <button
            onClick={install}
            className="flex-shrink-0 bg-[#2ECC8E] hover:bg-[#26b57c] text-[#06231A] font-semibold
                       text-xs px-3.5 py-1.5 rounded-full transition-colors active:scale-95"
          >
            Install
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-white/45 hover:text-white p-1.5 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
