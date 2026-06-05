'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, Loader2, Check, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface Vendor {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  business_address: string
  company_registration: string | null
}

interface Props {
  vendor: Vendor
  userEmail: string
}

export default function SettingsClient({ vendor, userEmail }: Props) {
  const supabase = createClient()

  const [ownerName, setOwnerName] = useState(vendor.owner_name)
  const [phone, setPhone] = useState(vendor.phone)
  const [address, setAddress] = useState(vendor.business_address)
  const [companyReg, setCompanyReg] = useState(vendor.company_registration ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savedPassword, setSavedPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleSaveProfile() {
    setSavingProfile(true)
    setProfileError(null)
    try {
      const { error } = await supabase.from('vendors').update({
        owner_name: ownerName,
        phone: phone,
        business_address: address,
        company_registration: companyReg || null,
        updated_at: new Date().toISOString(),
      }).eq('id', vendor.id)
      if (error) throw error
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 3000)
    } catch {
      setProfileError('Failed to save profile changes.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError(null)
    if (!currentPassword) { setPasswordError('Please enter your current password.'); return }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }
    setSavingPassword(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword })
      if (signInError) { setPasswordError('Current password is incorrect.'); return }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setSavedPassword(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSavedPassword(false), 3000)
    } catch {
      setPasswordError('Failed to update password. Please try again.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and business details</p>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-accent" />
            <h2 className="font-semibold text-gray-900">Business Profile</h2>
          </div>
          <div className="p-5 space-y-4">
            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {profileError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Business Name</label>
                <input type="text" value={vendor.business_name} disabled className="w-full text-sm border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Contact support to change your business name</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Owner Name</label>
                <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email Address</label>
                <input type="email" value={userEmail} disabled className="w-full text-sm border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Contact support to change your email</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Business Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Company Registration Number <span className="text-gray-400">(Optional)</span></label>
              <input type="text" value={companyReg} onChange={e => setCompanyReg(e.target.value)} placeholder="2024/000000/07" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSaveProfile} disabled={savingProfile} className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50">
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                {savedProfile && <Check className="w-4 h-4" />}
                {savingProfile ? 'Saving...' : savedProfile ? 'Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-accent" />
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>
          <div className="p-5 space-y-4">
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {passwordError}
              </div>
            )}
            {savedPassword && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                Password updated successfully.
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
                <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
                <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
                <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleChangePassword} disabled={savingPassword} className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50">
                {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">Irreversible account actions</p>
          <div className="flex items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50">
            <div>
              <p className="text-sm font-medium text-gray-900">Close Account</p>
              <p className="text-xs text-gray-500 mt-0.5">Permanently close your vendor account and remove your storefront</p>
            </div>
            <a href="mailto:support@marcrte.co.za?subject=Close Account Request" className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap">
              Request Closure
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
