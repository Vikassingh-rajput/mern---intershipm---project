# ChillPOS - Point of Sale & Inventory Management System

ChillPOS is a modern, calm-themed web application for retail businesses to manage billing, inventory, suppliers, purchase orders, and sales reporting from a single dashboard.

The app is built with Next.js App Router + Supabase and designed to be deployable on Vercel.

---

## 1) Project Overview

ChillPOS provides:
- Secure login for store staff
- Role-based access (`admin`, `cashier`)
- Fast checkout flow (POS)
- Stock tracking and inventory updates
- Category and supplier management
- Purchase order lifecycle support
- Sales analytics and CSV export
- Receipt generation as PDF

The design follows a clean SaaS dashboard style with a relaxing palette:
- Primary background: `#F8F7F2`
- Sidebar background: `#2C3E50`
- Accent/buttons: `#5B8A72`
- Card background: `#FFFFFF`
- Primary text: `#3D3D3A`
- Warning: `#E9A84C`
- Danger: `#C0675A`

---

## 2) Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database + Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Authorization:** Supabase Row Level Security (RLS)
- **Charts:** Recharts
- **PDF Receipts:** jsPDF + jspdf-autotable
- **CSV Export:** PapaParse
- **Icons:** Lucide React
- **Deployment:** Vercel

---

## 3) Core Modules

### Authentication
- Login with email/password via Supabase Auth
- Session-based route protection
- Redirect to dashboard after successful login
- Role-aware navigation for admin/cashier

### Dashboard
- Summary cards:
  - Total Sales Today
  - Total Revenue
  - Low Stock Items
  - Top Selling Product
- 7-day bar chart for sales
- Recent transaction table

### POS Screen
- Product search (name/barcode)
- Add items to cart and adjust quantity
- Apply discount (`%` or fixed amount)
- Auto-calculate subtotal, tax, grand total
- Process checkout:
  - Create sale record
  - Insert sale items
  - Deduct product stock
  - Write inventory log entries
- Generate and download receipt as PDF

### Inventory Management
- Product listing with CRUD controls
- Fields:
  - `name`, `sku`, `barcode`
  - `price`, `cost`
  - `stock_quantity`, `low_stock_threshold`
  - `category_id`, `supplier_id`, `image_url`
- Stock movement recorded in inventory logs

### Categories
- Create / update / delete product categories

### Suppliers
- Manage supplier details and contact info

### Purchase Orders
- Create purchase order records
- Track PO status
- Mark as received (status update flow)

### Sales Reports
- Filter by date range
- View total sales, revenue, profit, and most sold products
- Export report data to CSV

### User Management (Admin)
- Manage user profile records and roles
- Admin-focused access in UI

---

## 4) Database Design (Supabase / PostgreSQL)

Defined in `supabase/schema.sql`.

### Tables
- `users`
- `products`
- `categories`
- `suppliers`
- `inventory_logs`
- `sales`
- `sale_items`
- `purchase_orders`
- `purchase_order_items`

### Security
- RLS is enabled on all tables
- Policies are defined for:
  - full admin access
  - cashier access to POS/sales-related data
- `current_role()` helper function maps current authenticated user to role
- `handle_new_user()` trigger syncs `auth.users` -> `public.users`

---

## 5) Project Structure

```text
pos-web/
  src/
    app/
      (protected)/
        dashboard/
        pos/
        inventory/
        categories/
        suppliers/
        purchase-orders/
        reports/
        users/
      login/
      layout.tsx
      page.tsx
      globals.css
    components/
      layout-shell.tsx
      shared.tsx
      simple-crud.tsx
    lib/
      supabase/
        client.ts
        server.ts
  supabase/
    schema.sql
  middleware.ts
  .env.example
```

---

## 6) Local Setup (Step-by-Step)

Run commands inside the project folder:

```powershell
cd "c:\Users\balaj\OneDrive\Desktop\intern project\POS project\pos-web"
npm install
cp .env.example .env.local
```

Then configure `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Initialize Supabase schema:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `supabase/schema.sql`

Start app:

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## 7) Authentication & Role Setup

1. Supabase -> Authentication -> Users -> Add user
2. Set email and password
3. Open Table Editor -> `public.users`
4. Set role:
   - `admin` for manager account
   - `cashier` for billing staff

> Login uses **email + password** (not username).

---

## 8) Deployment (Vercel)

1. Push repository to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### One-click deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/chillpos)

---

## 9) Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

---

## 10) Known Limitations / Next Improvements

- Checkout and PO stock updates should be wrapped in SQL transactions for strict consistency.
- Some admin-only permissions are UI-guided and can be hardened further with additional server checks.
- Image uploads are currently URL-based; can be upgraded to Supabase Storage uploads.
- More audit details can be added to inventory history views.

---

## 11) Troubleshooting

### `Missing script: dev`
You are likely running commands in the parent folder.  
Use:

```powershell
cd "c:\Users\balaj\OneDrive\Desktop\intern project\POS project\pos-web"
```

### `TypeError: Failed to fetch` on login
- Check `.env.local` values
- Restart dev server after env changes
- Verify Supabase project URL and anon key

### `Invalid login credentials`
- Create/reset user in Supabase Auth
- Use exact same email/password in app login form

---

## 12) License

This project is provided for educational and internal business use.  
Add your preferred license file (`MIT`, `Apache-2.0`, etc.) if you plan public distribution.
