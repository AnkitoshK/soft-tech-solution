import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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

function readDiskLeads() {
  // 1. Try primary file in project directory
  try {
    if (fs.existsSync(PRIMARY_DATA_FILE)) {
      const content = fs.readFileSync(PRIMARY_DATA_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // 2. Try temp file in os.tmpdir() (used in serverless environments like Vercel)
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

  // Try writing to primary project .data dir
  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch {
    // Read-only filesystem (Vercel serverless)
  }

  // Also write to os.tmpdir() for serverless persistence
  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save to temp directory:', err);
  }
}

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
        if (saved) {
          const leads = getLocalLeads();
          leads.unshift(saved);
          saveLocalLeads(leads);
          return saved;
        }
      } else {
        const errText = await res.text();
        console.warn('Supabase insert returned error, saving locally:', errText);
      }
    } catch (err) {
      console.warn('Supabase connection error, saving locally:', err);
    }
  }

  // Persistent local file + in-memory storage fallback
  const leads = getLocalLeads();
  leads.unshift(newLead);
  saveLocalLeads(leads);
  return newLead;
}

export async function getEnquiries(statusFilter) {
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
        if (Array.isArray(data)) return data;
      } else {
        const errText = await res.text();
        console.warn('Supabase query returned error, fetching locally:', errText);
      }
    } catch (err) {
      console.warn('Supabase fetch exception, fetching locally:', err);
    }
  }

  const leads = getLocalLeads();
  if (statusFilter && statusFilter !== 'All') {
    return leads.filter(l => l.status === statusFilter);
  }
  return leads;
}

export async function updateEnquiry(id, updates) {
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
        if (data?.[0]) {
          const leads = getLocalLeads();
          const idx = leads.findIndex(l => l.id === id);
          if (idx !== -1) {
            leads[idx] = { ...leads[idx], ...data[0] };
            saveLocalLeads(leads);
          }
          return data[0];
        }
      }
    } catch (err) {
      console.warn('Supabase patch failed, updating locally:', err);
    }
  }

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
      console.warn('Supabase delete failed, deleting locally:', err);
    }
  }

  const leads = getLocalLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index !== -1) {
    leads.splice(index, 1);
    saveLocalLeads(leads);
    return true;
  }
  return false;
}

