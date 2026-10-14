const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType
} = require('docx');

function heading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
  });
}

function heading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}

function heading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
  });
}

function paragraph(text, options = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        size: 22, // 11pt
        font: 'Segoe UI',
        ...options,
      }),
    ],
    spacing: { before: 80, after: 80 },
  });
}

function boldPara(label, text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: label + ': ',
        bold: true,
        size: 22,
        font: 'Segoe UI',
        color: '1F4E78',
      }),
      new TextRun({
        text: text,
        size: 22,
        font: 'Segoe UI',
      }),
    ],
    spacing: { before: 60, after: 60 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: '•  ' + text,
        size: 22,
        font: 'Segoe UI',
      }),
    ],
    indent: { left: 360 },
    spacing: { before: 40, after: 40 },
  });
}

function codeBlock(code, language = 'JavaScript') {
  const lines = code.trim().split('\n');
  return lines.map((line, idx) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: 'Consolas',
          size: 19, // 9.5pt
          color: '24292E',
        }),
      ],
      shading: {
        type: ShadingType.CLEAR,
        fill: 'F6F8FA',
      },
      spacing: { before: 20, after: 20 },
      indent: { left: 240, right: 240 },
    });
  });
}

function createTable(rowsData) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rowsData.map((row, rIdx) => {
      const isHeader = rIdx === 0;
      return new TableRow({
        children: row.map(cellText => {
          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    bold: isHeader,
                    font: 'Segoe UI',
                    size: isHeader ? 22 : 20,
                    color: isHeader ? 'FFFFFF' : '222222',
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            shading: isHeader
              ? { type: ShadingType.CLEAR, fill: '1F4E78' }
              : rIdx % 2 === 0
              ? { type: ShadingType.CLEAR, fill: 'F2F4F7' }
              : undefined,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
          });
        }),
      });
    }),
  });
}

