# Soft Tech Solution — Next.js Fullstack Platform

A production fullstack **Next.js (App Router)** website and client lead management platform for **Soft Tech Solution**, powered by React 19, Next.js Route Handlers, and Supabase/PostgreSQL.

---

## 🌐 Live Production Deployment (Vercel)

- **Frontend Website:** [https://soft-tech-solution-ebon.vercel.app/](https://soft-tech-solution-ebon.vercel.app/)
- **Admin Login Portal:** [https://soft-tech-solution-ebon.vercel.app/admin/login](https://soft-tech-solution-ebon.vercel.app/admin/login)
- **Admin Dashboard (Protected):** [https://soft-tech-solution-ebon.vercel.app/admin](https://soft-tech-solution-ebon.vercel.app/admin)

> **Admin Credentials for Testing:**
> - **Email:** `admin@softtechsolution.com`
> - **Password:** `admin123` *(Configure production credentials via Vercel Environment Variables)*

---

## 👥 Executive Leadership

- **Aashutosh Kumar** — *Founder*, Soft Tech Solution
  - 📞 **Mobile / WhatsApp:** `+91 9876543753`
  - ✉️ **Email:** `softtechsolution@gmail.com`
  - 🖼️ **Portrait:** [`public/ashutosh-kumar-founder.jpeg`](public/ashutosh-kumar-founder.jpeg) *(in blue coat)*

- **Ankitosh Kumar** — *Co-Founder*, Soft Tech Solution
  - 📞 **Mobile / WhatsApp:** `+91 6205570278`
  - ✉️ **Email:** `softtechsolution@gmail.com`
  - 🖼️ **Portrait:** [`public/ankitosh-kumar-cofounder.jpeg`](public/ankitosh-kumar-cofounder.jpeg) *(in white shirt)*

---

## 🎯 10 Core Services (Official Poster)

1. **Web Development (`</>`)** — High-performance Next.js & React web applications.
2. **Mobile App Development (`📱`)** — iOS & Android cross-platform applications.
3. **UI/UX Design (`✒️`)** — Figma wireframing, high-converting prototypes, design systems.
4. **Cloud Solutions (`☁️`)** — Serverless architectures, Supabase databases, Vercel deployments.
5. **IT Support & More (`⚙️`)** — 24/7 technical maintenance, troubleshooting, security audits.
6. **Digital Marketing (`📢`)** — Multi-channel inbound campaigns and lead generation.
7. **SEO (`📈`)** — Search Engine Optimization, technical health, first-page Google rankings.
8. **Social Media Management (`📸`)** — Community management across Instagram, Facebook, LinkedIn, X.
9. **Google / Meta Ads (`🎯`)** — High-ROAS targeted PPC, search, and social ad campaigns.
10. **Graphics / Social Media Design (`🎨`)** — Brand kits, logo systems, marketing collateral.

**Value Pillars:**
- ✓ Creative Solutions
- ✓ Expert Team
- ✓ On-Time Delivery
- ✓ 100% Client Satisfaction

---

## 🚀 Technical Highlights

1. **Frontend (Next.js App Router):**
   - **Home (`/`):** Interactive hero with real-time metrics, dynamic glowing cards, services overview, process roadmap, case studies, client testimonials, and quick consultation inquiry form.
   - **Services (`/services`):** Complete breakdowns for all 10 services with capability tags and CTA.
   - **Our Work (`/portfolio`):** Interactive category filter (All Work, Branding, Web Design, Marketing) with case study metrics.
   - **About Us (`/about`):** Dedicated **Executive Leadership & Founders section** featuring Founder Aashutosh Kumar (left) and Co-Founder Ankitosh Kumar (right), company mission, and guiding values.
   - **Contact (`/contact`):** Full contact channels, direct lines to both founders, live inquiry submission form, and interactive FAQ accordion.
   - **Admin Login (`/admin/login`):** Dedicated secure login page for authorized administrators.
   - **Admin Portal (`/admin`):** Secure admin dashboard with KPI stats cards (Total, New, In Contact, Converted), live search filter, status dropdown update, lead deletion, and 1-click **Export to CSV**.

2. **Backend API Route Handlers:**
   - `/api/enquiries`: Handles lead submissions (`POST`), authenticated retrieval (`GET`), status/notes updates (`PATCH`), and lead deletion (`DELETE`). Includes automatic fallback storage for local development.
   - `/api/login`: Secure admin authentication (`POST`, `GET`, `DELETE`) with HMAC-signed session cookies and Bearer tokens.

3. **Database Integration:**
   - Supabase / PostgreSQL schema with Row Level Security (`supabase_schema.sql`).
   - Seamless fallback in-memory/file mode for rapid local development when database keys are not yet configured.

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
   - Admin Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   - Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)

5. **Production Build & Verification:**
   ```bash
   npm run build
   npm run start
   ```

---

## ☁️ How to Deploy Live to Vercel

### Method 1: Deploy via GitHub (Active)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "update: documentation and live links"
   git push origin main
   ```
2. Connected GitHub Repository: **[https://github.com/AnkitoshK/soft-tech-solution](https://github.com/AnkitoshK/soft-tech-solution)**
3. In your Vercel Dashboard for `soft-tech-solution-ebon`:
   - Vercel automatically redeploys on every `git push`.
   - In **Settings > Environment Variables**, add:
     * `ADMIN_EMAIL` — `admin@softtechsolution.com`
     * `ADMIN_PASSWORD` — your strong admin password
     * `ADMIN_SESSION_SECRET` — a random 32+ character string
     * `SUPABASE_URL` — (optional) Supabase project URL
     * `SUPABASE_SERVICE_ROLE_KEY` — (optional) Supabase service role key

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
│   ├── admin/
│   │   ├── login/page.jsx     # Dedicated Admin Login page
│   │   └── page.jsx           # Secure Admin Dashboard & CRM
│   ├── api/
│   │   ├── enquiries/route.js # Leads API (GET, POST, PATCH, DELETE)
│   │   └── login/route.js     # Admin Auth API (GET, POST, DELETE)
│   ├── contact/page.jsx       # Contact Us page + FAQs + Direct Call
│   ├── portfolio/page.jsx     # Our Work & Portfolio filter
│   ├── services/page.jsx      # 10 Services breakdown
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
│   └── db.js                  # Database client with local persistence & Supabase
├── public/                    # Logos, founder portraits, assets
│   ├── ankitosh-kumar-cofounder.jpeg  # Ankitosh Kumar (white shirt)
│   ├── ashutosh-kumar-founder.jpeg    # Aashutosh Kumar (blue coat)
│   └── soft-tech-solution-logo.jpeg   # Company Logo
├── legacy-static/             # Safely archived previous static HTML files
├── .env.example               # Environment variables template
├── .env.local                 # Local development configuration
├── package.json               # Dependencies and scripts
└── vercel.json                # Vercel Next.js framework configuration
```

---

## 📞 Leadership Contacts
- **Aashutosh Kumar (Founder):** [+91 9876543753](tel:+919876543753)
- **Ankitosh Kumar (Co-Founder):** [+91 6205570278](tel:+916205570278)
- **Live Site:** [https://soft-tech-solution-ebon.vercel.app/](https://soft-tech-solution-ebon.vercel.app/)
- **Admin Portal:** [https://soft-tech-solution-ebon.vercel.app/admin/login](https://soft-tech-solution-ebon.vercel.app/admin/login)
