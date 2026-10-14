import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { neon } from '@neondatabase/serverless';

const PRIMARY_DATA_DIR = path.join(process.cwd(), '.data');
const PRIMARY_DATA_FILE = path.join(PRIMARY_DATA_DIR, 'enquiries.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'soft_tech_enquiries.json');

// No fake sample leads - real database only!
const INITIAL_SAMPLE_LEADS = [];

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
    created_at: row.created_at ? (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)) : new Date().toISOString(),
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
    // 1. Ensure table exists
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

    // 2. Ensure every column exists (in case table was created with fewer columns)
    try { await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';`; } catch {}
    try { await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS service TEXT DEFAULT 'General Inquiry';`; } catch {}
    try { await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';`; } catch {}
    try { await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New';`; } catch {}
    try { await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';`; } catch {}
    try { await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`; } catch {}

    // 3. Ensure index exists
    try {
      await sql`CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries(created_at DESC);`;
    } catch {}

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
   3. RESILIENT LOCAL FALLBACK (DEVELOPMENT ONLY)
   ============================================================ */

function readDiskLeads() {
  try {
    if (fs.existsSync(PRIMARY_DATA_FILE)) {
      const content = fs.readFileSync(PRIMARY_DATA_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  try {
    if (fs.existsSync(TMP_DATA_FILE)) {
      const content = fs.readFileSync(TMP_DATA_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return null;
}

function getLocalLeads() {
  if (Array.isArray(globalThis.__STS_LEADS__)) {
    return globalThis.__STS_LEADS__;
  }

  const disk = readDiskLeads();
  if (disk) {
    globalThis.__STS_LEADS__ = disk;
    return disk;
  }

  const initial = [];
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
      return newLead;
    } catch (err) {
      console.error('Neon primary insert error:', err);
      try {
        const rows = await sql`
          INSERT INTO enquiries (id, name, email, phone, service, message, status, notes)
          VALUES (${newLead.id}, ${newLead.name}, ${newLead.email}, ${newLead.phone}, ${newLead.service}, ${newLead.message}, ${newLead.status}, ${newLead.notes})
          RETURNING *;
        `;
        if (rows && rows.length > 0) return formatLead(rows[0]);
      } catch (err2) {
        console.error('Neon secondary insert error:', err2);
      }
      throw new Error('Database insertion failed: ' + err.message);
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
        console.warn('Supabase insert returned error:', errText);
      }
    } catch (err) {
      console.warn('Supabase connection error:', err);
    }
  }

  // 3. Local fallback (ONLY when neither Neon nor Supabase is configured)
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
      try {
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
      } catch (orderErr) {
        console.warn('Neon order-by query failed, querying without ORDER BY:', orderErr);
        if (statusFilter && statusFilter !== 'All') {
          rows = await sql`
            SELECT * FROM enquiries
            WHERE status = ${statusFilter}
            LIMIT 500;
          `;
        } else {
          rows = await sql`
            SELECT * FROM enquiries
            LIMIT 500;
          `;
        }
      }
      // When Neon is active, ALWAYS return real database records! NEVER return fake sample leads!
      return (rows || []).map(formatLead);
    } catch (err) {
      console.error('Neon query failed:', err);
      // Return empty array instead of fake sample leads
      return [];
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
      console.warn('Supabase query failed:', err);
      return [];
    }
  }

  // 3. Local fallback (ONLY when neither Neon nor Supabase is configured at all)
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
      return null;
    } catch (err) {
      console.error('Neon update failed:', err);
      return null;
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
      console.warn('Supabase patch failed:', err);
      return null;
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
      const result = await sql`
        DELETE FROM enquiries
        WHERE id = ${id}
        RETURNING id;
      `;
      return Boolean(result && result.length > 0);
    } catch (err) {
      console.error('Neon delete failed:', err);
      return false;
    }
  }

  // 2. Supabase (Secondary)
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/enquiries?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          Prefer: 'return=representation',
        },
      });
      return res.ok;
    } catch (err) {
      console.warn('Supabase delete failed:', err);
      return false;
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