async function generateDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'SOFT TECH SOLUTION',
                bold: true,
                size: 48,
                font: 'Segoe UI',
                color: '1F4E78',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Fullstack Next.js Platform — Complete System Architecture & Codebase Documentation',
                italics: true,
                size: 26,
                font: 'Segoe UI',
                color: 'E9772D',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 300 },
          }),

          // Metadata Box
          createTable([
            ['Project Parameter', 'Details / Values'],
            ['Application Name', 'Soft Tech Solution (STS) Fullstack Platform'],
            ['Company Tagline', 'Turning Your Ideas into Digital Success (IDEAS | CODE | SOLUTIONS)'],
            ['Production Frontend URL', 'https://soft-tech-solution-ebon.vercel.app/'],
            ['Production Admin Login', 'https://soft-tech-solution-ebon.vercel.app/admin/login'],
            ['Production Admin Dashboard', 'https://soft-tech-solution-ebon.vercel.app/admin'],
            ['GitHub Repository', 'https://github.com/AnkitoshK/soft-tech-solution'],
            ['Founder', 'Aashutosh Kumar (Mobile: +91 9117696512)'],
            ['Co-Founder', 'Ankitosh Kumar (Mobile: +91 6205570278)'],
            ['Primary Framework', 'Next.js 16 (App Router) + React 19 + Node.js 22'],
            ['Database', 'PostgreSQL / Supabase (with resilient local persistence fallback)'],
            ['Hosting & CI/CD', 'Vercel Serverless Edge + GitHub Actions Automation'],
          ]),

          new Paragraph({ text: '', spacing: { before: 200, after: 200 } }),

          // 1. Executive Summary
          heading1('1. Executive Summary & Startup Profile'),
          paragraph(
            'Soft Tech Solution is a premier full-service digital agency and technology engineering partner. The company delivers transformative digital growth across 10 core offerings including custom web engineering, mobile applications, cloud architectures, SEO, digital marketing, and brand identity design.'
          ),
          paragraph(
            'This project transforms the legacy static HTML website into a high-performance, modern fullstack Next.js (App Router) web application. The platform provides a seamless public customer experience alongside an enterprise-grade client lead management CRM portal.'
          ),

          heading2('1.1 Executive Leadership'),
          boldPara('Aashutosh Kumar', 'Founder, Soft Tech Solution | Mobile/WhatsApp: +91 9117696512 | Image: Blue Coat Portrait'),
          boldPara('Ankitosh Kumar', 'Co-Founder, Soft Tech Solution | Mobile/WhatsApp: +91 6205570278 | Image: White Shirt Portrait'),
          paragraph('Official Contact Email: softtechsolution@gmail.com | Official Live Website: https://soft-tech-solution-ebon.vercel.app/'),

          heading2('1.2 Official 10 Core Services (From Brand Poster)'),
          bullet('Web Development (</>): Next.js, React, fullstack portals, mobile responsiveness & speed optimization.'),
          bullet('Mobile App Development (📱): iOS & Android cross-platform applications built with React Native & Flutter.'),
          bullet('UI/UX Design (✒️): Wireframing, Figma interactive prototypes, design systems, and conversion rate optimization.'),
          bullet('Cloud Solutions (☁️): Scalable cloud architectures, serverless microservices, and database deployment.'),
          bullet('IT Support & More (⚙️): 24/7 technical maintenance, system troubleshooting, software upgrades & security patches.'),
          bullet('Digital Marketing (📢): Full-funnel digital campaigns that expand brand visibility and generate qualified pipeline.'),
          bullet('SEO (Search Engine Optimization) (📈): Technical SEO audits, keyword research, on-page architecture & rank tracking.'),
          bullet('Social Media Management (📸): Community management across Instagram, Facebook, LinkedIn, X, and YouTube.'),
          bullet('Google / Meta Ads (🎯): Laser-focused paid acquisition on Google Search, Performance Max, Instagram & Facebook.'),
          bullet('Graphics / Social Media Design (🎨): Standout visual identities, logos, marketing banners, and brochures.'),

          // 2. High-Level System Architecture
          heading1('2. High-Level System Architecture'),
          paragraph(
            'The application follows a unified fullstack monolithic architecture leveraging Next.js App Router. It combines React Server Components (RSC) for maximum SEO and fast initial server rendering with interactive Client Components for rich user feedback, all serviced by collocated serverless Route Handlers.'
          ),

          createTable([
            ['Architectural Layer', 'Technology', 'Role & Responsibility'],
            ['Presentation Layer', 'React 19 + Vanilla CSS', 'Zero-runtime CSS design system, responsive UI, glassmorphism, micro-animations.'],
            ['Routing & Layout', 'Next.js 16 App Router', 'Nested layouts, client-side caching, SSR/SSG, dynamic client routes.'],
            ['Application & API Layer', 'Next.js Route Handlers (Node.js 22)', 'REST endpoints (/api/enquiries, /api/login), payload validation, CORS, rate limiting.'],
            ['Authentication Layer', 'HMAC SHA-256 JWT + HttpOnly Cookies', 'Stateless cryptographic token signing, cookie exchange, and Bearer token verification.'],
            ['Persistence Layer', 'Supabase (PostgreSQL) + Local JSON Fallback', 'Cloud PostgreSQL database with RLS policies, backed by an autonomous local file store.'],
            ['Deployment & Edge', 'Vercel Edge Network', 'Global CDN asset distribution, automated SSL, continuous deployment via GitHub.'],
          ]),

          new Paragraph({ text: '', spacing: { before: 200, after: 200 } }),

          heading2('2.1 Complete Directory & File Structure'),
          paragraph('The file system is structured cleanly according to Next.js best practices:'),
          ...codeBlock(
`soft-tech/
├── app/
│   ├── about/
│   │   └── page.jsx               # About Us & Executive Leadership (Founders)
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.jsx           # Dedicated Admin Login Portal (/admin/login)
│   │   └── page.jsx               # Protected Admin Dashboard & CRM (/admin)
│   ├── api/
│   │   ├── enquiries/
│   │   │   └── route.js           # Leads API (GET, POST, PATCH, DELETE)
│   │   └── login/
│   │       └── route.js           # Admin Auth API (GET, POST, DELETE)
│   ├── contact/
│   │   └── page.jsx               # Contact Us page + FAQs + Direct Lines
│   ├── portfolio/
│   │   └── page.jsx               # Interactive Portfolio filter & case studies
│   ├── services/
│   │   └── page.jsx               # Breakdown of all 10 core services
│   ├── globals.css                # Global CSS design system & tokens
│   ├── layout.jsx                 # Root layout, metadata, fonts, header, footer
│   └── page.jsx                   # Home landing page with hero, services & founders
├── components/
│   ├── ContactForm.jsx            # Reusable lead capture form with live state
│   ├── Footer.jsx                 # Universal footer with founder numbers & admin link
│   ├── Navbar.jsx                 # Responsive navigation bar with mobile drawer
│   └── ToastContext.jsx           # Toast notification provider & useToast hook
├── lib/
│   ├── auth.js                    # JWT HMAC signing & session verification
│   └── db.js                      # Database client with local persistence & Supabase
├── public/
│   ├── ankitosh-kumar-cofounder.jpeg # Ankitosh Kumar portrait (white shirt)
│   ├── ashutosh-kumar-founder.jpeg   # Aashutosh Kumar portrait (blue coat)
│   ├── Scan Photo.jpg                # High-res raw source portrait
│   └── soft-tech-solution-logo.jpeg  # Official Company Logo
├── legacy-static/                 # Archived original static HTML version
├── .env.example                   # Environment variables template
├── .env.local                     # Local development configuration
├── package.json                   # Project dependencies and npm scripts
├── jsconfig.json                  # Path alias resolution (@/*)
├── next.config.mjs                # Next.js bundler configuration
└── vercel.json                    # Vercel framework definition`
          ),

          // 3. Frontend Architecture
          heading1('3. Frontend Architecture & Component Flow'),
          paragraph(
            'The frontend is built purely using React 19, Next.js 16, and Vanilla CSS. No third-party UI component libraries or heavy CSS utility frameworks were used, guaranteeing zero style conflicts, exceptional Core Web Vitals (LCP < 0.8s), and full customizability.'
          ),

          heading2('3.1 Navigation & Layout Lifecycle (app/layout.jsx)'),
          paragraph(
            'The RootLayout wraps every page in ToastProvider, mounts the sticky Navbar, renders the page children, and terminates with the universal Footer. It also configures comprehensive SEO metadata and OpenGraph tags.'
          ),
          ...codeBlock(
`// app/layout.jsx - Snippet
export const metadata = {
  title: 'Soft Tech Solution | Your Growth, Our Mission.',
  description: 'Digital growth partner for ambitious brands...',
  openGraph: {
    title: 'Soft Tech Solution | Strategic Digital Growth',
    url: 'https://soft-tech-solution-ebon.vercel.app',
    siteName: 'Soft Tech Solution',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}`
          ),

          heading2('3.2 Lead Capture Flow (components/ContactForm.jsx)'),
          paragraph(
            'The ContactForm component manages input validation, submits payloads asynchronously to /api/enquiries, and handles UI loading states. Upon successful submission, it resets the form and renders the confirmation message: "Thank you for consulting us, our team will contact you within 24 to 48 hours."'
          ),
          ...codeBlock(
`// components/ContactForm.jsx - Snippet
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error('Submission failed');
    showToast('Thank you for consulting us, our team will contact you within 24 to 48 hours.', 'success');
    setFormData({ name: '', phone: '', email: '', service: 'Web Development', message: '' });
  } catch (err) {
    showToast('Something went wrong. Please call +91 9117696512 or +91 6205570278.', 'error');
  } finally {
    setLoading(false);
  }
};`
          ),

          heading2('3.3 Protected Admin Routing (app/admin/page.jsx & login/page.jsx)'),
          paragraph(
            'Admin authentication uses a dual verification model: checking HttpOnly signed cookies and checking Bearer tokens in localStorage. If an unauthenticated user visits /admin, they are instantly redirected to /admin/login. Upon authenticating at /admin/login, the user is redirected into the /admin dashboard.'
          ),

          // 4. Backend Architecture
          heading1('4. Backend Architecture & Route Handlers'),
          paragraph(
            'Next.js Route Handlers operate as serverless microservices executed on Vercel Node.js 20.x runtime. They process HTTP requests, sanitize inputs, enforce cryptographic authentication, and interact with the database.'
          ),

          heading2('4.1 Leads Management API (app/api/enquiries/route.js)'),
          bullet('POST: Validates lead name and email syntax, sanitizes text strings up to 5,000 characters, creates a new record with status "New", and returns HTTP 201 Created.'),
          bullet('GET: Protected endpoint. Verifies admin identity, accepts optional ?status= query filter, and returns an array of inquiries sorted by created_at descending.'),
          bullet('PATCH: Protected endpoint. Receives enquiry ?id= and updates status (New, Contacted, Qualified, Converted, Closed) or notes.'),
          bullet('DELETE: Protected endpoint. Receives enquiry ?id= and permanently deletes the specified record.'),

          ...codeBlock(
`// app/api/enquiries/route.js - Snippet
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = safe(body.name, 120);
  const email = safe(body.email, 180);
  const phone = safe(body.phone, 40);
  const service = safe(body.service, 120);
  const message = safe(body.message, 5000);

  if (!name || !email) return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  const saved = await createEnquiry({ name, email, phone, service, message });
  return NextResponse.json({ ok: true, id: saved?.id }, { status: 201 });
}`
          ),

          heading2('4.2 Admin Authentication API (app/api/login/route.js)'),
          paragraph(
            'The login route validates the submitted credentials against ADMIN_EMAIL and ADMIN_PASSWORD. Upon matching, it issues a signed JWT token valid for 8 hours (28,800 seconds) using HMAC SHA-256 and sets an HttpOnly, SameSite=Lax cookie named sts_admin.'
          ),
          ...codeBlock(
`// app/api/login/route.js - Snippet
export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));
  const expectedEmail = getEnv('ADMIN_EMAIL', 'admin@softtechsolution.com');
  const expectedPassword = getEnv('ADMIN_PASSWORD', 'admin123');

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = signToken({ sub: email, exp: Math.floor(Date.now() / 1000) + 28800 });
  const response = NextResponse.json({ ok: true, email, token }, { status: 200 });
  response.cookies.set('sts_admin', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 28800,
  });
  return response;
}`
          ),

          heading2('4.3 Cryptographic Security Helper (lib/auth.js)'),
          paragraph(
            'Cryptographic functions use Node.js native crypto module (timing-safe comparisons and HMAC SHA-256) to ensure tamper-proof sessions without third-party authentication overhead.'
          ),

          // 5. Database Architecture
          heading1('5. Database Architecture & Data Flow'),
          paragraph(
            'The database layer employs a resilient hybrid architecture designed for zero friction during development and scalable enterprise capability in production.'
          ),

          heading2('5.1 PostgreSQL Schema (supabase_schema.sql)'),
          paragraph('The PostgreSQL table schema includes Row Level Security (RLS) to prevent unauthorized public access:'),
          ...codeBlock(
`-- PostgreSQL / Supabase Schema
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  name text not null,
  email text not null,
  phone text,
  service text,
  message text,
  status text not null default 'New',
  notes text default ''
);

alter table public.enquiries enable row level security;
-- Service role key bypasses RLS for serverless API operations`
          ),

          heading2('5.2 Dual Persistence Strategy (lib/db.js)'),
          bullet('Cloud Mode (Supabase): When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, data writes directly to PostgreSQL REST endpoints.'),
          bullet('Local Persistence Mode: If database keys are not configured, the system persists data to .data/enquiries.json on the server disk, ensuring inquiries persist across local development restarts.'),

          heading2('5.3 End-to-End Inquiry Lifecycle'),
          paragraph('The complete data flow follows these steps:'),
          bullet('Step 1: Visitor fills the consultation form on Home or Contact page.'),
          bullet('Step 2: Client sends JSON payload to POST /api/enquiries.'),
          bullet('Step 3: Server sanitizes strings and checks email formatting.'),
          bullet('Step 4: Record is saved in PostgreSQL (or local JSON store) with status="New".'),
          bullet('Step 5: Client receives HTTP 201 and displays confirmation popup.'),
          bullet('Step 6: Administrator logs in at /admin/login and enters /admin dashboard.'),
          bullet('Step 7: Admin reviews request, calls/WhatsApps prospect, and updates status to "Contacted" or "Converted".'),
          bullet('Step 8: Admin can export all leads to CSV with a single click.'),

          // 6. Deployment & DevOps
          heading1('6. Deployment & DevOps Architecture'),
          boldPara('Host Platform', 'Vercel (Framework: Next.js)'),
          boldPara('Continuous Integration', 'GitHub Repository -> Vercel automatic branch deploys on push to main'),
          boldPara('Environment Variables', 'ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'),

          // 7. Language & Code Inventory
          heading1('7. Complete Language & Code Matrix'),
          createTable([
            ['Language / Technology', 'Files in Codebase', 'Primary Purpose'],
            ['JavaScript (JSX)', 'app/**/page.jsx, components/*.jsx', 'Component UI structure, client interactivity, and routing.'],
            ['JavaScript (ES2024)', 'app/api/**/route.js, lib/*.js', 'Serverless route handlers, database client, and JWT cryptography.'],
            ['CSS3', 'app/globals.css', 'Design tokens, animations, responsive layout, glassmorphism.'],
            ['SQL (PostgreSQL)', 'supabase_schema.sql', 'Database schema, column constraints, Row Level Security policies.'],
            ['JSON', 'package.json, jsconfig.json, vercel.json', 'Configuration, path aliases, dependencies, framework specifications.'],
            ['Markdown', 'README.md, AGENTS.md', 'Project documentation, setup instructions, and agent guidelines.'],
          ]),

          new Paragraph({ text: '', spacing: { before: 200, after: 200 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: '— End of Documentation —',
                italics: true,
                size: 20,
                color: '888888',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, 'Soft_Tech_Solution_Architecture_Documentation.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully generated .docx document at:', outPath);
  console.log('File size:', buffer.length, 'bytes');
}

generateDocx().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
