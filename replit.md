# Monisha Kitchen - Food Ordering Application

## Overview
Full-stack food ordering app with dual interfaces:
- **Customer App**: Browse menu, add to cart, place orders via UPI, track delivery
- **Merchant Dashboard**: Manage orders, menu items, customers, banners, and store settings

## Project Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + Zustand (client state) + TanStack React Query (server state)
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Stack**: TypeScript throughout

## Key Files
- `client/src/App.tsx` - Main frontend (all pages/components in single file)
- `client/src/lib/store.ts` - Zustand store (cart, auth, viewMode only)
- `client/src/lib/api.ts` - React Query options + API helper functions
- `shared/schema.ts` - Database schema (Drizzle) + Zod validation
- `server/routes.ts` - Express API routes
- `server/storage.ts` - Database storage layer (IStorage interface)
- `server/db.ts` - Database connection

## Database Tables
- `menu_items` - Menu with name, price, category, image, veg/non-veg
- `orders` - Orders with items JSON, status tracking, customer info
- `customers` - Registered customers with phone, address, location
- `store_settings` - Single row for store config (UPI, hours, delivery radius)
- `banners` - Promotional banners with linked item IDs
- `category_images` - Category display images and visibility

## API Routes (all prefixed /api)
- Menu: GET/POST /menu, PATCH/DELETE /menu/:id, POST /menu/import
- Orders: GET /orders, GET /orders/:phone, POST /orders, PATCH /orders/:orderId/status
- Customers: GET /customers, GET/POST /customers/:phone, PATCH /customers/:phone/block
- Settings: GET/PATCH /settings
- Banners: GET /banners, PATCH /banners/:id
- Categories: GET /categories, POST /categories/image, PATCH /categories/:cat/visibility

## Business Rules
- UPI ID: 7013849563-2@ybl
- Delivery: Free > ₹999, ₹49 within 5km, ₹99 beyond 5km
- Order statuses: pending_payment → preparing → ready → on_the_way → delivered (also rejected/refunded)
- Pre-order allowed 30 min before store opens
- Excel/CSV menu import with "Special" word removal from categories
- Image compression: 1200x1200px max, JPEG 0.85 quality
- Contact: Phone 7013849563, FSSAI License 20119038001047

## Firebase Integration
- **Phone Auth**: Firebase SMS OTP verification (6-digit code) for customer login
- **Storage**: Images uploaded to Firebase Storage with compression (300x300px, JPEG 0.5 quality)
- Firebase config in `client/src/lib/firebase.ts` (lazy initialization)
- Firebase project: nvzg-a9977

## Deployment
- **Target**: Hostinger VPS (Ubuntu)
- **Build**: `npm run build` → `dist/index.cjs` (server) + `dist/public/` (frontend)
- **Start**: `NODE_ENV=production node dist/index.cjs`
- **DB Migration**: `npx drizzle-kit push`
- **Process Manager**: PM2 recommended
- **Reverse Proxy**: Nginx
- **Guide**: See `DEPLOY_HOSTINGER_VPS.md`
- **Env example**: See `.env.example`

## User Preferences
- User plans to host on Hostinger VPS
- Cart badge should only count items that exist in menu

## Merchant Authentication
- Merchant login with username/password (stored in `store_settings` table)
- Default credentials: Username `NaBo`, Password `MnD@0246`
- Server-side auth via token: `POST /api/merchant/login` returns token, merchant-only routes require `x-merchant-token` header
- Protected routes: menu mutations, order status, settings, customers, banners, categories
- Token stored in Zustand and sent automatically via API helpers

## Recent Changes
- 2026-02-12: Added customer review system
  - Reviews table: orderId, menuItemId, customerPhone, customerName, stars (1-5), comment
  - Customer can rate delivered orders with star rating + comment (one review per item per order)
  - Average star ratings shown on DishCard (★ 4.5 (12) format)
  - Merchant Reviews page: view all reviews, delete individual reviews
  - Server-side validation: stars 1-5, order must be delivered, customer must own order, no duplicates
  - API: GET /api/reviews, GET /api/reviews/item/:id, GET /api/reviews/order/:id, POST /api/reviews, DELETE /api/reviews/:id (merchant only)
- 2026-02-12: Replaced login background GIF with MP4 video (autoplay, muted, no loop)
- 2026-02-10: Added real location features
  - Customer: Browser Geolocation API for real GPS coordinates (replaces mock)
  - Merchant: Store location picker with Leaflet map + OpenStreetMap + Nominatim address search
  - Map auto-opens on first merchant login if location is default
  - Delivery radius enforcement: orders beyond radius are blocked with clear "Not Deliverable" message
  - Map also accessible from merchant Settings > Store Location & Delivery Radius
  - Leaflet CSS loaded from CDN, marker icons configured
- 2026-02-09: Added merchant login system
  - Merchant login form on login page (small button, clean UI)
  - Server-side token-based auth for merchant-only API routes
  - Credentials stored in store_settings (merchantUsername, merchantPassword)
  - Credentials stripped from public settings API responses
- 2026-02-09: Prepared for Hostinger VPS deployment
  - Added dotenv for .env file loading in production
  - Created deployment guide (DEPLOY_HOSTINGER_VPS.md)
  - Created .env.example with all required variables
  - Verified production build works correctly
- 2026-02-09: Added Firebase integration
  - Firebase Phone Auth (real SMS OTP, replacing mock OTP)
  - Firebase Storage for image uploads (menu, banners, categories)
  - Lazy Firebase initialization to avoid crash when keys not set
- 2026-02-09: Converted from frontend-only prototype to full-stack application
  - Added PostgreSQL database with Drizzle ORM
  - Created API routes for all CRUD operations
  - Migrated from Zustand persist (localStorage) to React Query + API calls
  - Zustand now only manages: cart, viewMode, user auth session
