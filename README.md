# MARCRTE — Marketplace Platform

South Africa's vetted online marketplace. Built with Next.js 14, Supabase, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS, Realtime) |
| Hosting | Netlify |
| Background Jobs | Railway |
| Email | Resend |
| Push Notifications | Firebase Cloud Messaging |
| Subscription Billing | Peach Payments / PayFast |
| Customer Payments | PayFast, Peach Payments, Yoco, Ozow (vendor-managed) |

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo>
cd marcrte
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:
- Supabase project URL and keys
- PayFast/Peach credentials for subscription billing
- Resend API key for email
- Firebase config for push notifications

### 3. Supabase Setup

Create a new Supabase project at https://supabase.com

Run migrations in order:
```bash
# In the Supabase SQL editor, run:
supabase/migrations/001_initial_schema.sql
supabase/seed/001_seed.sql
```

Or use the Supabase CLI:
```bash
npx supabase db push
npx supabase db seed
```

### 4. Configure Supabase Storage Buckets

Create these buckets in Supabase Storage:
- `vendor-logos` (public)
- `vendor-banners` (public)
- `product-images` (public)
- `vendor-documents` (private)

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
src/
├── app/
│   ├── marketplace/          # Public customer-facing pages
│   │   ├── page.tsx          # Homepage
│   │   ├── products/         # Product catalogue + search
│   │   ├── categories/       # Category browsing
│   │   ├── vendors/          # Vendor directory
│   │   ├── store/[slug]/     # Individual vendor storefronts
│   │   ├── compare/          # Product comparison
│   │   ├── cart/             # Cart
│   │   └── checkout/         # Checkout
│   ├── vendor/               # Vendor portal (authenticated)
│   │   ├── register/         # Vendor registration flow
│   │   ├── dashboard/        # Overview & stats
│   │   ├── products/         # Product management
│   │   ├── storefront/       # Storefront editor
│   │   ├── enquiries/        # Customer enquiries
│   │   ├── analytics/        # Store analytics
│   │   ├── payments/         # Payment gateway config
│   │   └── subscription/     # Subscription management
│   ├── admin/                # Admin portal (admin role only)
│   │   ├── dashboard/        # Platform overview
│   │   ├── vendors/          # Vendor approval & management
│   │   ├── products/         # All products
│   │   ├── categories/       # Category management
│   │   ├── subscriptions/    # Subscription billing overview
│   │   ├── content/          # Homepage content management
│   │   └── reports/          # Revenue & analytics reports
│   ├── auth/                 # Authentication pages
│   └── api/                  # API routes & webhooks
│       ├── vendors/
│       ├── products/
│       ├── orders/
│       ├── subscriptions/
│       └── webhooks/
│           ├── payfast/      # PayFast IPN webhook
│           └── peach/        # Peach Payments webhook
├── components/
│   ├── ui/                   # Base UI components (Button, Input, Modal, etc.)
│   ├── marketplace/          # Navbar, Footer, ProductCard, VendorCard, etc.
│   ├── vendor/               # Vendor portal components
│   ├── admin/                # Admin portal components
│   └── shared/               # Shared across portals
├── lib/
│   ├── supabase/             # Supabase client (browser + server)
│   ├── payments/             # PayFast & Peach integration helpers
│   ├── email/                # Resend email templates
│   └── utils/                # Helpers: formatCurrency, slugify, etc.
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript types & interfaces
├── store/                    # Zustand state (cart, compare, etc.)
└── styles/                   # Global CSS
supabase/
├── migrations/               # Database schema
└── seed/                     # Seed data (categories, homepage content)
```

---

## Key Features

### Customer Marketplace
- Browse, search, and filter products
- View vendor storefronts at `/marketplace/store/:slug`
- Compare products side-by-side
- Guest checkout (no account required)
- Optional customer accounts

### Vendor Portal
- Registration & approval workflow (Pending → Under Review → Approved)
- Subscription billing (Starter R199 / Growth R399 / Premium R699)
- Product management with bulk upload
- Payment gateway configuration
- Storefront customisation
- Customer enquiry management
- Analytics dashboard

### Admin Portal
- Vendor approval workflow
- Platform content management
- Subscription & revenue reporting
- Audit logging

### Payments
- **Vendor subscriptions**: Automated via PayFast or Peach Payments
- **Customer purchases**: Vendor-managed, directly to vendor (no MARCRTE intermediary)
- Supported gateways: PayFast, Peach Payments, Yoco, Ozow

---

## Deployment

### Netlify

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add all environment variables from `.env.example`
5. Install the Netlify Next.js plugin

### Railway (Background Services)

Deploy a separate Railway service for:
- Billing automation (subscription renewals, failed payment handling)
- Email queue processing
- Scheduled jobs

---

## Security

- Supabase Row-Level Security (RLS) on all tables
- Role-based access: `customer`, `vendor`, `admin`
- Middleware auth protection on `/vendor/*` and `/admin/*`
- Payment credentials encrypted at application level
- POPIA compliant data handling
- Audit logging for admin actions
- 2FA available via Supabase Auth

---

## Roadmap (Phase 2)

- [ ] Native mobile apps (React Native)
- [ ] Vendor advertising & sponsored listings
- [ ] Loyalty programme
- [ ] AI product recommendations
- [ ] WhatsApp integration
- [ ] Courier integrations (Pargo, The Courier Guy)
- [ ] Advanced analytics
- [ ] Marketplace API
