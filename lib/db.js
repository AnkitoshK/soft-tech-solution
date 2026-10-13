import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'enquiries.json');

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

function getLocalLeads() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SAMPLE_LEADS, null, 2), 'utf8');
      return [...INITIAL_SAMPLE_LEADS];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch {
    return [...INITIAL_SAMPLE_LEADS];
  }
}

function saveLocalLeads(leads) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save leads locally:', err);
  }
}

function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !url.includes('YOUR_PROJECT') && !key.includes('YOUR_SUPABASE'));
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

function supabaseUrl(path = '') {
  return `${process.env.SUPABASE_URL}/rest/v1/${path}`;
}

export async function createEnquiry({ name, email, phone, service, message }) {
  if (isSupabaseConfigured()) {
    const res = await fetch(supabaseUrl('enquiries'), {
      method: 'POST',
      headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({
        name,
        email,
        phone,
        service,
        message,
        status: 'New',
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error: ${err}`);
    }
    const data = await res.json();
    return data?.[0] || { id: 'created' };
  }

  // Persistent local file storage
  const leads = getLocalLeads();
  const newLead = {
    id: 'lead-' + Date.now(),
    name,
    email,
    phone,
    service,
    message,
    status: 'New',
    notes: '',
    created_at: new Date().toISOString(),
  };
  leads.unshift(newLead);
  saveLocalLeads(leads);
  return newLead;
}

export async function getEnquiries(statusFilter) {
  if (isSupabaseConfigured()) {
    let url = supabaseUrl('enquiries?select=*&order=created_at.desc&limit=500');
    if (statusFilter && statusFilter !== 'All') {
      url = supabaseUrl(`enquiries?select=*&status=eq.${encodeURIComponent(statusFilter)}&order=created_at.desc&limit=500`);
    }
    const res = await fetch(url, {
      headers: supabaseHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error: ${err}`);
    }
    return await res.json();
  }

  // Local storage
  const leads = getLocalLeads();
  if (statusFilter && statusFilter !== 'All') {
    return leads.filter(l => l.status === statusFilter);
  }
  return leads;
}

export async function updateEnquiry(id, updates) {
  if (isSupabaseConfigured()) {
    const res = await fetch(supabaseUrl(`enquiries?id=eq.${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error: ${err}`);
    }
    const data = await res.json();
    return data?.[0];
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
  if (isSupabaseConfigured()) {
    const res = await fetch(supabaseUrl(`enquiries?id=eq.${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: { ...supabaseHeaders(), Prefer: 'return=minimal' },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error: ${err}`);
    }
    return true;
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
