'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ email: '', name: '', role: '' });

  // Tab: 'leads' | 'admins'
  const [activeTab, setActiveTab] = useState('leads');

  // Leads State
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Admin Users State
  const [admins, setAdmins] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showNewAdminModal, setShowNewAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    role: 'Admin',
    password: '',
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Password Reset Modal State
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Admin IDs Search, View & Batch Deletion State
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminViewMode, setAdminViewMode] = useState('table'); // 'table' | 'grid'
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(`Copied Admin ID: ${text}`, 'info');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('sts_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db-status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDbInfo(data);
      }
    } catch {}
  }, []);

  const loadLeads = useCallback(async (status = 'All') => {
    setRefreshing(true);
    try {
      const url = `/api/enquiries${status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.status === 401) {
        setAuthenticated(false);
        localStorage.removeItem('sts_admin_token');
        router.replace('/admin/login');
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error ${res.status}`);
      }
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
      fetchDbStatus();
    } catch (err) {
      showToast('Could not load enquiries: ' + err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  }, [router, showToast, fetchDbStatus]);

  const loadAdmins = useCallback(async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Could not load admins:', err);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/login', {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          setCurrentUser({
            email: data.email || '',
            name: data.name || 'Admin',
            role: data.role || 'Admin',
          });
          loadLeads(statusFilter);
          fetchDbStatus();
          loadAdmins();
        } else {
          setAuthenticated(false);
          router.replace('/admin/login');
        }
      } catch {
        setAuthenticated(false);
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, statusFilter, loadLeads, fetchDbStatus, loadAdmins]);

  const handleLogout = async () => {
    try {
      await fetch('/api/login', { method: 'DELETE', headers: getAuthHeaders() });
    } finally {
      localStorage.removeItem('sts_admin_token');
      setAuthenticated(false);
      showToast('Signed out successfully.', 'info');
      router.replace('/admin/login');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/enquiries?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)));
        showToast(`Lead status updated to ${newStatus}`, 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch {
      showToast('Could not update status.', 'error');
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry permanently?')) return;
    try {
      const res = await fetch(`/api/enquiries?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        showToast('Enquiry deleted.', 'info');
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      showToast('Could not delete enquiry.', 'error');
    }
  };

  // Create new admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminForm.name || newAdminForm.name.trim().length < 2) {
      showToast('Name must be at least 2 characters.', 'error');
      return;
    }
    if (!newAdminForm.email || !newAdminForm.email.includes('@')) {
      showToast('Valid admin email is required.', 'error');
      return;
    }
    if (!newAdminForm.password || newAdminForm.password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newAdminForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'New admin account created!', 'success');
        setShowNewAdminModal(false);
        setNewAdminForm({ name: '', email: '', role: 'Admin', password: '' });
        loadAdmins();
      } else {
        showToast(data.error || 'Failed to create admin.', 'error');
      }
    } catch {
      showToast('Could not connect to server.', 'error');
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Reset admin password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTargetUser || !resetTargetUser.email) return;
    if (!newPasswordValue || newPasswordValue.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          email: resetTargetUser.email,
          newPassword: newPasswordValue,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Password updated successfully!', 'success');
        setShowResetPassModal(false);
        setResetTargetUser(null);
        setNewPasswordValue('');
      } else {
        showToast(data.error || 'Failed to update password.', 'error');
      }
    } catch {
      showToast('Server error resetting password.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Delete single admin ID (allows deleting master or normal ID)
  const handleDeleteAdmin = async (adminUser) => {
    if (admins.length <= 1) {
      showToast('Cannot delete the last remaining administrator account. At least one admin ID must exist.', 'error');
      return;
    }

    const isCurrentLoggedIn = currentUser.email && adminUser.email && 
      currentUser.email.toLowerCase() === adminUser.email.toLowerCase();

    const isMaster = adminUser.isMaster || adminUser.id === 'master_admin';

    let confirmMsg = `Are you sure you want to permanently delete ${isMaster ? 'Master ' : ''}Admin ID "${adminUser.id}" for "${adminUser.name}" (${adminUser.email})?`;
    if (isCurrentLoggedIn) {
      confirmMsg += `\n\n⚠️ NOTE: This is your currently logged-in account. Deleting it will log you out immediately.`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(adminUser.id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Admin ID "${adminUser.id}" deleted successfully.`, 'info');
        setSelectedAdminIds(prev => prev.filter(id => id !== adminUser.id));

        if (isCurrentLoggedIn) {
          localStorage.removeItem('sts_admin_token');
          setAuthenticated(false);
          router.replace('/admin/login');
          return;
        }

        loadAdmins();
      } else {
        showToast(data.error || 'Could not delete admin ID.', 'error');
      }
    } catch {
      showToast('Server error removing admin ID.', 'error');
    }
  };

  // Batch delete multiple selected admin IDs
  const handleBatchDeleteAdmins = async () => {
    if (!selectedAdminIds.length) {
      showToast('Please select at least one Admin ID to delete.', 'error');
      return;
    }

    if (admins.length - selectedAdminIds.length < 1) {
      showToast('Cannot delete all administrator accounts. At least one admin ID must remain.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete all ${selectedAdminIds.length} selected Admin ID(s)? This action is permanent.`)) {
      return;
    }

    setIsDeletingBatch(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ids: selectedAdminIds }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `${selectedAdminIds.length} Admin ID(s) deleted successfully.`, 'info');
        setSelectedAdminIds([]);

        // If current user's email was among deleted IDs, log out
        const currentUserDeleted = admins.some(a => 
          selectedAdminIds.includes(a.id) && 
          currentUser.email && 
          a.email && 
          a.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (currentUserDeleted) {
          localStorage.removeItem('sts_admin_token');
          setAuthenticated(false);
          router.replace('/admin/login');
          return;
        }

        loadAdmins();
      } else {
        showToast(data.error || 'Failed to delete selected Admin IDs.', 'error');
      }
    } catch {
      showToast('Server error deleting Admin IDs.', 'error');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const exportCSV = () => {
    if (!leads.length) {
      showToast('No leads available to export.', 'info');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Service', 'Message', 'Status', 'Date'];
    const rows = leads.map(l => [
      `"${l.id}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.service || '').replace(/"/g, '""')}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.status || 'New'}"`,
      `"${new Date(l.created_at).toLocaleString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `soft-tech-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const str = `${l.name} ${l.email} ${l.phone} ${l.service} ${l.message}`.toLowerCase();
    return str.includes(q);
  });

  const filteredAdmins = admins.filter(adm => {
    const q = adminSearchQuery.toLowerCase();
    const str = `${adm.id || ''} ${adm.name || ''} ${adm.email || ''} ${adm.role || ''}`.toLowerCase();
    return str.includes(q);
  });

  const totalCount = leads.length;
  const newCount = leads.filter(l => l.status === 'New').length;
  const contactedCount = leads.filter(l => l.status === 'Contacted').length;
  const convertedCount = leads.filter(l => l.status === 'Converted').length;

  if (loading || !authenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', background: '#f5f7fb' }}>
        <p style={{ color: 'var(--navy)', fontWeight: 600 }}>Authenticating admin access…</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f7fb', minHeight: '90vh', paddingBottom: '60px' }}>
      {/* ADMIN HEADER */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e9f1', padding: '18px 0' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <img 
                src="/soft-tech-logo-transparent.png" 
                alt="SoftTech Solution" 
                style={{ width: '34px', height: '34px', objectFit: 'contain' }} 
              />
              <div className="brand-lockup">
                <span className="brand-shared-s" style={{ fontSize: '30px' }}>S</span>
                <div className="brand-text-stack">
                  <span className="brand-top-text" style={{ fontSize: '15px' }}>
                    oft<b className="brand-tech-highlight">Tech</b>
                  </span>
                  <span className="brand-bottom-text" style={{ fontSize: '10px' }}>
                    olution
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginLeft: '6px' }}>/ Admin Dashboard</span>
              
              {/* DATABASE STATUS BADGE */}
              {dbInfo && (
                <span 
                  onClick={() => setShowSetupModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: dbInfo.connected ? '#dcfce7' : '#fef3c7',
                    color: dbInfo.connected ? '#15803d' : '#b45309',
                    border: `1px solid ${dbInfo.connected ? '#bbf7d0' : '#fde68a'}`,
                    marginLeft: '8px',
                    cursor: 'pointer',
                  }}
                  title={dbInfo.message}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dbInfo.connected ? '#22c55e' : '#f59e0b' }}></span>
                  {dbInfo.badge}
                </span>
              )}

              {/* CURRENT LOGGED IN USER BADGE */}
              {currentUser.email && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#f1f5f9',
                  color: '#475569',
                  marginLeft: '4px',
                }}>
                  👤 {currentUser.name || currentUser.email} ({currentUser.role})
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
              Leadership: Founder Aashutosh Kumar (+91 9117696512) · Co-Founder Ankitosh Kumar (+91 6205570278)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {activeTab === 'leads' && (
              <>
                <button 
                  onClick={() => loadLeads(statusFilter)} 
                  className="button outline"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing…' : '🔄 Refresh'}
                </button>
                <button 
                  onClick={exportCSV} 
                  className="button outline"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  📥 Export CSV
                </button>
              </>
            )}

            {activeTab === 'admins' && (
              <button 
                onClick={() => setShowNewAdminModal(true)} 
                className="button primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Add New Admin
              </button>
            )}

            <button 
              onClick={handleLogout} 
              className="button outline"
              style={{ padding: '8px 16px', fontSize: '13px', color: '#dc2626', borderColor: '#fca5a5' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="wrap" style={{ marginTop: '24px' }}>

        {/* CLOUD DATABASE NOTICE BANNER */}
        {dbInfo && !dbInfo.connected && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fcd34d',
            borderRadius: '16px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>⚡</span>
              <div>
                <b style={{ color: '#92400e', fontSize: '15px', display: 'block' }}>
                  Enable Permanent Cloud Storage (Neon Postgres)
                </b>
                <p style={{ color: '#78350f', fontSize: '13px', margin: '3px 0 0', lineHeight: 1.5 }}>
                  Vercel serverless containers are ephemeral. Connect free Neon Postgres under your Vercel project's <b>Storage</b> tab so every client proposal is saved permanently.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSetupModal(true)}
              className="button primary"
              style={{ padding: '9px 18px', fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              30-Sec Setup Guide ↗
            </button>
          </div>
        )}

        {/* SEGMENTED TAB SWITCHER */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'leads' ? '3px solid var(--orange)' : '3px solid transparent',
              color: activeTab === 'leads' ? 'var(--navy)' : '#64748b',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>📋</span> Client Proposals &amp; Enquiries
            <span style={{
              background: activeTab === 'leads' ? '#fff7ed' : '#f1f5f9',
              color: activeTab === 'leads' ? 'var(--orange)' : '#64748b',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              border: `1px solid ${activeTab === 'leads' ? '#fed7aa' : '#e2e8f0'}`,
            }}>
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admins');
              loadAdmins();
            }}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'admins' ? '3px solid var(--orange)' : '3px solid transparent',
              color: activeTab === 'admins' ? 'var(--navy)' : '#64748b',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>👥</span> Admin IDs &amp; Access Control
            <span style={{
              background: activeTab === 'admins' ? '#fff7ed' : '#f1f5f9',
              color: activeTab === 'admins' ? 'var(--orange)' : '#64748b',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              border: `1px solid ${activeTab === 'admins' ? '#fed7aa' : '#e2e8f0'}`,
            }}>
              {admins.length || 1} IDs
            </span>
          </button>
        </div>

        {/* ==============================================================
            TAB 1: CLIENT LEADS & ENQUIRIES VIEW
            ============================================================== */}
        {activeTab === 'leads' && (
          <>
            {/* STATS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
              <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(24, 34, 56, 0.05)', border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Total Inquiries</span>
                <b style={{ display: 'block', fontSize: '32px', fontFamily: 'Poppins, sans-serif', color: 'var(--navy)', marginTop: '4px' }}>{totalCount}</b>
              </div>

              <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(24, 34, 56, 0.05)', border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: '13px', color: '#e67831', fontWeight: 600 }}>New Requests</span>
                <b style={{ display: 'block', fontSize: '32px', fontFamily: 'Poppins, sans-serif', color: 'var(--orange)', marginTop: '4px' }}>{newCount}</b>
              </div>

              <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(24, 34, 56, 0.05)', border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: '13px', color: '#1f7db9', fontWeight: 600 }}>In Contact</span>
                <b style={{ display: 'block', fontSize: '32px', fontFamily: 'Poppins, sans-serif', color: 'var(--blue)', marginTop: '4px' }}>{contactedCount}</b>
              </div>

              <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(24, 34, 56, 0.05)', border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>Converted Clients</span>
                <b style={{ display: 'block', fontSize: '32px', fontFamily: 'Poppins, sans-serif', color: '#16a34a', marginTop: '4px' }}>{convertedCount}</b>
              </div>
            </div>

            {/* SEARCH & FILTERS TOOLBAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Search by name, email, phone, or service..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: '1 1 300px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #d9dfeb',
                  background: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['All', 'New', 'Contacted', 'Proposal Sent', 'Converted', 'Archived'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      loadLeads(status);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid',
                      cursor: 'pointer',
                      background: statusFilter === status ? 'var(--navy)' : '#ffffff',
                      color: statusFilter === status ? '#ffffff' : '#4b5563',
                      borderColor: statusFilter === status ? 'var(--navy)' : '#d9dfeb',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* LEADS LIST / TABLE */}
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #edf2f7', overflow: 'hidden', boxShadow: '0 4px 25px rgba(24, 34, 56, 0.04)' }}>
              {filteredLeads.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>📭</span>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy)' }}>No inquiries found</p>
                  <p style={{ fontSize: '13px', maxWidth: '400px', margin: '4px auto 0' }}>
                    {searchQuery ? 'Try adjusting your search criteria.' : 'When clients request a proposal, their details appear here in real time.'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '16px 20px' }}>Client</th>
                        <th style={{ padding: '16px 20px' }}>Service</th>
                        <th style={{ padding: '16px 20px' }}>Status</th>
                        <th style={{ padding: '16px 20px' }}>Date</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => (
                        <tr 
                          key={lead.id} 
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fbfcfe'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#182238' }}>{lead.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                              <span>{lead.email}</span>
                              {lead.phone && <span>• {lead.phone}</span>}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: '1px solid #bbf7d0',
                            }}>
                              {lead.service || 'General Inquiry'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <select
                              value={lead.status || 'New'}
                              onChange={e => handleStatusChange(lead.id, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: '1px solid #d9dfeb',
                                background: lead.status === 'New' ? '#fff7ed' :
                                            lead.status === 'Contacted' ? '#eff6ff' :
                                            lead.status === 'Converted' ? '#dcfce7' : '#ffffff',
                                color: lead.status === 'New' ? '#c2410c' :
                                       lead.status === 'Contacted' ? '#1d4ed8' :
                                       lead.status === 'Converted' ? '#15803d' : '#374151',
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Proposal Sent">Proposal Sent</option>
                              <option value="Converted">Converted</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '13px' }}>
                            {new Date(lead.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              style={{
                                background: 'none',
                                border: '1px solid #e2e8f0',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--blue)',
                                cursor: 'pointer',
                                marginRight: '8px',
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              style={{
                                background: 'none',
                                border: '1px solid #fee2e2',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#dc2626',
                                cursor: 'pointer',
                              }}
                              title="Delete enquiry"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ==============================================================
            TAB 2: ADMIN IDS & ACCESS CONTROL VIEW
            ============================================================== */}
        {activeTab === 'admins' && (
          <div>
            {/* HEADER & QUICK STATS */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div>
                <h2 style={{ fontSize: '22px', color: 'var(--navy)', margin: 0 }}>
                  Administrator Accounts &amp; IDs
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                  Manage registered admin IDs, copy unique ID tokens, or permanently delete unnecessary and test IDs.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                  }}>
                    Total IDs: <b>{admins.length}</b>
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                  }}>
                    Created IDs: <b>{admins.filter(a => !a.isMaster && a.id !== 'master_admin').length}</b>
                  </span>
                  {selectedAdminIds.length > 0 && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #fecaca',
                    }}>
                      Selected to Delete: <b>{selectedAdminIds.length}</b>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAdminModal(true)}
                className="button primary"
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                + Add New Admin ID
              </button>
            </div>

            {/* ACTION TOOLBAR: SEARCH, BATCH DELETE, AND VIEW TOGGLE */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="🔍 Search Admin ID, name, or email…"
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {adminSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAdminSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: '14px',
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {selectedAdminIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchDeleteAdmins}
                    disabled={isDeletingBatch}
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                    }}
                    title="Permanently delete all selected admin IDs"
                  >
                    🗑 Delete Selected IDs ({selectedAdminIds.length})
                  </button>
                )}
              </div>

              {/* VIEW SWITCHER */}
              <div style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                borderRadius: '8px',
                padding: '3px',
                gap: '2px',
                border: '1px solid #e2e8f0',
              }}>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('table')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: adminViewMode === 'table' ? '#ffffff' : 'transparent',
                    color: adminViewMode === 'table' ? 'var(--navy)' : '#64748b',
                    fontWeight: adminViewMode === 'table' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: adminViewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  ☷ Table View
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('grid')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: adminViewMode === 'grid' ? '#ffffff' : 'transparent',
                    color: adminViewMode === 'grid' ? 'var(--navy)' : '#64748b',
                    fontWeight: adminViewMode === 'grid' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: adminViewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  ▦ Cards View
                </button>
              </div>
            </div>

            {/* ADMIN USERS LIST */}
            {adminLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '16px' }}>
                Loading admin IDs…
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '50px 20px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
                  No administrator IDs match "<b>{adminSearchQuery}</b>"
                </p>
                <button
                  type="button"
                  onClick={() => setAdminSearchQuery('')}
                  className="button outline"
                  style={{ marginTop: '14px', padding: '6px 14px', fontSize: '12px' }}
                >
                  Clear Search Filter
                </button>
              </div>
            ) : adminViewMode === 'table' ? (
              /* TABLE VIEW: IDEAL FOR MANAGING MULTIPLE IDS */
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                        <th style={{ padding: '14px 16px', width: '40px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={
                              filteredAdmins.length > 0 &&
                              filteredAdmins.every(a => selectedAdminIds.includes(a.id))
                            }
                            onChange={(e) => {
                              const allIds = filteredAdmins.map(a => a.id);
                              if (e.target.checked) {
                                setSelectedAdminIds(prev => Array.from(new Set([...prev, ...allIds])));
                              } else {
                                setSelectedAdminIds(prev => prev.filter(id => !allIds.includes(id)));
                              }
                            }}
                            title="Select all IDs for batch deletion"
                            style={{ cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ padding: '14px 16px' }}>Unique Admin ID</th>
                        <th style={{ padding: '14px 16px' }}>Administrator</th>
                        <th style={{ padding: '14px 16px' }}>Assigned Role</th>
                        <th style={{ padding: '14px 16px' }}>Created Date</th>
                        <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.map((adm) => {
                        const isMaster = adm.isMaster || adm.id === 'master_admin';
                        const isSelected = selectedAdminIds.includes(adm.id);
                        const initials = (adm.name || 'Admin')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <tr
                            key={adm.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isSelected ? '#fef2f2' : 'transparent',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = '#fbfcfe';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAdminIds(prev => [...prev, adm.id]);
                                  } else {
                                    setSelectedAdminIds(prev => prev.filter(id => id !== adm.id));
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                                title={`Select ID: ${adm.id}`}
                              />
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <code style={{
                                  background: isMaster ? '#fef3c7' : '#f1f5f9',
                                  color: isMaster ? '#92400e' : '#0f172a',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: `1px solid ${isMaster ? '#fde68a' : '#e2e8f0'}`,
                                }}>
                                  {adm.id}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(adm.id, adm.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: copiedId === adm.id ? '#16a34a' : '#64748b',
                                    padding: '2px',
                                  }}
                                  title="Copy Admin ID to clipboard"
                                >
                                  {copiedId === adm.id ? '✓' : '📋'}
                                </button>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: isMaster ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                                  color: '#ffffff',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  flexShrink: 0,
                                }}>
                                  {initials}
                                </div>
                                <div>
                                  <b style={{ color: '#1e293b', display: 'block', fontSize: '13px' }}>
                                    {adm.name}
                                  </b>
                                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                                    {adm.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: isMaster ? '#fef3c7' : '#e0f2fe',
                                color: isMaster ? '#b45309' : '#0369a1',
                                border: `1px solid ${isMaster ? '#fde68a' : '#bae6fd'}`,
                              }}>
                                {adm.role || (isMaster ? 'Super Admin' : 'Admin')}
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                              {new Date(adm.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetTargetUser(adm);
                                    setNewPasswordValue('');
                                    setShowResetPassModal(true);
                                  }}
                                  className="button outline"
                                  style={{ padding: '5px 10px', fontSize: '11px' }}
                                  title="Reset password for this admin"
                                >
                                  🔑 Password
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(adm)}
                                  disabled={admins.length <= 1}
                                  style={{
                                    background: admins.length <= 1 ? '#f1f5f9' : '#fee2e2',
                                    border: admins.length <= 1 ? '1px solid #e2e8f0' : '1px solid #fca5a5',
                                    color: admins.length <= 1 ? '#94a3b8' : '#dc2626',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: admins.length <= 1 ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (admins.length > 1) {
                                      e.currentTarget.style.background = '#dc2626';
                                      e.currentTarget.style.color = '#ffffff';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (admins.length > 1) {
                                      e.currentTarget.style.background = '#fee2e2';
                                      e.currentTarget.style.color = '#dc2626';
                                    }
                                  }}
                                  title={admins.length <= 1 ? 'Cannot delete the only remaining admin account' : `Delete Admin ID: ${adm.id}`}
                                >
                                  🗑 Delete ID
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* GRID VIEW: CARDS WITH DETAILED ID CONTROLS */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
                {filteredAdmins.map((adm) => {
                  const isMaster = adm.isMaster || adm.id === 'master_admin';
                  const isSelected = selectedAdminIds.includes(adm.id);
                  const initials = (adm.name || 'Admin')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div 
                      key={adm.id}
                      style={{
                        background: '#ffffff',
                        border: isSelected ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '22px',
                        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                      }}
                    >
                      <div>
                        {/* CARD TOPBAR */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAdminIds(prev => [...prev, adm.id]);
                                } else {
                                  setSelectedAdminIds(prev => prev.filter(id => id !== adm.id));
                                }
                              }}
                              style={{ cursor: 'pointer', marginRight: '2px' }}
                              title={`Select ID: ${adm.id}`}
                            />
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: isMaster ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                              color: '#ffffff',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              fontSize: '15px',
                            }}>
                              {initials}
                            </div>
                            <div>
                              <b style={{ fontSize: '15px', color: '#1e293b', display: 'block' }}>
                                {adm.name}
                              </b>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {adm.email}
                              </span>
                            </div>
                          </div>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: isMaster ? '#fef3c7' : '#e0f2fe',
                            color: isMaster ? '#b45309' : '#0369a1',
                            border: `1px solid ${isMaster ? '#fde68a' : '#bae6fd'}`,
                          }}>
                            {adm.role || (isMaster ? 'Super Admin' : 'Admin')}
                          </span>
                        </div>

                        {/* ADMIN ID BADGE */}
                        <div style={{
                          margin: '16px 0 10px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
                              Admin ID
                            </span>
                            <code style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>
                              {adm.id}
                            </code>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(adm.id, adm.id)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              color: copiedId === adm.id ? '#16a34a' : '#475569',
                              fontWeight: 600,
                            }}
                          >
                            {copiedId === adm.id ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>

                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          📅 Registered: {new Date(adm.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      {/* CARD ACTIONS */}
                      <div style={{
                        marginTop: '18px',
                        paddingTop: '14px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTargetUser(adm);
                            setNewPasswordValue('');
                            setShowResetPassModal(true);
                          }}
                          className="button outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          title="Set new password for this admin"
                        >
                          🔑 Password
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(adm)}
                          disabled={admins.length <= 1}
                          style={{
                            background: admins.length <= 1 ? '#f1f5f9' : '#fee2e2',
                            border: admins.length <= 1 ? '1px solid #e2e8f0' : '1px solid #fca5a5',
                            color: admins.length <= 1 ? '#94a3b8' : '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: admins.length <= 1 ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (admins.length > 1) {
                              e.currentTarget.style.background = '#dc2626';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (admins.length > 1) {
                              e.currentTarget.style.background = '#fee2e2';
                              e.currentTarget.style.color = '#dc2626';
                            }
                          }}
                          title={admins.length <= 1 ? 'Cannot delete the only remaining admin account' : `Delete Admin ID: ${adm.id}`}
                        >
                          🗑 Delete ID
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* LEAD DETAILS MODAL */}
      {selectedLead && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '540px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--navy)', margin: 0 }}>Enquiry Details</h3>
              <button 
                onClick={() => setSelectedLead(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Client Name</small>
                <b style={{ color: '#182238', fontSize: '16px' }}>{selectedLead.name}</b>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Email</small>
                  <a href={`mailto:${selectedLead.email}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Phone</small>
                  {selectedLead.phone ? (
                    <a href={`tel:${selectedLead.phone}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                      {selectedLead.phone}
                    </a>
                  ) : <span style={{ color: '#94a3b8' }}>Not provided</span>}
                </div>
              </div>

              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Requested Service</small>
                <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{selectedLead.service}</span>
              </div>

              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Project Details / Message</small>
                <p style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7', margin: '4px 0 0', lineHeight: 1.6, color: '#334155' }}>
                  {selectedLead.message || 'No project description provided.'}
                </p>
              </div>

              <div>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Received At</small>
                <span style={{ color: '#64748b' }}>
                  {new Date(selectedLead.created_at).toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              {selectedLead.phone && (
                <a 
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="button primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  WhatsApp Client ↗
                </a>
              )}
              <button 
                onClick={() => setSelectedLead(null)}
                className="button outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ADMIN MODAL */}
      {showNewAdminModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          zIndex: 9999,
        }}>
          <form 
            onSubmit={handleCreateAdmin}
            style={{
              background: '#ffffff',
              borderRadius: '22px',
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', color: 'var(--navy)', margin: 0 }}>Add New Administrator</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0' }}>
                  Create administrative credentials for a team member.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowNewAdminModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                Full Name
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Aashutosh Kumar / Ankitosh Kumar"
                value={newAdminForm.name}
                onChange={e => setNewAdminForm(prev => ({ ...prev, name: e.target.value }))}
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
                placeholder="colleague@softtechsolution.com"
                value={newAdminForm.email}
                onChange={e => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
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
                Role
              </label>
              <select
                value={newAdminForm.role}
                onChange={e => setNewAdminForm(prev => ({ ...prev, role: e.target.value }))}
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

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                Password
              </label>
              <input 
                type="password" 
                required
                placeholder="Min 6 characters"
                value={newAdminForm.password}
                onChange={e => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setShowNewAdminModal(false)}
                className="button outline"
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={creatingAdmin}
                className="button primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                {creatingAdmin ? 'Creating…' : 'Create Administrator →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CHANGE / RESET PASSWORD MODAL */}
      {showResetPassModal && resetTargetUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          zIndex: 9999,
        }}>
          <form 
            onSubmit={handleResetPassword}
            style={{
              background: '#ffffff',
              borderRadius: '22px',
              maxWidth: '460px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', color: 'var(--navy)', margin: 0 }}>Reset Password</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0' }}>
                  Updating access for <b>{resetTargetUser.name}</b> ({resetTargetUser.email})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowResetPassModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                New Password
              </label>
              <input 
                type="password" 
                required
                placeholder="Minimum 6 characters"
                value={newPasswordValue}
                onChange={e => setNewPasswordValue(e.target.value)}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setShowResetPassModal(false)}
                className="button outline"
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={updatingPassword}
                className="button primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                {updatingPassword ? 'Updating…' : 'Update Password →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CLOUD DB SETUP MODAL */}
      {showSetupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '22px',
            maxWidth: '620px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>🐘</span>
                <div>
                  <h3 style={{ fontSize: '20px', color: 'var(--navy)', margin: 0 }}>Connect Neon Postgres (Vercel Storage)</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Permanent serverless storage for all client proposals.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSetupModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <b style={{ color: '#0f172a', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                Why is this needed on Vercel?
              </b>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Vercel runs on stateless serverless functions. When a client submits an enquiry, it runs inside an isolated container. Without a cloud database, local files and memory disappear when containers sleep. Linking Neon Postgres connects your app to permanent storage in 3 clicks.
              </p>
            </div>

            <h4 style={{ fontSize: '14px', color: '#1e293b', marginBottom: '12px' }}>
              Quick 3-Click Setup in Vercel:
            </h4>
            <ol style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8, paddingLeft: '20px', margin: '0 0 24px' }}>
              <li>
                Open your project on <b>Vercel Dashboard</b> (<a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>vercel.com/dashboard ↗</a>).
              </li>
              <li>
                Click the <b>Storage</b> tab at the top of your project page.
              </li>
              <li>
                Click <b>Create Database</b> → Select <b>Postgres (Powered by Neon)</b>.
              </li>
              <li>
                Click <b>Continue</b> → Click <b>Connect to Project</b> (select <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>soft-tech-solution-ebon</code>).
              </li>
            </ol>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: '#065f46', marginBottom: '24px' }}>
              ✓ <b>Zero manual schema setup:</b> The table and indexes are automatically created on the first request. As soon as connected in Vercel, the status badge will turn green automatically!
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <a 
                href="https://vercel.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="button primary"
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                Go to Vercel Storage ↗
              </a>
              <button 
                onClick={() => setShowSetupModal(false)}
                className="button outline"
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
