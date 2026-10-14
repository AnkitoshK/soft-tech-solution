'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    async function checkAuth() {
      try {
        const token = localStorage.getItem('sts_admin_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('/api/login', { headers });
        const data = await res.json();
        if (data.authenticated) {
          router.replace('/admin');
          return;
        }
      } catch {
        // Not authenticated
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('sts_admin_token', data.token);
        }
        showToast('Login successful! Welcome to the Admin Panel.', 'success');
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', background: '#f5f7fb' }}>
        <p style={{ color: 'var(--navy)', fontWeight: 600 }}>Verifying admin session…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', display: 'grid', placeItems: 'center', background: '#f5f7fb', padding: '40px 20px' }}>
      <form 
        onSubmit={handleSubmit}
        style={{
          background: '#ffffff',
          width: 'min(440px, 100%)',
          padding: '40px',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(24, 34, 56, 0.1)',
          border: '1px solid #e5ebf4',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <img 
            src="/soft-tech-logo-transparent.png" 
            alt="SoftTech Solution" 
            style={{ width: '38px', height: '38px', objectFit: 'contain' }} 
          />
          <div className="brand-lockup">
            <span className="brand-shared-s" style={{ fontSize: '34px' }}>S</span>
            <div className="brand-text-stack">
              <span className="brand-top-text" style={{ fontSize: '16px' }}>
                oft<b className="brand-tech-highlight">Tech</b>
              </span>
              <span className="brand-bottom-text" style={{ fontSize: '11px' }}>
                olution
              </span>
            </div>
          </div>
        </div>
        <h1 style={{ fontSize: '30px', margin: '14px 0 6px', color: '#182238' }}>Admin Login</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          Authorized administrator access to manage inquiries.
        </p>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
            Admin Email
          </label>
          <input 
            type="email" 
            required
            placeholder="admin@softtechsolution.com"
            value={form.email}
            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #d9dfeb',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
            Password
          </label>
          <input 
            type="password" 
            required
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #d9dfeb',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="button primary" 
          disabled={loading}
          style={{ width: '100%', padding: '14px', fontSize: '15px' }}
        >
          {loading ? 'Authenticating…' : 'Sign in to Admin Dashboard →'}
        </button>

        <div style={{ marginTop: '22px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
          🔒 <b>Admin Access Note:</b><br />
          Default Credentials: <code>admin@softtechsolution.com</code> / <code>admin123</code><br />
          Production credentials configured via <code>.env.local</code> / Vercel.
        </div>
      </form>
    </div>
  );
}
