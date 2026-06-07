'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/app/admin/categories/page'

interface Props {
  categories: Category[]
  productCounts: Record<string, number>
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').trim()
}

const ICONS = ['🛍️', '👗', '👟', '🏠', '📱', '🖥️', '🍕', '🌿', '🎨', '📚', '🧴', '🏋️', '🎮', '🐾', '🚗', '✈️', '💄', '🧰', '🎵', '💎']

const EMPTY_FORM = { name: '', slug: '', description: '', icon: '', parent_id: '' }

export default function CategoriesClient({ categories, productCounts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [reordering, setReordering] = useState(false)
  const [localOrder, setLocalOrder] = useState<Category[]>(categories)

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      icon: cat.icon ?? '',
      parent_id: cat.parent_id ?? '',
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: editId ? f.slug : slugify(name) }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      showToast('Name and slug are required.', 'error')
      return
    }
    setSaving(true)
    const supabase = createClient()

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      icon: form.icon || null,
      parent_id: form.parent_id || null,
    }

    let error
    if (editId) {
      const res = await supabase.from('categories').update(payload).eq('id', editId)
      error = res.error
    } else {
      const maxOrder = localOrder.length > 0 ? Math.max(...localOrder.map((c) => c.sort_order)) : -1
      const res = await supabase.from('categories').insert({ ...payload, sort_order: maxOrder + 1 })
      error = res.error
    }

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast(editId ? 'Category updated.' : 'Category created.', 'success')
      closeForm()
      startTransition(() => router.refresh())
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const count = productCounts[id] ?? 0
    if (count > 0) {
      showToast(`Cannot delete: ${count} product(s) use this category.`, 'error')
      return
    }
    if (!confirm('Delete this category? This cannot be undone.')) return
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Category deleted.', 'success')
      startTransition(() => router.refresh())
    }
    setDeletingId(null)
  }

  function moveRow(index: number, dir: -1 | 1) {
    const next = [...localOrder]
    const swap = index + dir
    if (swap < 0 || swap >= next.length) return
    const tmp = next[index]
    next[index] = next[swap]
    next[swap] = tmp
    setLocalOrder(next)
  }

  async function saveOrder() {
    setReordering(true)
    const supabase = createClient()
    const updates = localOrder.map((cat, i) =>
      supabase.from('categories').update({ sort_order: i }).eq('id', cat.id)
    )
    await Promise.all(updates)
    showToast('Order saved.', 'success')
    setReordering(false)
    startTransition(() => router.refresh())
  }

  const topLevel = localOrder.filter((c) => !c.parent_id)
  const parentOptions = categories.filter((c) => !c.parent_id)

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
          {toast.text}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#0A1F44]">{editId ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Icon picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Icon (emoji)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                      className={`text-xl p-1.5 rounded-lg transition-all ${form.icon === ic ? 'bg-[#1D4ED8]/10 ring-2 ring-[#1D4ED8]' : 'hover:bg-gray-100'}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Electronics"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="e.g. electronics"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D4ED8] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Short description..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D4ED8] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Parent Category</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="">None (top-level)</option>
                  {parentOptions.filter((c) => c.id !== editId).map((c) => (
                    <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-[#0A1F44] hover:bg-[#0d2a5e] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{localOrder.length} categories</p>
        <div className="flex items-center gap-2">
          <button
            onClick={saveOrder}
            disabled={reordering}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {reordering ? 'Saving order...' : 'Save Order'}
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#0A1F44] hover:bg-[#0d2a5e] text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {localOrder.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">🏷️</div>
            <p className="text-gray-500 font-medium">No categories yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first category to get started.</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-[#0A1F44] text-white text-sm font-semibold rounded-xl">
              New Category
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Parent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Products</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {localOrder.map((cat, i) => {
                const parent = categories.find((c) => c.id === cat.parent_id)
                return (
                  <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveRow(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => moveRow(i, 1)} disabled={i === localOrder.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {cat.icon && <span className="text-xl">{cat.icon}</span>}
                        <div>
                          <p className="font-semibold text-[#0A1F44]">{cat.name}</p>
                          {cat.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{cat.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell font-mono text-xs text-gray-500">{cat.slug}</td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500 text-xs">{parent ? parent.name : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(productCounts[cat.id] ?? 0) > 0 ? 'bg-[#1D4ED8]/10 text-[#1D4ED8]' : 'bg-gray-100 text-gray-400'}`}>
                        {productCounts[cat.id] ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
