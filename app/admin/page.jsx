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

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('sts_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const loadLeads = useCallback(async (status = 'All') => {
    setRefreshing(true);
    try {
      const url = `/api/enquiries${status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        setAuthenticated(false);
        localStorage.removeItem('sts_admin_token');
        router.replace('/admin/login');
        return;
      }
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Could not load enquiries: ' + err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  }, [router, showToast]);

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
  }, [router, statusFilter, loadLeads]);

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
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '20px', color: 'var(--navy)' }}>
              Soft <b style={{ color: 'var(--orange)' }}>Tech</b> Solution
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', marginLeft: '10px' }}>/ Admin Dashboard</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
              Leadership: Founder Aashutosh Kumar (+91 9876543753) · Co-Founder Ankitosh Kumar (+91 6205570278)
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
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Lead Details</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Requested Service</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Project Message</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Pipeline Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Received Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <b style={{ color: '#1e293b', fontSize: '14px' }}>{lead.name}</b>
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
                      {lead.message || '—'}
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
                      <button 
                        onClick={() => handleDeleteLead(lead.id)}
                        style={{
                          padding: '6px 12px',
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '16px', fontWeight: 600 }}>No enquiries matching your search.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Try switching the status filter or clearing your search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
