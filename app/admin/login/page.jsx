'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    role: 'Admin',
    password: '',
    confirmPassword: '',
  });
  const [forgotForm, setForgotForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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

  const switchMode = (newMode) => {
    setError('');
    setSuccessMsg('');
    setMode(newMode);
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('sts_admin_token', data.token);
        }
        showToast(`Welcome back, ${data.name || 'Admin'}!`, 'success');
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch {
      setError('Unable to reach authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register New Admin
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          role: registerForm.role,
          password: registerForm.password,
          autoLogin: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('sts_admin_token', data.token);
        }
        showToast('Admin account created successfully! Redirecting…', 'success');
        router.push('/admin');
      } else {
        setError(data.error || 'Could not create admin account.');
      }
    } catch {
      setError('Failed to reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError('Passwords do not match. Please check.');
      return;
    }

    if (forgotForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotForm.email,
          newPassword: forgotForm.newPassword,
          confirmPassword: forgotForm.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || 'Password reset successfully! Please sign in with your new password.');
        showToast('Password updated successfully!', 'success');
        // Pre-fill login email and switch to login after 1.5s
        setLoginForm(prev => ({ ...prev, email: forgotForm.email, password: '' }));
        setTimeout(() => {
          switchMode('login');
        }, 1600);
      } else {
        setError(data.error || 'Password reset failed.');
      }
    } catch {
      setError('Could not reach server. Please try again.');
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
    <div style={{ minHeight: '88vh', display: 'grid', placeItems: 'center', background: '#f5f7fb', padding: '40px 20px' }}>
      <div 
        style={{
          background: '#ffffff',
          width: 'min(480px, 100%)',
          padding: '36px 36px 40px',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(24, 34, 56, 0.1)',
          border: '1px solid #e5ebf4',
        }}
      >
        {/* BRAND LOGO HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
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

        {/* MODE SWITCHER TABS */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          margin: '18px 0 24px',
          gap: '4px',
        }}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? 'var(--navy)' : '#64748b',
              boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? 'var(--navy)' : '#64748b',
              boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            + New Admin
          </button>
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'forgot' ? '#ffffff' : 'transparent',
              color: mode === 'forgot' ? 'var(--navy)' : '#64748b',
              boxShadow: mode === 'forgot' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Reset Pass
          </button>
        </div>

        {/* FEEDBACK ALERTS */}
        {error && (
          <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '18px', background: '#fef2f2', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{ color: '#166534', fontSize: '13px', marginBottom: '18px', background: '#dcfce7', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* ==============================================================
            MODE 1: SIGN IN FORM
            ============================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <h1 style={{ fontSize: '26px', margin: '0 0 6px', color: '#182238' }}>Admin Login</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '22px' }}>
              Authorized administrator access to manage inquiries &amp; proposals.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                Admin Email
              </label>
              <input 
                type="email" 
                required
                placeholder="admin@softtechsolution.com"
                value={loginForm.email}
                onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
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

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--blue)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
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

            <button 
              type="submit" 
              className="button primary" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '16px' }}
            >
              {loading ? 'Authenticating…' : 'Sign in to Admin Dashboard →'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4b5563',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Need new access? <span style={{ color: 'var(--orange)' }}>+ Create Admin Account</span>
              </button>
            </div>

            <div style={{ marginTop: '22px', padding: '12px', background: '#f8fafc', borderRadius: '10px', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              🔒 <b>Master Admin Access:</b><br />
              Default Credentials: <code>admin@softtechsolution.com</code> / <code>admin123</code><br />
              All newly registered administrators can log in here.
            </div>
          </form>
        )}

        {/* ==============================================================
            MODE 2: REGISTER NEW ADMIN FORM
            ============================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <h1 style={{ fontSize: '26px', margin: '0 0 6px', color: '#182238' }}>Create New Admin</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '22px' }}>
              Register a new administrative member for Soft Tech Solution.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                Full Name
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Aashutosh Kumar / Ankitosh Kumar"
                value={registerForm.name}
                onChange={e => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d9dfeb',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                Admin Email Address
              </label>
              <input 
                type="email" 
                required
                placeholder="name@softtechsolution.com"
                value={registerForm.email}
                onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d9dfeb',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                Role &amp; Responsibility
              </label>
              <select
                value={registerForm.role}
                onChange={e => setRegisterForm(prev => ({ ...prev, role: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d9dfeb',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#ffffff',
                }}
              >
                <option value="Admin">Administrator</option>
                <option value="Tech Lead">Tech Lead (Engineering)</option>
                <option value="Strategy Lead">Strategy Lead (Business)</option>
                <option value="Operations">Operations &amp; Client Success</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                  Password
                </label>
                <input 
                  type="password" 
                  required
                  placeholder="Min 6 chars"
                  value={registerForm.password}
                  onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #d9dfeb',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                  Confirm
                </label>
                <input 
                  type="password" 
                  required
                  placeholder="Repeat pass"
                  value={registerForm.confirmPassword}
                  onChange={e => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #d9dfeb',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="button primary" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              {loading ? 'Creating Account…' : 'Create Admin & Sign In →'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ← Already registered? Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ==============================================================
            MODE 3: FORGOT / RESET PASSWORD FORM
            ============================================================== */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <h1 style={{ fontSize: '26px', margin: '0 0 6px', color: '#182238' }}>Reset Password</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '22px' }}>
              Update credentials for your registered administrator account.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                Admin Email Address
              </label>
              <input 
                type="email" 
                required
                placeholder="admin@softtechsolution.com"
                value={forgotForm.email}
                onChange={e => setForgotForm(prev => ({ ...prev, email: e.target.value }))}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                New Password
              </label>
              <input 
                type="password" 
                required
                placeholder="Min 6 characters"
                value={forgotForm.newPassword}
                onChange={e => setForgotForm(prev => ({ ...prev, newPassword: e.target.value }))}
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
                Confirm New Password
              </label>
              <input 
                type="password" 
                required
                placeholder="Repeat new password"
                value={forgotForm.confirmPassword}
                onChange={e => setForgotForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
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

            <button 
              type="submit" 
              className="button primary" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              {loading ? 'Updating Password…' : 'Reset Password & Continue →'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
