import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from './auth.js';

const PRIMARY_DATA_DIR = path.join(process.cwd(), '.data');
const PRIMARY_DATA_FILE = path.join(PRIMARY_DATA_DIR, 'enquiries.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'soft_tech_enquiries.json');
const PRIMARY_ADMIN_FILE = path.join(PRIMARY_DATA_DIR, 'admin_users.json');
const TMP_ADMIN_FILE = path.join(os.tmpdir(), 'soft_tech_admin_users.json');
const PRIMARY_COURSES_FILE = path.join(PRIMARY_DATA_DIR, 'courses.json');
const TMP_COURSES_FILE = path.join(os.tmpdir(), 'soft_tech_courses.json');
const PRIMARY_SCANS_FILE = path.join(PRIMARY_DATA_DIR, 'scans.json');
const TMP_SCANS_FILE = path.join(os.tmpdir(), 'soft_tech_scans.json');

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

/* ============================================================
   4. ADMIN USERS & AUTHENTICATION DATA LAYER
   ============================================================ */

let adminTableInitialized = false;

async function ensureAdminTable(sql) {
  if (adminTableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    try { await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Admin';`; } catch {}
    try { await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`; } catch {}
    try { await sql`CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(LOWER(email));`; } catch {}

    // Seed master admin if table is completely empty
    try {
      const countCheck = await sql`SELECT COUNT(*) as count FROM admin_users;`;
      if (countCheck && countCheck[0] && parseInt(countCheck[0].count, 10) === 0) {
        const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();
        const masterPass = hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
        await sql`
          INSERT INTO admin_users (id, name, email, password_hash, role, created_at, updated_at)
          VALUES ('master_admin', 'Master Administrator', ${masterEmail}, ${masterPass}, 'Super Admin', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    } catch {}

    adminTableInitialized = true;
  } catch (err) {
    console.error('Failed to ensure admin_users table exists in Neon Postgres:', err);
  }
}

function readDiskAdmins() {
  try {
    if (fs.existsSync(PRIMARY_ADMIN_FILE)) {
      const content = fs.readFileSync(PRIMARY_ADMIN_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  try {
    if (fs.existsSync(TMP_ADMIN_FILE)) {
      const content = fs.readFileSync(TMP_ADMIN_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return null;
}

function getLocalAdmins() {
  if (Array.isArray(globalThis.__STS_ADMINS__) && globalThis.__STS_ADMINS__.length > 0) {
    return globalThis.__STS_ADMINS__;
  }

  const disk = readDiskAdmins();
  if (disk && Array.isArray(disk) && disk.length > 0) {
    globalThis.__STS_ADMINS__ = disk;
    return disk;
  }

  const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();
  const masterPass = hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
  const initial = [
    {
      id: 'master_admin',
      name: 'Master Administrator',
      email: masterEmail,
      password_hash: masterPass,
      role: 'Super Admin',
      created_at: '2026-09-01T00:00:00.000Z',
      isMaster: true,
    }
  ];
  globalThis.__STS_ADMINS__ = initial;
  saveLocalAdmins(initial);
  return initial;
}

function saveLocalAdmins(admins) {
  globalThis.__STS_ADMINS__ = admins;

  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_ADMIN_FILE, JSON.stringify(admins, null, 2), 'utf8');
  } catch {}

  try {
    fs.writeFileSync(TMP_ADMIN_FILE, JSON.stringify(admins, null, 2), 'utf8');
  } catch {}
}

export async function findAdminByEmail(email) {
  const target = (email || '').trim().toLowerCase();
  if (!target) return null;

  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureAdminTable(sql);
      const rows = await sql`
        SELECT * FROM admin_users 
        WHERE LOWER(email) = ${target} 
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const r = rows[0];
        const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();
        return {
          id: String(r.id),
          name: r.name || 'Admin',
          email: r.email,
          password_hash: r.password_hash,
          role: r.role || 'Admin',
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          isMaster: target === masterEmail,
        };
      }
    } catch (err) {
      console.error('Neon findAdminByEmail error:', err);
    }
  }

  // 2. Local fallback
  const locals = getLocalAdmins();
  const found = locals.find(a => a.email.toLowerCase() === target);
  if (found) {
    const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();
    return {
      ...found,
      isMaster: target === masterEmail,
    };
  }

  return null;
}

export async function getAdminUsers() {
  const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();
  let admins = [];

  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureAdminTable(sql);
      const rows = await sql`
        SELECT id, name, email, role, created_at 
        FROM admin_users 
        ORDER BY created_at ASC;
      `;
      admins = (rows || []).map(r => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        role: r.role || 'Admin',
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        isMaster: (r.email || '').toLowerCase() === masterEmail,
      }));
    } catch (err) {
      console.error('Neon getAdminUsers error:', err);
    }
  }

  // 2. Local fallback if empty or Neon unavailable
  if (!admins.length) {
    const locals = getLocalAdmins();
    admins = locals.map(a => ({
      id: String(a.id),
      name: a.name,
      email: a.email,
      role: a.role || 'Admin',
      created_at: a.created_at,
      isMaster: (a.email || '').toLowerCase() === masterEmail,
    }));
  }

  // Only inject and persist default master if there are ZERO admins in the list at all
  if (admins.length === 0) {
    const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();
    const masterPass = hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
    const defaultMaster = {
      id: 'master_admin',
      name: 'Master Administrator',
      email: masterEmail,
      password_hash: masterPass,
      role: 'Super Admin',
      created_at: '2026-09-01T00:00:00.000Z',
      isMaster: true,
    };
    admins.push({
      id: defaultMaster.id,
      name: defaultMaster.name,
      email: defaultMaster.email,
      role: defaultMaster.role,
      created_at: defaultMaster.created_at,
      isMaster: true,
    });
    saveLocalAdmins([defaultMaster]);
    if (sql) {
      try {
        await sql`
          INSERT INTO admin_users (id, name, email, password_hash, role, created_at, updated_at)
          VALUES ('master_admin', 'Master Administrator', ${masterEmail}, ${masterPass}, 'Super Admin', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
        `;
      } catch {}
    }
  }

  return admins;
}

export async function createAdminUser({ id: customId, name, email, passwordHash, role = 'Admin' }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !passwordHash) {
    throw new Error('Email and password are required');
  }

  // Check duplicate
  const allAdmins = await getAdminUsers();
  const emailExists = allAdmins.some(a => (a.email || '').toLowerCase() === normalizedEmail);
  if (emailExists) {
    throw new Error('An administrator with this email already exists');
  }

  const id = customId || ('admin_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
  const cleanName = (name || '').trim() || 'Admin User';
  const cleanRole = (role || '').trim() || 'Admin';
  const createdAt = new Date().toISOString();

  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureAdminTable(sql);
      await sql`
        INSERT INTO admin_users (id, name, email, password_hash, role, created_at, updated_at)
        VALUES (${id}, ${cleanName}, ${normalizedEmail}, ${passwordHash}, ${cleanRole}, NOW(), NOW());
      `;
    } catch (err) {
      console.error('Neon createAdminUser error:', err);
    }
  }

  // 2. Local fallback
  const locals = getLocalAdmins();
  locals.push({
    id,
    name: cleanName,
    email: normalizedEmail,
    password_hash: passwordHash,
    role: cleanRole,
    created_at: createdAt,
  });
  saveLocalAdmins(locals);

  return {
    id,
    name: cleanName,
    email: normalizedEmail,
    role: cleanRole,
    created_at: createdAt,
    isMaster: false,
  };
}

export async function updateAdminPassword(email, newPasswordHash) {
  const target = (email || '').trim().toLowerCase();
  if (!target || !newPasswordHash) return false;

  const allAdmins = await getAdminUsers();
  const accountExists = allAdmins.some(a => (a.email || '').toLowerCase() === target);
  if (!accountExists) {
    return false;
  }

  let updated = false;
  const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();

  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureAdminTable(sql);
      const res = await sql`
        UPDATE admin_users
        SET password_hash = ${newPasswordHash}, updated_at = NOW()
        WHERE LOWER(email) = ${target}
        RETURNING id;
      `;
      if (res && res.length > 0) {
        updated = true;
      } else if (target === masterEmail) {
        // Master admin wasn't in table yet, insert so new password persists!
        const id = 'master_admin';
        await sql`
          INSERT INTO admin_users (id, name, email, password_hash, role, created_at, updated_at)
          VALUES (${id}, 'Master Administrator', ${masterEmail}, ${newPasswordHash}, 'Super Admin', NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET password_hash = ${newPasswordHash}, updated_at = NOW();
        `;
        updated = true;
      }
    } catch (err) {
      console.error('Neon updateAdminPassword error:', err);
    }
  }

  // 2. Local fallback
  const locals = getLocalAdmins();
  const idx = locals.findIndex(a => a.email.toLowerCase() === target);
  if (idx !== -1) {
    locals[idx].password_hash = newPasswordHash;
    locals[idx].updated_at = new Date().toISOString();
    saveLocalAdmins(locals);
    updated = true;
  } else if (target === masterEmail) {
    locals.push({
      id: 'master_admin',
      name: 'Master Administrator',
      email: masterEmail,
      password_hash: newPasswordHash,
      role: 'Super Admin',
      created_at: new Date().toISOString(),
    });
    saveLocalAdmins(locals);
    updated = true;
  }

  return updated;
}

export async function deleteAdminUser(idOrEmail) {
  if (!idOrEmail) return false;
  const targetLower = String(idOrEmail).toLowerCase().trim();

  // Safety check: Cannot delete the only remaining administrator account
  const currentAdmins = await getAdminUsers();
  if (currentAdmins.length <= 1) {
    throw new Error('Cannot delete the last remaining administrator ID. At least one admin account must remain.');
  }

  let deleted = false;
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureAdminTable(sql);
      const res = await sql`
        DELETE FROM admin_users
        WHERE id = ${idOrEmail} OR LOWER(email) = ${targetLower}
        RETURNING id;
      `;
      if (res && res.length > 0) deleted = true;
    } catch (err) {
      console.error('Neon deleteAdminUser error:', err);
    }
  }

  const locals = getLocalAdmins();
  const initialLength = locals.length;
  const filtered = locals.filter(a => 
    a.id !== idOrEmail && 
    a.email.toLowerCase() !== targetLower
  );
  if (filtered.length !== initialLength) {
    saveLocalAdmins(filtered);
    deleted = true;
  }

  return deleted;
}

export async function deleteMultipleAdminUsers(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return { deletedCount: 0 };
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const currentAdmins = await getAdminUsers();
  if (currentAdmins.length <= 1) {
    throw new Error('Cannot delete the last remaining administrator account.');
  }
  if (uniqueIds.length >= currentAdmins.length) {
    throw new Error('Cannot delete all administrator accounts. At least one administrator ID must remain.');
  }

  let deletedCount = 0;
  for (const id of uniqueIds) {
    const ok = await deleteAdminUser(id);
    if (ok) deletedCount++;
  }
  return { deletedCount };
}

/* ============================================================
   6. TRAINING & COURSE REGISTRATIONS DATA LAYER
   ============================================================ */

function formatCourseRegistration(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    candidate_id: String(row.candidate_id || ''),
    name: row.name || '',
    contact_number: row.contact_number || '',
    father_name: row.father_name || '',
    id_type: row.id_type || 'AADHAAR',
    id_number: row.id_number || '',
    email: row.email || '',
    course: row.course || 'Full Stack Web Development Course (HTML, CSS, JS, React, MySQL, Node.js, GitHub, Prompting etc.)',
    scanned: Boolean(row.scanned),
    scanned_at: row.scanned_at ? (row.scanned_at instanceof Date ? row.scanned_at.toISOString() : String(row.scanned_at)) : null,
    scan_lat: row.scan_lat !== null && row.scan_lat !== undefined && !isNaN(Number(row.scan_lat)) ? Number(row.scan_lat) : null,
    scan_long: row.scan_long !== null && row.scan_long !== undefined && !isNaN(Number(row.scan_long)) ? Number(row.scan_long) : null,
    scan_count: Number(row.scan_count || 0),
    payment_status: row.payment_status || 'Pending',
    notes: row.notes || '',
    created_at: row.created_at ? (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)) : new Date().toISOString(),
  };
}

let courseTablesInitialized = false;

async function ensureCourseTables(sql) {
  if (courseTablesInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS course_registrations (
        id TEXT PRIMARY KEY,
        candidate_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        father_name TEXT NOT NULL,
        id_type TEXT NOT NULL,
        id_number TEXT NOT NULL,
        email TEXT NOT NULL,
        course TEXT NOT NULL DEFAULT 'Full Stack Web Development Course (HTML, CSS, JS, React, MySQL, Node.js, GitHub, Prompting etc.)',
        scanned BOOLEAN NOT NULL DEFAULT FALSE,
        scanned_at TIMESTAMPTZ,
        scan_lat DOUBLE PRECISION,
        scan_long DOUBLE PRECISION,
        scan_count INT NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'Pending',
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    try { await sql`ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS scanned BOOLEAN DEFAULT FALSE;`; } catch {}
    try { await sql`ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ;`; } catch {}
    try { await sql`ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS scan_lat DOUBLE PRECISION;`; } catch {}
    try { await sql`ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS scan_long DOUBLE PRECISION;`; } catch {}
    try { await sql`ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS scan_count INT DEFAULT 0;`; } catch {}
    try { await sql`ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';`; } catch {}
    try { await sql`ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';`; } catch {}
    try { await sql`CREATE INDEX IF NOT EXISTS course_reg_created_at_idx ON course_registrations(created_at DESC);`; } catch {}
    try { await sql`CREATE INDEX IF NOT EXISTS course_reg_candidate_id_idx ON course_registrations(candidate_id);`; } catch {}

    await sql`
      CREATE TABLE IF NOT EXISTS course_scans (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        accuracy DOUBLE PRECISION,
        user_agent TEXT,
        ip_address TEXT
      );
    `;
    try { await sql`CREATE INDEX IF NOT EXISTS course_scans_cand_idx ON course_scans(candidate_id);`; } catch {}

    courseTablesInitialized = true;
  } catch (err) {
    console.error('Failed to ensure course tables in Neon Postgres:', err);
  }
}

function readDiskCourses() {
  try {
    if (fs.existsSync(PRIMARY_COURSES_FILE)) {
      const content = fs.readFileSync(PRIMARY_COURSES_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  try {
    if (fs.existsSync(TMP_COURSES_FILE)) {
      const content = fs.readFileSync(TMP_COURSES_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return null;
}

function getLocalCourses() {
  if (Array.isArray(globalThis.__STS_COURSES__)) {
    return globalThis.__STS_COURSES__;
  }

  const disk = readDiskCourses();
  if (disk) {
    globalThis.__STS_COURSES__ = disk;
    return disk;
  }

  const initial = [];
  globalThis.__STS_COURSES__ = initial;
  saveLocalCourses(initial);
  return initial;
}

function saveLocalCourses(courses) {
  globalThis.__STS_COURSES__ = courses;

  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_COURSES_FILE, JSON.stringify(courses, null, 2), 'utf8');
  } catch {}

  try {
    fs.writeFileSync(TMP_COURSES_FILE, JSON.stringify(courses, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save courses to temp directory:', err);
  }
}

function readDiskScans() {
  try {
    if (fs.existsSync(PRIMARY_SCANS_FILE)) {
      const content = fs.readFileSync(PRIMARY_SCANS_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function getLocalScans() {
  if (Array.isArray(globalThis.__STS_SCANS__)) {
    return globalThis.__STS_SCANS__;
  }
  const disk = readDiskScans();
  globalThis.__STS_SCANS__ = disk;
  return disk;
}

function saveLocalScans(scans) {
  globalThis.__STS_SCANS__ = scans;
  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_SCANS_FILE, JSON.stringify(scans, null, 2), 'utf8');
  } catch {}
  try {
    fs.writeFileSync(TMP_SCANS_FILE, JSON.stringify(scans, null, 2), 'utf8');
  } catch {}
}

export function computeNextCandidateId(idList = []) {
  let maxNum = 0;
  for (const raw of idList) {
    if (!raw) continue;
    // Match "cand 001", "cand-001", "cand001", etc.
    const match = String(raw).match(/\b(?:cand|CAND)[-_\s]*(\d+)\b/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `cand ${String(nextNum).padStart(3, '0')}`;
}

export async function getNextCandidateId() {
  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureCourseTables(sql);
      const rows = await sql`SELECT candidate_id FROM course_registrations;`;
      return computeNextCandidateId(rows.map(r => r.candidate_id));
    } catch (err) {
      console.warn('Neon getNextCandidateId error:', err);
    }
  }

  // 2. Supabase
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/course_registrations?select=candidate_id`, {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return computeNextCandidateId(data.map(d => d.candidate_id));
        }
      }
    } catch (err) {
      console.warn('Supabase getNextCandidateId error:', err);
    }
  }

  // 3. Local fallback
  const locals = getLocalCourses();
  return computeNextCandidateId(locals.map(l => l.candidate_id));
}

export async function createCourseRegistration({
  name,
  contact_number,
  father_name,
  id_type,
  id_number,
  email,
  course,
}) {
  const candidateId = await getNextCandidateId();
  const newRegistration = {
    id: 'course-reg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    candidate_id: candidateId,
    name: name || '',
    contact_number: contact_number || '',
    father_name: father_name || '',
    id_type: id_type || 'AADHAAR',
    id_number: id_number || '',
    email: email || '',
    course: course || 'Full Stack Web Development Course (HTML, CSS, JS, React, MySQL, Node.js, GitHub, Prompting etc.)',
    scanned: false,
    scanned_at: null,
    scan_lat: null,
    scan_long: null,
    scan_count: 0,
    payment_status: 'Pending',
    notes: '',
    created_at: new Date().toISOString(),
  };

  // 1. Neon Postgres (Primary)
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureCourseTables(sql);
      const rows = await sql`
        INSERT INTO course_registrations (
          id, candidate_id, name, contact_number, father_name, id_type, id_number, email, course, scanned, scanned_at, scan_lat, scan_long, scan_count, payment_status, notes, created_at
        )
        VALUES (
          ${newRegistration.id},
          ${newRegistration.candidate_id},
          ${newRegistration.name},
          ${newRegistration.contact_number},
          ${newRegistration.father_name},
          ${newRegistration.id_type},
          ${newRegistration.id_number},
          ${newRegistration.email},
          ${newRegistration.course},
          ${newRegistration.scanned},
          ${newRegistration.scanned_at},
          ${newRegistration.scan_lat},
          ${newRegistration.scan_long},
          ${newRegistration.scan_count},
          ${newRegistration.payment_status},
          ${newRegistration.notes},
          ${newRegistration.created_at}
        )
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        return formatCourseRegistration(rows[0]);
      }
      return newRegistration;
    } catch (err) {
      console.error('Neon createCourseRegistration error:', err);
      throw new Error('Database course registration failed: ' + err.message);
    }
  }

  // 2. Supabase
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/course_registrations`, {
        method: 'POST',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(newRegistration),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) return formatCourseRegistration(data[0]);
      }
    } catch (err) {
      console.warn('Supabase createCourseRegistration error:', err);
    }
  }

  // 3. Local fallback
  const locals = getLocalCourses();
  locals.unshift(newRegistration);
  saveLocalCourses(locals);
  return newRegistration;
}

export async function getCourseRegistrations(statusFilter) {
  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureCourseTables(sql);
      let rows;
      if (statusFilter && statusFilter !== 'All') {
        if (statusFilter === 'Scanned') {
          rows = await sql`SELECT * FROM course_registrations WHERE scanned = true ORDER BY created_at DESC LIMIT 500;`;
        } else if (statusFilter === 'Not Scanned') {
          rows = await sql`SELECT * FROM course_registrations WHERE scanned = false ORDER BY created_at DESC LIMIT 500;`;
        } else {
          rows = await sql`SELECT * FROM course_registrations WHERE payment_status = ${statusFilter} ORDER BY created_at DESC LIMIT 500;`;
        }
      } else {
        rows = await sql`SELECT * FROM course_registrations ORDER BY created_at DESC LIMIT 500;`;
      }
      return (rows || []).map(formatCourseRegistration);
    } catch (err) {
      console.error('Neon getCourseRegistrations error:', err);
      return [];
    }
  }

  // 2. Supabase
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      let url = `${cfg.url}/rest/v1/course_registrations?select=*&order=created_at.desc&limit=500`;
      if (statusFilter && statusFilter !== 'All') {
        if (statusFilter === 'Scanned') {
          url = `${cfg.url}/rest/v1/course_registrations?select=*&scanned=eq.true&order=created_at.desc&limit=500`;
        } else if (statusFilter === 'Not Scanned') {
          url = `${cfg.url}/rest/v1/course_registrations?select=*&scanned=eq.false&order=created_at.desc&limit=500`;
        } else {
          url = `${cfg.url}/rest/v1/course_registrations?select=*&payment_status=eq.${encodeURIComponent(statusFilter)}&order=created_at.desc&limit=500`;
        }
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
        if (Array.isArray(data)) return data.map(formatCourseRegistration);
      }
    } catch (err) {
      console.warn('Supabase getCourseRegistrations error:', err);
      return [];
    }
  }

  // 3. Local fallback
  const locals = getLocalCourses();
  if (statusFilter && statusFilter !== 'All') {
    if (statusFilter === 'Scanned') return locals.filter(c => c.scanned);
    if (statusFilter === 'Not Scanned') return locals.filter(c => !c.scanned);
    return locals.filter(c => c.payment_status === statusFilter);
  }
  return locals;
}

export async function getCourseRegistrationById(idOrCandidateId) {
  if (!idOrCandidateId) return null;
  const target = String(idOrCandidateId).trim();

  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureCourseTables(sql);
      const rows = await sql`
        SELECT * FROM course_registrations
        WHERE id = ${target} OR candidate_id = ${target} OR LOWER(candidate_id) = ${target.toLowerCase()}
        LIMIT 1;
      `;
      if (rows && rows.length > 0) return formatCourseRegistration(rows[0]);
    } catch (err) {
      console.error('Neon getCourseRegistrationById error:', err);
    }
  }

  // 2. Supabase
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/course_registrations?or=(id.eq.${encodeURIComponent(target)},candidate_id.eq.${encodeURIComponent(target)})&limit=1`, {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) return formatCourseRegistration(data[0]);
      }
    } catch (err) {
      console.warn('Supabase getCourseRegistrationById error:', err);
    }
  }

  // 3. Local fallback
  const locals = getLocalCourses();
  const found = locals.find(c => 
    c.id === target || 
    c.candidate_id?.toLowerCase() === target.toLowerCase()
  );
  return found || null;
}

export async function recordQrScan({ id, candidate_id, latitude, longitude, accuracy, user_agent, ip_address }) {
  const nowIso = new Date().toISOString();
  const scanId = 'scan-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const latNum = latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null;
  const longNum = longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null;
  const accNum = accuracy !== undefined && accuracy !== null && !isNaN(Number(accuracy)) ? Number(accuracy) : null;

  let updatedRecord = null;

  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureCourseTables(sql);
      const rows = await sql`
        UPDATE course_registrations
        SET 
          scanned = true,
          scanned_at = ${nowIso},
          scan_lat = COALESCE(${latNum}, scan_lat),
          scan_long = COALESCE(${longNum}, scan_long),
          scan_count = COALESCE(scan_count, 0) + 1,
          payment_status = CASE WHEN payment_status = 'Pending' THEN 'Scanned' ELSE payment_status END
        WHERE id = ${id || ''} OR candidate_id = ${candidate_id || ''} OR LOWER(candidate_id) = ${(candidate_id || '').toLowerCase()}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        updatedRecord = formatCourseRegistration(rows[0]);
      }

      await sql`
        INSERT INTO course_scans (id, candidate_id, scanned_at, latitude, longitude, accuracy, user_agent, ip_address)
        VALUES (${scanId}, ${candidate_id || (updatedRecord?.candidate_id || '')}, ${nowIso}, ${latNum}, ${longNum}, ${accNum}, ${user_agent || ''}, ${ip_address || ''});
      `;

      if (updatedRecord) return updatedRecord;
    } catch (err) {
      console.error('Neon recordQrScan error:', err);
    }
  }

  // 2. Supabase
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const matchParam = id ? `id=eq.${encodeURIComponent(id)}` : `candidate_id=eq.${encodeURIComponent(candidate_id)}`;
      const res = await fetch(`${cfg.url}/rest/v1/course_registrations?${matchParam}`, {
        method: 'PATCH',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          scanned: true,
          scanned_at: nowIso,
          scan_lat: latNum,
          scan_long: longNum,
          payment_status: 'Scanned',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) updatedRecord = formatCourseRegistration(data[0]);
      }

      await fetch(`${cfg.url}/rest/v1/course_scans`, {
        method: 'POST',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: scanId,
          candidate_id: candidate_id || (updatedRecord?.candidate_id || ''),
          scanned_at: nowIso,
          latitude: latNum,
          longitude: longNum,
          accuracy: accNum,
          user_agent: user_agent || '',
          ip_address: ip_address || '',
        }),
      }).catch(() => {});

      if (updatedRecord) return updatedRecord;
    } catch (err) {
      console.warn('Supabase recordQrScan error:', err);
    }
  }

  // 3. Local fallback
  const locals = getLocalCourses();
  const idx = locals.findIndex(c => 
    (id && c.id === id) || 
    (candidate_id && (c.candidate_id === candidate_id || c.candidate_id?.toLowerCase() === candidate_id.toLowerCase()))
  );
  if (idx !== -1) {
    locals[idx] = {
      ...locals[idx],
      scanned: true,
      scanned_at: nowIso,
      scan_lat: latNum !== null ? latNum : locals[idx].scan_lat,
      scan_long: longNum !== null ? longNum : locals[idx].scan_long,
      scan_count: (locals[idx].scan_count || 0) + 1,
      payment_status: locals[idx].payment_status === 'Pending' ? 'Scanned' : locals[idx].payment_status,
    };
    saveLocalCourses(locals);
    updatedRecord = locals[idx];
  }

  const scans = getLocalScans();
  scans.unshift({
    id: scanId,
    candidate_id: candidate_id || (updatedRecord?.candidate_id || ''),
    scanned_at: nowIso,
    latitude: latNum,
    longitude: longNum,
    accuracy: accNum,
    user_agent: user_agent || '',
    ip_address: ip_address || '',
  });
  saveLocalScans(scans);

  return updatedRecord;
}

export async function updateCourseRegistration(id, updates = {}) {
  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureCourseTables(sql);
      let rows;
      if (updates.payment_status && updates.notes !== undefined) {
        rows = await sql`
          UPDATE course_registrations
          SET payment_status = ${updates.payment_status}, notes = ${updates.notes}
          WHERE id = ${id}
          RETURNING *;
        `;
      } else if (updates.payment_status) {
        rows = await sql`
          UPDATE course_registrations
          SET payment_status = ${updates.payment_status}
          WHERE id = ${id}
          RETURNING *;
        `;
      } else if (updates.notes !== undefined) {
        rows = await sql`
          UPDATE course_registrations
          SET notes = ${updates.notes}
          WHERE id = ${id}
          RETURNING *;
        `;
      }
      if (rows && rows.length > 0) return formatCourseRegistration(rows[0]);
      return null;
    } catch (err) {
      console.error('Neon updateCourseRegistration error:', err);
      return null;
    }
  }

  // 2. Supabase
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/course_registrations?id=eq.${encodeURIComponent(id)}`, {
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
        if (data?.[0]) return formatCourseRegistration(data[0]);
      }
    } catch (err) {
      console.warn('Supabase updateCourseRegistration error:', err);
    }
  }

  // 3. Local fallback
  const locals = getLocalCourses();
  const idx = locals.findIndex(c => c.id === id);
  if (idx !== -1) {
    locals[idx] = { ...locals[idx], ...updates };
    saveLocalCourses(locals);
    return locals[idx];
  }
  return null;
}

export async function deleteCourseRegistration(id) {
  // 1. Neon Postgres
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureCourseTables(sql);
      const res = await sql`
        DELETE FROM course_registrations
        WHERE id = ${id}
        RETURNING id;
      `;
      return Boolean(res && res.length > 0);
    } catch (err) {
      console.error('Neon deleteCourseRegistration error:', err);
      return false;
    }
  }

  // 2. Supabase
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/course_registrations?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
      });
      return res.ok;
    } catch (err) {
      console.warn('Supabase deleteCourseRegistration error:', err);
      return false;
    }
  }

  // 3. Local fallback
  const locals = getLocalCourses();
  const idx = locals.findIndex(c => c.id === id);
  if (idx !== -1) {
    locals.splice(idx, 1);
    saveLocalCourses(locals);
    return true;
  }
  return false;
}


