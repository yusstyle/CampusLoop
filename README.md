CampusLoop
Nigeria's unified campus platform — connecting students, lecturers, and academic staff across 90+ universities.

What It Does
CampusLoop combines three core experiences into one app:

Social Feed — Instagram-style posts, stories, likes, and comments. Browsing is free; posting requires a Premium subscription.
Channels — Discord-style chat rooms organised by university, faculty, and department. Students are auto-joined to their relevant channels after onboarding.
Study Materials — A digital library where lecturers upload notes, handouts, and resources. Premium content can be locked behind a paywall.
Live App
campusloop--yusstylerichkid.replit.app

Tech Stack
Layer	Technology
Frontend	React 18, TypeScript, Vite, TanStack Query, Wouter, Tailwind CSS, Shadcn UI
Backend	Node.js, Express 5
Database	PostgreSQL (Drizzle ORM)
Auth	Custom email/password (scrypt hashing)
Payments	Interswitch Quickteller (Webpay)
Getting Started
Prerequisites
Node.js 20+
A PostgreSQL database (set DATABASE_URL environment variable)
Installation
git clone https://github.com/yusstyle/CampusLoop
cd CampusLoop
npm install
Database Setup
npm run db:push
The server automatically seeds the database with all 92 Nigerian universities, their faculties, and departments on first startup — no manual seeding required.

Run in Development
npm run dev
The app runs at http://localhost:5000 — serving both the API and the frontend on one port.

Build for Production
npm run build
npm run start
Environment Variables
Variable	Description
DATABASE_URL	PostgreSQL connection string
SESSION_SECRET	Secret key for session encryption
INTERSWITCH_CLIENT_ID	Interswitch API client ID
INTERSWITCH_SECRET_KEY	Interswitch API secret key
INTERSWITCH_MERCHANT_CODE	Interswitch merchant code
INTERSWITCH_PAY_ITEM_ID	Interswitch pay item ID
INTERSWITCH_ENV	Set to production for live payments
User Roles
Role	Access
student	Onboarding, feed (view), channels, materials
lecturer	All student access + upload study materials
hod	Head of Department — channel management
admin	Full platform access, manage universities/faculties/departments
Premium Features
Create posts on the social feed
Access locked study materials
Premium badge (crown icon) on profile
Payment is processed via Interswitch Quickteller at ₦1,000/month.

Project Structure
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Feed, Channels, Materials, Onboarding, etc.
│       ├── components/  # Shared UI components
│       └── hooks/       # Data fetching hooks (TanStack Query)
├── server/              # Express backend
│   ├── routes.ts        # All API routes
│   ├── storage.ts       # Database access layer (Drizzle)
│   ├── seed.ts          # Auto-seed for universities/faculties/departments
│   └── interswitch.ts   # Payment integration
├── shared/
│   └── schema.ts        # Database schema & TypeScript types
└── script/
    ├── build.ts         # Production build script
    └── seed-nigeria.ts  # Manual seed script (development)
API Overview
Method	Endpoint	Description
POST	/api/auth/signup	Register a new account
POST	/api/auth/login	Log in
GET	/api/auth/user	Get current user
GET	/api/posts	Get social feed posts
POST	/api/posts	Create a post (Premium only)
GET	/api/channels	Get joined channels
GET	/api/messages/:channelId	Get channel messages
GET	/api/materials	Get study materials
POST	/api/payments/initiate	Start a Premium payment
GET	/api/payments/callback	Interswitch payment callback
GET	/api/admin/universities	List all universities
GET	/api/admin/faculties/:uniId	List faculties for a university
GET	/api/admin/departments/:facId	List departments for a faculty
Default Accounts
These accounts are created by the seed script for development and testing:

Email	Password	Role
y@gmail.com	00998877	Admin
u@gmail.com	77889900	Admin
yusufhussaini0904@gmail.com	098756	Student (Premium)
GitHub
