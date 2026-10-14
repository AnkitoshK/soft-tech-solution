import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { neon } from '@neondatabase/serverless';

const PRIMARY_DATA_DIR = path.join(process.cwd(), '.data');
const PRIMARY_DATA_FILE = path.join(PRIMARY_DATA_DIR, 'enquiries.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'soft_tech_enquiries.json');

const INITIAL_SAMPLE_LEADS = [
  {
    id: 'lead-1',
    name: 'Rohan Sharma',
    email: 'rohan@morningroast.com',
    phone: '+91 98765 43210',
    service: 'Social Media Management',
    message: 'Looking for a comprehensive 6-month brand expansion strategy.',
    status: 'Converted',
    notes: 'Onboarded for Q3 branding campaign.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'lead-2',
    name: 'Priya Verma',
    email: 'priya@brightlab.co',
    phone: '+91 98111 22334',
    service: 'Web Development',
    message: 'We need a modern Next.js website redesign with high performance.',
    status: 'Contacted',
    notes: 'Sent project proposal and architecture plan.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'lead-3',
    name: 'Vikram Mehta',
    email: 'vikram@alta-ventures.in',
    phone: '+91 99223 34455',
    service: 'Google / Meta Ads',
    message: 'Interested in scaling paid acquisition for our SaaS product.',
    status: 'New',
    notes: '',
    created_at: new Date().toISOString(),
  }
];

// Helper to format consistent lead objects
function formatLead(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    service: row.service || 'General Inquiry',
    message: row.message || '',
    status: row.status || 'New',
    notes: row.notes || '',
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at || new Date().toISOString()),
  };
}

/* ============================================================
   1. NEON / VERCEL POSTGRES (PRIMARY CLOUD DATABASE)
   ============================================================ */

function getNeonConnectionString() {
  const direct = process.env.POSTGRES_URL || 
                 process.env.DATABASE_URL || 
                 process.env.NEON_DATABASE_URL ||
                 process.env.POSTGRES_URL_NON_POOLING || 
                 process.env.POSTGRES_PRISMA_URL;
  if (direct && direct.trim() && !direct.includes('YOUR_POSTGRES_URL')) {
    return direct.trim();
  }

  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
    const host = process.env.PGHOST.trim();
    const user = encodeURIComponent(process.env.PGUSER.trim());
    const pass = encodeURIComponent(process.env.PGPASSWORD.trim());
    const db = process.env.PGDATABASE ? process.env.PGDATABASE.trim() : 'neondb';
    const port = process.env.PGPORT ? process.env.PGPORT.trim() : '5432';
    return `postgres://${user}:${pass}@${host}:${port}/${db}?sslmode=require`;
  }

  return null;
}

export function isNeonConfigured() {
  return Boolean(getNeonConnectionString());
}

let neonSqlClient = null;
let currentNeonConn = null;

function getNeonSql() {
  const conn = getNeonConnectionString();
  if (!conn) return null;
  if (!neonSqlClient || currentNeonConn !== conn) {
    currentNeonConn = conn;
    neonSqlClient = neon(conn);
  }
  return neonSqlClient;
}

let tableInitialized = false;

