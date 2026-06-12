'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Phone, Mail, CheckCircle2, Loader2, Camera } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
}

export default function ProfileClient({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone]       = useState(profile?.phone ?? '')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null })
        .eq('id', userId)

      if (updateError) throw new Error(updateError.message)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() ?? 'ME'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-brand-forest flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">{initials}</span>
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-mint rounded-full flex items-center justify-center
                               hover:bg-blue-700 transition-colors">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{fullName || 'Your Name'}</p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Profile updated successfully
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className="input pl-10"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  className="input pl-10"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+27 82 000 0000"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                className="input pl-10 bg-gray-50 cursor-not-allowed"
                value={profile?.email ?? ''}
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email address cannot be changed here.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Delete Account</h3>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button className="px-4 py-2 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors">
          Delete My Account
        </button>
      </div>
    </div>
  )
}
