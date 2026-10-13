# Soft Tech Solution — Next.js Fullstack Platform

A fullstack **Next.js (App Router)** website and client lead management platform for **Soft Tech Solution**, powered by React, Next.js Route Handlers, and Supabase/PostgreSQL.

---

## 👥 Executive Leadership

- **Ashutosh Kumar** — *Founder*, Soft Tech Solution
- **Ankitosh Kumar** — *Co-Founder*, Soft Tech Solution
  - 📞 **Mobile / WhatsApp:** `+91 6205570278`
  - ✉️ **Email:** `softtechsolution@gmail.com`

---

## 🚀 Key Features

1. **Modern Frontend (Next.js App Router):**
   - **Home (`/`):** Interactive hero with real-time metrics, dynamic glowing cards, services overview, process roadmap, case studies, client testimonials, and quick consultation inquiry form.
   - **Services (`/services`):** Complete breakdowns for Social Media Marketing, Next.js Development, SEO & Search Authority, Google & Meta Ads, Brand Identity, and Content Marketing.
   - **Our Work (`/portfolio`):** Interactive category filter (All Work, Branding, Web Design, Marketing) with case study metrics.
   - **About Us (`/about`):** Dedicated **Executive Leadership & Founders section** featuring Ashutosh Kumar (Founder) and Ankitosh Kumar (Co-Founder, Mobile: `+91 6205570278`, Direct Call & WhatsApp buttons), company mission, and guiding values.
   - **Contact (`/contact`):** Full contact channels, direct line to Co-Founder Ankitosh Kumar, live inquiry submission form, and interactive FAQ accordion.
   - **Admin Portal (`/admin`):** Secure admin dashboard with KPI stats cards (Total, New, In Contact, Converted), live search filter, status dropdown update, lead deletion, and 1-click **Export to CSV**.

2. **Backend API Route Handlers:**
   - `/api/enquiries`: Handles lead submissions (`POST`), authenticated retrieval (`GET`), status/notes updates (`PATCH`), and lead deletion (`DELETE`). Includes automatic fallback storage for local development.
   - `/api/login`: Secure admin authentication (`POST`, `GET`, `DELETE`) with HMAC-signed session cookies and Bearer tokens.

3. **Database Integration:**
   - Supabase / PostgreSQL schema with Row Level Security (`supabase_schema.sql`).
   - Seamless fallback in-memory mode for rapid local development when database keys are not yet configured.

---

## 💻 How to Run Locally

### Prerequisites
- Node.js (version 18.0.0 or higher)
- npm (version 9.0.0 or higher)

### Steps

1. **Open terminal inside the project directory:**
   ```bash
   cd "d:/E DRIVE/Project/MCA/Startup/soft-tech"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Website: [http://localhost:3000](http://localhost:3000)
   - About Us & Founders: [http://localhost:3000/about](http://localhost:3000/about)
   - Contact Page: [http://localhost:3000/contact](http://localhost:3000/contact)
   - Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)

5. **Admin Login for Local Testing:**
   - **Email:** `admin@softtechsolution.com`
   - **Password:** `admin123`

---

## ☁️ How to Deploy Live to Vercel

Next.js is designed by Vercel and deploys with zero configuration.

### Method 1: Deploy via GitHub (Recommended)

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Convert Soft Tech Solution to fullstack Next.js with Co-Founder Ankitosh Kumar"
   ```
2. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/soft-tech-solution.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
4. Import your GitHub repository.
5. In **Environment Variables**, add the values from `.env.example`:
   - `ADMIN_EMAIL` — your production admin email
   - `ADMIN_PASSWORD` — a strong admin password
   - `ADMIN_SESSION_SECRET` — a random 32+ character string
   - `SUPABASE_URL` — your Supabase project URL (optional, for persistent DB)
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key (optional)
6. Click **Deploy**. Your site will be live on a `*.vercel.app` URL within seconds!

### Method 2: Deploy via Vercel CLI

1. Install Vercel CLI (if not installed):
   ```bash
   npm i -g vercel
   ```
2. Run deployment command in the project folder:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to link and deploy your project.

---

## 🗄️ Database Setup (Supabase / Postgres)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Paste and run the SQL from `supabase_schema.sql`.
4. Copy your **Project URL** and **Service Role API Key** from `Project Settings > API`.
5. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` or Vercel Environment Variables.

---

## 📁 Project Structure

```text
soft-tech/
├── app/
│   ├── about/page.jsx         # About Us & Executive Leadership (Founders)
│   ├── admin/page.jsx         # Secure Admin Dashboard & CRM
│   ├── api/
│   │   ├── enquiries/route.js # Leads API (GET, POST, PATCH, DELETE)
│   │   └── login/route.js     # Admin Auth API (GET, POST, DELETE)
│   ├── contact/page.jsx       # Contact Us page + FAQs + Direct Call
│   ├── portfolio/page.jsx     # Our Work & Portfolio filter
│   ├── services/page.jsx      # Services breakdown
│   ├── globals.css            # Modern design system & styles
│   ├── layout.jsx             # Root layout, metadata, fonts, header, footer
│   └── page.jsx               # Home landing page
├── components/
│   ├── ContactForm.jsx        # Interactive inquiry form with live state
│   ├── Footer.jsx             # Global website footer
│   ├── Navbar.jsx             # Responsive navigation with mobile drawer
│   └── ToastContext.jsx       # Global notification toasts
├── lib/
│   ├── auth.js                # JWT & session verification
│   └── db.js                  # Database client with local fallback
├── public/                    # Logos, founder portraits, assets
│   ├── ankitosh-kumar-cofounder.jpeg
│   ├── ashutosh-kumar-founder.jpeg
│   └── soft-tech-solution-logo.jpeg
├── legacy-static/             # Safely archived previous static HTML files
├── .env.example               # Environment variables template
├── .env.local                 # Local development configuration
├── package.json               # Dependencies and scripts
└── vercel.json                # Vercel Next.js framework configuration
```

---

## 📞 Support & Inquiries
- **Ankitosh Kumar (Co-Founder):** [+91 6205570278](tel:+916205570278)
- **Ashutosh Kumar (Founder):** [Contact Page](/contact)
