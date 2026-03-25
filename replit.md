# CampusLoop - Project Documentation

## Overview
**CampusLoop** is Nigeria's unified campus platform combining Discord-style department channels, an Instagram-like social feed, a study materials library, and social networking — for students, lecturers, HODs, and all academic staff.

**Tech Stack:**
- Frontend: React + TypeScript + Vite + TanStack Query + Shadcn UI + Wouter
- Backend: Express + Node.js + Drizzle ORM
- Database: PostgreSQL
- Authentication: Custom local auth (email + password, scrypt)
- Payments: Interswitch Quickteller (Webpay redirect)

## Key Accounts

### Admin Accounts
- `y@gmail.com` / `00998877` — Admin role, full access
- `u@gmail.com` / `77889900` — Admin role, full access

### Free All-Access Account (No Payment Required)
- `yusufhussaini0904@gmail.com` / `098756` — Premium, full access to everything

## Current Features

### ✅ Fully Implemented

1. **Authentication** - Custom signup/login (email + password). No Replit login.
   - Students: provide matric number; Staff: provide staff ID
   - Passwords hashed with Node.js `scrypt`

2. **Auto-Join Channels** - When users sign up or update their profile with university/faculty/department, they automatically join:
   - Their university general channel
   - Their faculty channel
   - Their department channel
   - All general platform channels

3. **Mobile Navigation** - Hamburger menu on all pages for phone view
   - `SidebarTrigger` button in mobile header
   - Sidebar closes when navigating to a page

4. **92+ Nigerian Universities** - All universities seeded including:
   - Federal universities (UNILAG, UI, ABU, UNN, OAU, UNIBEN, etc.)
   - State universities (LASU, DELSU, IMSU, etc.)
   - Private universities (Covenant, Babcock, Bowen, etc.)
   - Full faculties and departments for 12 major universities

5. **Instagram-like Social Feed**
   - Stories row at top (horizontal scroll)
   - Post composer with photo URL support
   - Like (heart) button with live count
   - Comment section (expandable, Instagram-style)
   - Share and Bookmark buttons
   - Premium-gated

6. **Premium System (Interswitch Quickteller)**
   - `INTERSWITCH_CLIENT_ID` = Chain ID set ✅
   - `INTERSWITCH_SECRET_KEY` = Client ID set ✅
   - `INTERSWITCH_ENV` = sandbox ✅
   - Still needs: `INTERSWITCH_MERCHANT_CODE`, `INTERSWITCH_PAY_ITEM_ID`, `INTERSWITCH_HASH_KEY`
   - Premium subscription: ₦1,000/month
   - Per-material unlock: lecturers set price in ₦

7. **Rich Home Page** with:
   - Hero with mock phone preview
   - Stats (170+ universities, 500K+ students, etc.)
   - 6 feature cards with descriptions
   - How It Works (4-step process)
   - 12 universities showcase
   - Social Life section (Instagram comparisons)
   - Testimonials from students and lecturers
   - Premium upsell section
   - Full footer

8. **Department Chat (Channels)** - Discord-style
   - Auto-joined based on university/faculty/department
   - Types: general, department, faculty, class, club

9. **Study Materials** - Premium gated, per-material pricing
10. **Social Connect** - Find students available for networking (Premium)
11. **User Profile** - Edit profile, social availability toggle
12. **Admin Dashboard** - Manage universities, faculties, departments

## Architecture Notes

### Auth System
- Custom local auth using passport-local
- `server/localAuth.ts` - Core auth logic
- `server/replit_integrations/auth/routes.ts` - Signup/login/logout/user endpoints + auto-join
- Session stored in PostgreSQL `sessions` table

### Auto-Join Channel Logic
- On signup: `autoJoinUserChannels(userId, universityId, facultyId, departmentId)` called
- On login: auto-join runs again (catches missed channels)
- On profile update: if university/faculty/department changed, auto-join runs
- `POST /api/auth/auto-join` - manual trigger endpoint

### Important Files
- `shared/schema.ts` - All Drizzle ORM models (includes postLikes table)
- `shared/routes.ts` - API route definitions
- `server/localAuth.ts` - Authentication system
- `server/interswitch.ts` - Interswitch payment integration
- `server/routes.ts` - Express route handlers + post likes routes
- `server/storage.ts` - Database query layer
- `script/seed-nigeria.ts` - Full Nigeria university seed script
- `client/src/pages/welcome.tsx` - Signup/login page
- `client/src/pages/onboarding.tsx` - University/faculty/department selection
- `client/src/pages/feed.tsx` - Instagram-like social feed
- `client/src/pages/home.tsx` - Rich landing/home page
- `client/src/components/app-sidebar.tsx` - Sidebar with mobile support
- `client/src/App.tsx` - App layout with mobile hamburger header
- `client/src/components/premium-gate.tsx` - Premium upgrade prompt

## Database Schema
- **users**: id, email, password, firstName, lastName, role, universityId, facultyId, departmentId, matricNumber, staffId, isPremium, availableForSocial, bio
- **universities**: 92 Nigerian universities seeded
- **faculties**: Per-university (12 standard faculties for major universities)
- **departments**: Per-faculty departments
- **channels**: type 'class'/'club'/'department'/'faculty'/'general'/'university'
- **channelMembers**: Tracks channel membership (used for auto-join)
- **postLikes**: Tracks who liked which post
- **materials**: isPremium flag, price in kobo
- **userMaterials**: Unlocked premium materials per user
- **transactions**: Interswitch payment records
- **posts**: Social feed posts (with imageUrl)
- **comments**: Comments on posts
- **messages**: Channel messages
- **sessions**: Express session storage

## Running the App
```bash
npm run dev          # Starts Express backend + Vite frontend on port 5000
npm run build        # Production build
npm run db:push      # Sync database schema
npx tsx script/seed-nigeria.ts  # Re-run Nigeria university seed
```
