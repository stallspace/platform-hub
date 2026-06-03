// ============================================================
// MARCRTE — Core Type Definitions
// ============================================================

// --- Enums ---

export type VendorStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'

export type SubscriptionPlan = 'starter' | 'growth' | 'premium'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'suspended'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type PaymentProvider = 'payfast' | 'peach' | 'yoco' | 'ozow'

export type UserRole = 'customer' | 'vendor' | 'admin'

export type NotificationType = 'subscription' | 'enquiry' | 'product' | 'account' | 'order'

// --- Users ---

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// --- Vendors ---

export interface Vendor {
  id: string
  user_id: string
  business_name: string
  slug: string
  owner_name: string
  email: string
  phone: string
  business_address: string
  company_registration: string | null
  business_description: string
  logo_url: string | null
  banner_url: string | null
  status: VendorStatus
  subscription_plan: SubscriptionPlan | null
  subscription_status: SubscriptionStatus | null
  subscription_id: string | null
  payment_provider: PaymentProvider | null
  social_links: SocialLinks | null
  created_at: string
  updated_at: string
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  website?: string
  whatsapp?: string
}

export interface VendorPaymentConfig {
  id: string
  vendor_id: string
  provider: PaymentProvider
  // PayFast
  payfast_merchant_id?: string
  payfast_merchant_key?: string
  payfast_passphrase?: string
  // Peach
  peach_entity_id?: string
  peach_access_token?: string
  // Yoco
  yoco_public_key?: string
  yoco_secret_key?: string
  // Ozow
  ozow_site_code?: string
  ozow_private_key?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// --- Products ---

export interface Product {
  id: string
  vendor_id: string
  vendor?: Vendor
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  images: string[]
  category_id: string
  category?: Category
  stock_quantity: number | null
  track_inventory: boolean
  is_available: boolean
  is_archived: boolean
  is_featured: boolean
  variants: ProductVariant[]
  specifications: ProductSpecification[]
  tags: string[]
  sku: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  name: string
  options: VariantOption[]
}

export interface VariantOption {
  id: string
  value: string
  price_modifier: number
  stock_quantity: number | null
}

export interface ProductSpecification {
  key: string
  value: string
}

// --- Categories ---

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  product_count?: number
  created_at: string
}

// --- Orders ---

export interface Order {
  id: string
  order_number: string
  vendor_id: string
  vendor?: Vendor
  customer_id: string | null
  customer_email: string
  customer_name: string
  customer_phone: string | null
  shipping_address: Address
  items: OrderItem[]
  subtotal: number
  total: number
  status: OrderStatus
  payment_provider: PaymentProvider
  payment_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  total_price: number
  variant?: string
}

export interface Address {
  line1: string
  line2?: string
  city: string
  province: string
  postal_code: string
  country: string
}

// --- Enquiries ---

export interface Enquiry {
  id: string
  vendor_id: string
  product_id: string | null
  customer_email: string
  customer_name: string
  customer_phone: string | null
  message: string
  is_read: boolean
  replied_at: string | null
  created_at: string
}

// --- Reviews ---

export interface Review {
  id: string
  vendor_id: string
  product_id: string | null
  customer_name: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
}

// --- Subscriptions ---

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan
  name: string
  price_monthly: number
  product_limit: number | null
  features: string[]
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 199,
    product_limit: 100,
    features: [
      'Up to 100 products',
      'Dedicated storefront',
      'Basic analytics',
      'Email support',
      'All payment providers',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price_monthly: 399,
    product_limit: 500,
    features: [
      'Up to 500 products',
      'Dedicated storefront',
      'Advanced analytics',
      'Priority support',
      'All payment providers',
      'Bulk product upload',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price_monthly: 699,
    product_limit: null,
    features: [
      'Unlimited products',
      'Dedicated storefront',
      'Full analytics suite',
      'Dedicated support',
      'All payment providers',
      'Bulk product upload',
      'Featured placement priority',
    ],
  },
]

// --- Analytics ---

export interface VendorAnalytics {
  store_views: number
  product_views: number
  total_orders: number
  total_revenue: number
  pending_enquiries: number
  top_products: { product_id: string; name: string; views: number; orders: number }[]
}

// --- Notifications ---

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

// --- Search & Filters ---

export interface ProductFilters {
  query?: string
  category_id?: string
  vendor_id?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  page?: number
  per_page?: number
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
}

// --- API Responses ---

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
