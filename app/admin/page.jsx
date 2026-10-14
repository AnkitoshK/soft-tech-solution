'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

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
          loadLeads(statusFilter);
          fetchDbStatus();
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
  }, [router, statusFilter, loadLeads, fetchDbStatus]);

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
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
              Leadership: Founder Aashutosh Kumar (+91 9117696512) · Co-Founder Ankitosh Kumar (+91 6205570278)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
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
      <div className="wrap" style={{ marginTop: '28px' }}>

        {/* CLOUD DATABASE NOTICE BANNER (WHEN NOT YET LINKED IN VERCEL) */}
        {dbInfo && !dbInfo.connected && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fcd34d',
            borderRadius: '16px',
            padding: '18px 24px',
            marginBottom: '28px',
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
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #d9dfeb',
              background: '#ffffff',
              minWidth: '280px',
              flex: 1,
              maxWidth: '450px',
              fontSize: '14px',
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Status:</span>
            <select 
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                loadLeads(e.target.value);
              }}
              style={{
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid #d9dfeb',
                background: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
              }}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* LEADS TABLE */}
        <div style={{ background: '#ffffff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 25px rgba(24, 34, 56, 0.06)', border: '1px solid #edf2f7' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #edf0f5' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Client / Lead</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Service</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Proposal Request</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Pipeline Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Received Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <b style={{ color: '#1e293b', fontSize: '14px', display: 'block' }}>{lead.name}</b>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        <a href={`mailto:${lead.email}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{lead.email}</a>
                      </div>
                      {lead.phone && (
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          <a href={`tel:${lead.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>📞 {lead.phone}</a>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', verticalAlign: 'top', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                        {lead.service || 'General Inquiry'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', verticalAlign: 'top', fontSize: '13px', color: '#475569', maxWidth: '300px' }}>
                      <div 
                        onClick={() => setSelectedLead(lead)} 
                        style={{ cursor: 'pointer', lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        title="Click to view full message"
                      >
                        {lead.message || '—'}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <select 
                        value={lead.status || 'New'}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: '1px solid #d9dfeb',
                          background: 
                            lead.status === 'Converted' ? '#dcfce7' :
                            lead.status === 'Contacted' ? '#e0f2fe' :
                            lead.status === 'Qualified' ? '#fef3c7' : '#fff7ed',
                          color:
                            lead.status === 'Converted' ? '#166534' :
                            lead.status === 'Contacted' ? '#075985' :
                            lead.status === 'Qualified' ? '#92400e' : '#9a3412',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Converted">Converted</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>

                    <td style={{ padding: '16px 20px', verticalAlign: 'top', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
                    </td>

                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedLead(lead)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #dbeafe',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fff1f2',
                            color: '#e11d48',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>📬</div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>No enquiries submitted yet</p>
              <p style={{ fontSize: '14px', maxWidth: '460px', margin: '8px auto 20px', lineHeight: 1.6, color: '#64748b' }}>
                Your Neon Postgres cloud database is connected and ready. Test it right now by submitting a proposal on the website:
              </p>
              <a 
                href="/contact" 
                target="_blank" 
                rel="noopener noreferrer"
                className="button primary" 
                style={{ padding: '10px 24px', fontSize: '13px', display: 'inline-block' }}
              >
                Open &quot;Get a Proposal&quot; Form ↗
              </a>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '16px', fontWeight: 600 }}>No enquiries matching your search.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Try switching the status filter or clearing your search term.</p>
            </div>
          ) : null}
        </div>
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
            maxWidth: '560px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--navy)', margin: 0 }}>Enquiry Details</h3>
              <button 
                onClick={() => setSelectedLead(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div>
                <small style={{ color: '#8590a0', fontWeight: 600, display: 'block' }}>Name</small>
                <b style={{ color: '#1e293b', fontSize: '16px' }}>{selectedLead.name}</b>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <small style={{ color: '#8590a0', fontWeight: 600, display: 'block' }}>Email</small>
                  <a href={`mailto:${selectedLead.email}`} style={{ color: 'var(--blue)', fontWeight: 600 }}>{selectedLead.email}</a>
                </div>
                <div>
                  <small style={{ color: '#8590a0', fontWeight: 600, display: 'block' }}>Phone</small>
                  <a href={`tel:${selectedLead.phone}`} style={{ color: '#1e293b', fontWeight: 600 }}>{selectedLead.phone || '—'}</a>
                </div>
              </div>
              <div>
                <small style={{ color: '#8590a0', fontWeight: 600, display: 'block' }}>Requested Service</small>
                <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                  {selectedLead.service}
                </span>
              </div>
              <div>
                <small style={{ color: '#8590a0', fontWeight: 600, display: 'block' }}>Proposal Requirements / Message</small>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155' }}>
                  {selectedLead.message || 'No project message provided.'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <div>
                  <small style={{ color: '#8590a0', fontWeight: 600, display: 'block' }}>Submitted Date</small>
                  <span>{new Date(selectedLead.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <small style={{ color: '#8590a0', fontWeight: 600, display: 'block' }}>Lead Status</small>
                  <span style={{ fontWeight: 700, color: 'var(--orange)' }}>{selectedLead.status || 'New'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedLead.phone && (
                <a 
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedLead.name)},%20thank%20you%20for%20consulting%20Soft%20Tech%20Solution.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  WhatsApp Lead 💬
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
