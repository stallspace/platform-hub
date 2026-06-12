'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, UserPlus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CustomerRegisterPage() {
  const router = useRouter()
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Full name is required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'customer' },
        },
      })

      if (signUpError) throw new Error(signUpError.message)
      if (!data.user) throw new Error('Failed to create account')

      await supabase
        .from('profiles')
        .update({ full_name: fullName, role: 'customer' })
        .eq('id', data.user.id)

      router.push('/marketplace')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/marketplace" className="inline-flex items-center gap-2 mb-6">
            <Image src="/logo.png" alt="Stallspace" width={160} height={48} className="h-12 w-auto object-contain mx-auto" priority />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Shop from South Africa&apos;s verified vendors</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="input pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-mint font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/join"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-mint transition-colors"
          >
            Want to sell on Stallspace? <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By creating an account you agree to our{' '}
          <Link href="#" className="underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="#" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