async function ensureTable(sql) {
  if (tableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        service TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'New',
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries(created_at DESC);
    `;
    tableInitialized = true;
  } catch (err) {
    console.error('Failed to ensure enquiries table exists in Neon Postgres:', err);
  }
}

/* ============================================================
   2. SUPABASE REST API (SECONDARY CLOUD DATABASE)
   ============================================================ */

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.SUPABASE_KEY || 
              process.env.SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (url.includes('YOUR_PROJECT') || key.includes('YOUR_SUPABASE')) return null;
  return { url: url.replace(/\/$/, ''), key };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

/* ============================================================
   3. RESILIENT LOCAL / IN-MEMORY FALLBACK (OFFLINE DEV ONLY)
   ============================================================ */

function readDiskLeads() {
  try {
    if (fs.existsSync(PRIMARY_DATA_FILE)) {
      const content = fs.readFileSync(PRIMARY_DATA_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  try {
    if (fs.existsSync(TMP_DATA_FILE)) {
      const content = fs.readFileSync(TMP_DATA_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return null;
}

function getLocalLeads() {
  if (Array.isArray(globalThis.__STS_LEADS__) && globalThis.__STS_LEADS__.length > 0) {
    return globalThis.__STS_LEADS__;
  }

  const disk = readDiskLeads();
  if (disk) {
    globalThis.__STS_LEADS__ = disk;
    return disk;
  }

  const initial = [...INITIAL_SAMPLE_LEADS];
  globalThis.__STS_LEADS__ = initial;
  saveLocalLeads(initial);
  return initial;
}

function saveLocalLeads(leads) {
  globalThis.__STS_LEADS__ = leads;

  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch {}

  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save to temp directory:', err);
  }
}

/* ============================================================
   4. DATABASE STATUS REPORTER
   ============================================================ */

export function getDatabaseInfo() {
  if (isNeonConfigured()) {
    return {
      type: 'neon',
      name: 'Neon / Vercel Postgres',
      connected: true,
      persistent: true,
      badge: '🟢 Cloud Database (Neon Postgres)',
      message: 'Cloud Database Active: All client proposals and enquiries are stored permanently in Neon Postgres.',
    };
  }
  if (isSupabaseConfigured()) {
    return {
      type: 'supabase',
      name: 'Supabase Cloud',
      connected: true,
      persistent: true,
      badge: '🟢 Cloud Database (Supabase)',
      message: 'Cloud Database Active: All client proposals and enquiries are stored permanently in Supabase.',
    };
  }
  return {
    type: 'local',
    name: 'Local Ephemeral Storage',
    connected: false,
    persistent: false,
    badge: '⚠️ Local Storage (Dev Only)',
    message: 'Local storage mode: On Vercel, submissions will not persist across serverless instances until Neon Postgres is connected in the Vercel Storage tab.',
  };
}

/* ============================================================
   5. CRUD OPERATIONS
   ============================================================ */

export async function createEnquiry({ name, email, phone, service, message }) {
  const newLead = {
    id: 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    name: name || '',
    email: email || '',
    phone: phone || '',
    service: service || 'General Inquiry',
    message: message || '',
    status: 'New',
    notes: '',
    created_at: new Date().toISOString(),
  };

  // 1. Neon / Vercel Postgres (Primary)
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTable(sql);
      const rows = await sql`
        INSERT INTO enquiries (id, name, email, phone, service, message, status, notes, created_at)
        VALUES (${newLead.id}, ${newLead.name}, ${newLead.email}, ${newLead.phone}, ${newLead.service}, ${newLead.message}, ${newLead.status}, ${newLead.notes}, ${newLead.created_at})
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        return formatLead(rows[0]);
      }
    } catch (err) {
      console.error('Neon insert failed, falling back:', err);
    }
  }

  // 2. Supabase (Secondary)
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/enquiries`, {
        method: 'POST',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          service: newLead.service,
          message: newLead.message,
          status: 'New',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const saved = data?.[0];
        if (saved) return formatLead(saved);
      } else {
        const errText = await res.text();
        console.warn('Supabase insert returned error, saving locally:', errText);
      }
    } catch (err) {
      console.warn('Supabase connection error, saving locally:', err);
    }
  }

  // 3. Local fallback
  const leads = getLocalLeads();
  leads.unshift(newLead);
  saveLocalLeads(leads);
  return newLead;
}

export async function getEnquiries(statusFilter) {
  // 1. Neon / Vercel Postgres (Primary)
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTable(sql);
      let rows;
      if (statusFilter && statusFilter !== 'All') {
        rows = await sql`
          SELECT * FROM enquiries
          WHERE status = ${statusFilter}
          ORDER BY created_at DESC
          LIMIT 500;
        `;
      } else {
        rows = await sql`
          SELECT * FROM enquiries
          ORDER BY created_at DESC
          LIMIT 500;
        `;
      }
      return (rows || []).map(formatLead);
    } catch (err) {
      console.error('Neon query failed, falling back:', err);
    }
  }

  // 2. Supabase (Secondary)
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      let url = `${cfg.url}/rest/v1/enquiries?select=*&order=created_at.desc&limit=500`;
      if (statusFilter && statusFilter !== 'All') {
        url = `${cfg.url}/rest/v1/enquiries?select=*&status=eq.${encodeURIComponent(statusFilter)}&order=created_at.desc&limit=500`;
      }
      const res = await fetch(url, {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data.map(formatLead);
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back:', err);
    }
  }

  // 3. Local fallback
  const leads = getLocalLeads();
  if (statusFilter && statusFilter !== 'All') {
    return leads.filter(l => l.status === statusFilter);
  }
  return leads;
}

export async function updateEnquiry(id, updates) {
  // 1. Neon / Vercel Postgres (Primary)
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTable(sql);
      let rows;
      if (updates.status && updates.notes !== undefined) {
        rows = await sql`
          UPDATE enquiries
          SET status = ${updates.status}, notes = ${updates.notes}
          WHERE id = ${id}
          RETURNING *;
        `;
      } else if (updates.status) {
        rows = await sql`
          UPDATE enquiries
          SET status = ${updates.status}
          WHERE id = ${id}
          RETURNING *;
        `;
      } else if (updates.notes !== undefined) {
        rows = await sql`
          UPDATE enquiries
          SET notes = ${updates.notes}
          WHERE id = ${id}
          RETURNING *;
        `;
      }
      if (rows && rows.length > 0) return formatLead(rows[0]);
    } catch (err) {
      console.error('Neon update failed, falling back:', err);
    }
  }

  // 2. Supabase (Secondary)
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/enquiries?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) return formatLead(data[0]);
      }
    } catch (err) {
      console.warn('Supabase patch failed, falling back:', err);
    }
  }

  // 3. Local fallback
  const leads = getLocalLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index !== -1) {
    leads[index] = { ...leads[index], ...updates };
    saveLocalLeads(leads);
    return leads[index];
  }
  return null;
}

export async function deleteEnquiry(id) {
  // 1. Neon / Vercel Postgres (Primary)
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTable(sql);
      await sql`
        DELETE FROM enquiries
        WHERE id = ${id};
      `;
      return true;
    } catch (err) {
      console.error('Neon delete failed, falling back:', err);
    }
  }

  // 2. Supabase (Secondary)
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      await fetch(`${cfg.url}/rest/v1/enquiries?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          Prefer: 'return=minimal',
        },
      });
    } catch (err) {
      console.warn('Supabase delete failed, falling back:', err);
    }
  }

  // 3. Local fallback
  const leads = getLocalLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index !== -1) {
    leads.splice(index, 1);
    saveLocalLeads(leads);
    return true;
  }
  return false;
}
