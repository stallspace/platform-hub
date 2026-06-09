import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string          // unique cart line id = product_id + variant_id
  product_id: string
  product_name: string
  product_slug: string
  vendor_id: string
  vendor_name: string
  vendor_slug: string
  price: number
  quantity: number
  image: string | null
  variant?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'> & { id?: string }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  clearVendorItems: (vendorId: string) => void
  itemCount: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) => {
        const id = incoming.id ?? `${incoming.product_id}-${incoming.variant ?? 'default'}`
        set((state) => {
          const existing = state.items.find(i => i.id === id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === id ? { ...i, quantity: i.quantity + (incoming.quantity ?? 1) } : i
              ),
            }
          }
          return { items: [...state.items, { ...incoming, id }] }
        })
      },

      removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set(state => ({
          items: state.items.map(i => i.id === id ? { ...i, quantity } : i),
        }))
      },

      clearCart: () => set({ items: [] }),

      clearVendorItems: (vendorId) =>
        set(state => ({ items: state.items.filter(i => i.vendor_id !== vendorId) })),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'marcrte-cart',
    }
  )
)

// Helper: group items by vendor
export function groupByVendor(items: CartItem[]): Record<string, CartItem[]> {
  return items.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.vendor_id]) acc[item.vendor_id] = []
    acc[item.vendor_id].push(item)
    return acc
  }, {})
}
