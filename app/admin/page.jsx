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

  // Training & Course Registrations State
  const [courses, setCourses] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseStatusFilter, setCourseStatusFilter] = useState('All');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [adminReceiptCandidate, setAdminReceiptCandidate] = useState(null);
  const [updatingCandidateId, setUpdatingCandidateId] = useState(null);
  const [candidateNotesValue, setCandidateNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [candidateAmountValue, setCandidateAmountValue] = useState('');
  const [candidateUtrValue, setCandidateUtrValue] = useState('');
  const [candidateStatusValue, setCandidateStatusValue] = useState('Pending');
  const [savingAmountUtr, setSavingAmountUtr] = useState(false);

  function printReceiptElement(elementId, title = 'Soft Tech Solution - Fee Payment Receipt') {
    if (typeof window === 'undefined') return;
    const content = document.getElementById(elementId);
    if (!content) {
      window.print();
      return;
    }

    const existingFrame = document.getElementById('sts-admin-print-iframe');
    if (existingFrame) existingFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'sts-admin-print-iframe';
    iframe.setAttribute('style', 'position:fixed;top:-10000px;left:-10000px;width:820px;height:1150px;border:none;opacity:0;pointer-events:none;');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 14mm 10mm 14mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 13px;
              line-height: 1.45;
            }
            .print-wrapper {
              width: 100%;
              max-width: 720px;
              margin: 0 auto;
              padding: 16px 20px;
              background: #ffffff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .admin-receipt-no-print, .receipt-no-print, button {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${content.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print error', err);
        window.print();
      }
    }, 280);
  }

  function numberToWordsINR(amount) {
    const n = parseInt(amount, 10);
    if (isNaN(n) || n === 0) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function inWords(num) {
      if ((num = num.toString()).length > 9) return 'overflow';
      const match = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!match) return '';
      let str = '';
      str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0]] + ' ' + a[match[1][1]]) + 'Crore ' : '';
      str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0]] + ' ' + a[match[2][1]]) + 'Lakh ' : '';
      str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0]] + ' ' + a[match[3][1]]) + 'Thousand ' : '';
      str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0]] + ' ' + a[match[4][1]]) + 'Hundred ' : '';
      str += Number(match[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(match[5])] || b[match[5][0]] + ' ' + a[match[5][1]]) : '';
      return str.trim();
    }
    return inWords(n) + ' Rupees Only';
  }

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
    } catch { }
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

  const loadCourses = useCallback(async (status = 'All') => {
    setCourseLoading(true);
    try {
      const url = `/api/courses${status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''}`;
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
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Could not load course registrations: ' + err.message, 'error');
    } finally {
      setCourseLoading(false);
    }
  }, [router, showToast]);

  const handleCourseStatusChange = async (id, newStatus) => {
    setUpdatingCandidateId(id);
    try {
      const res = await fetch(`/api/courses?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ payment_status: newStatus }),
      });
      if (res.ok) {
        setCourses(prev => prev.map(c => (c.id === id ? { ...c, payment_status: newStatus } : c)));
        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(prev => ({ ...prev, payment_status: newStatus }));
        }
        showToast(`Candidate status updated to ${newStatus}`, 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      showToast('Could not update candidate status: ' + err.message, 'error');
    } finally {
      setUpdatingCandidateId(null);
    }
  };

  const handleSaveCourseNotes = async (id) => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/courses?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ notes: candidateNotesValue }),
      });
      if (res.ok) {
        setCourses(prev => prev.map(c => (c.id === id ? { ...c, notes: candidateNotesValue } : c)));
        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(prev => ({ ...prev, notes: candidateNotesValue }));
        }
        showToast('Candidate notes saved.', 'success');
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      showToast('Failed to save notes: ' + err.message, 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveCourseAmountUtr = async (id) => {
    setSavingAmountUtr(true);
    try {
      const cleanAmt = (candidateAmountValue || '').trim();
      const cleanUtr = (candidateUtrValue || '').trim();
      const statusToSet = candidateStatusValue || (cleanUtr ? 'Verified' : 'Pending');
      const nowIso = new Date().toISOString();

      const candObj = courses.find(c => c.id === id) || selectedCandidate || {};
      const candIdClean = (candObj.candidate_id || 'STS').replace(/\s+/g, '').toUpperCase();
      const receiptNum = candObj.receipt_number || `REC-${new Date().getFullYear()}-${candIdClean}-${Math.floor(1000 + Math.random() * 9000)}`;

      const updatedReceiptObj = {
        receipt_number: receiptNum,
        candidate_id: candObj.candidate_id,
        candidate_name: candObj.name,
        father_name: candObj.father_name,
        contact_number: candObj.contact_number,
        email: candObj.email,
        id_type: candObj.id_type,
        id_number: candObj.id_number,
        course_name: candObj.course,
        amount: cleanAmt,
        amount_words: cleanAmt && Number(cleanAmt) > 0 ? numberToWordsINR(cleanAmt) : 'Zero Rupees Only',
        utr_number: cleanUtr,
        payment_mode: 'UPI / SBI Bank QR (Net Banking)',
        bank_name: 'State Bank of India (SBI)',
        account_number: '39797312414',
        ifsc_code: 'SBIN0003002',
        payee_name: 'Aashutosh Kumar',
        upi_id: '9142491242@ibl',
        payment_status: statusToSet,
        paid_at: candObj.paid_at || (cleanUtr ? nowIso : null),
        company_name: 'Soft Tech Solution',
        company_address: 'Post Office: Noida Sector 62 S.O, District: Gautam Buddha Nagar, Uttar Pradesh - 201309',
        support_phone: '+91 91176 96512',
        support_email: 'softtechsolution2026@gmail.com',
      };

      const res = await fetch(`/api/courses?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ 
          amount: cleanAmt, 
          utr_number: cleanUtr,
          payment_status: statusToSet,
          receipt_number: receiptNum,
          receipt_data: JSON.stringify(updatedReceiptObj),
          paid_at: cleanUtr ? nowIso : undefined
        }),
      });

      if (res.ok) {
        setCourses(prev => prev.map(c => (c.id === id ? { 
          ...c, 
          amount: cleanAmt, 
          utr_number: cleanUtr, 
          payment_status: statusToSet,
          receipt_number: receiptNum,
          receipt_data: JSON.stringify(updatedReceiptObj),
          paid_at: cleanUtr && !c.paid_at ? nowIso : c.paid_at
        } : c)));

        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(prev => ({ 
            ...prev, 
            amount: cleanAmt, 
            utr_number: cleanUtr, 
            payment_status: statusToSet,
            receipt_number: receiptNum,
            receipt_data: JSON.stringify(updatedReceiptObj),
            paid_at: cleanUtr && !prev.paid_at ? nowIso : prev.paid_at
          }));
        }
        showToast(`Candidate Amount (₹${cleanAmt || '0'}) & UTR saved successfully!`, 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      showToast('Could not save Amount & UTR: ' + err.message, 'error');
    } finally {
      setSavingAmountUtr(false);
    }
  };

  const handleDeleteCourse = async (id, candidateId) => {
    if (!confirm(`Are you sure you want to permanently delete Candidate ${candidateId || id}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/courses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== id));
        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(null);
        }
        showToast(`Candidate ${candidateId || id} deleted.`, 'info');
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      showToast('Could not delete candidate: ' + err.message, 'error');
    }
  };

  const exportCourseCSV = () => {
    if (!courses.length) {
      showToast('No course registrations to export', 'info');
      return;
    }
    const headers = ['Candidate ID', 'Name', "Father's Name", 'Contact Number', 'Email', 'ID Type', 'ID Number', 'Course', 'Amount (INR)', 'UTR Number', 'Receipt Number', 'Paid At', 'Scanned', 'Scanned At', 'Latitude', 'Longitude', 'Payment Status', 'Created At', 'Notes'];
    const rows = courses.map(c => [
      `"${c.candidate_id || ''}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.father_name || '').replace(/"/g, '""')}"`,
      `"${c.contact_number || ''}"`,
      `"${c.email || ''}"`,
      `"${c.id_type || ''}"`,
      `"${c.id_number || ''}"`,
      `"${(c.course || '').replace(/"/g, '""')}"`,
      `"${c.amount || ''}"`,
      `"${c.utr_number || ''}"`,
      `"${c.receipt_number || ''}"`,
      `"${c.paid_at || ''}"`,
      `"${c.scanned ? 'YES' : 'NO'}"`,
      `"${c.scanned_at || ''}"`,
      `"${c.scan_lat ?? ''}"`,
      `"${c.scan_long ?? ''}"`,
      `"${c.payment_status || ''}"`,
      `"${c.created_at || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `soft_tech_course_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Course registrations exported to CSV', 'success');
  };

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
          loadCourses(courseStatusFilter);
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
  }, [router, statusFilter, loadLeads, fetchDbStatus, loadAdmins, loadCourses, courseStatusFilter]);

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

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

            {activeTab === 'courses' && (
              <>
                <button
                  onClick={() => loadCourses(courseStatusFilter)}
                  className="button outline"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  disabled={courseLoading}
                >
                  {courseLoading ? 'Refreshing…' : '🔄 Refresh'}
                </button>
                <button
                  onClick={exportCourseCSV}
                  className="button outline"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  📥 Export Candidates CSV
                </button>
              </>
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
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          whiteSpace: 'nowrap',
          paddingBottom: '2px',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'leads' ? '3px solid var(--orange)' : '3px solid transparent',
              color: activeTab === 'leads' ? 'var(--navy)' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              flexShrink: 0,
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
              setActiveTab('courses');
              loadCourses(courseStatusFilter);
            }}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'courses' ? '3px solid var(--orange)' : '3px solid transparent',
              color: activeTab === 'courses' ? 'var(--navy)' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <span>🎓</span> Training &amp; Course
            <span style={{
              background: activeTab === 'courses' ? '#fff7ed' : '#f1f5f9',
              color: activeTab === 'courses' ? 'var(--orange)' : '#64748b',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              border: `1px solid ${activeTab === 'courses' ? '#fed7aa' : '#e2e8f0'}`,
            }}>
              {courses.length} Regs · {courses.filter(c => c.scanned).length} Scanned
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admins');
              loadAdmins();
            }}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'admins' ? '3px solid var(--orange)' : '3px solid transparent',
              color: activeTab === 'admins' ? 'var(--navy)' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              flexShrink: 0,
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

        {/* ==============================================================
            TAB 3: TRAINING & COURSE REGISTRATIONS VIEW
            ============================================================== */}
        {activeTab === 'courses' && (
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
                  Training &amp; Course Registrations
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                  Track student admissions, government ID checks, payment statuses, and GPS scan coordinates in real time.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href="/training"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button outline"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  🔗 Open Public Form ↗
                </a>
              </div>
            </div>

            {/* STATS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #edf2f7', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Registered</span>
                <b style={{ display: 'block', fontSize: '28px', fontFamily: 'Poppins, sans-serif', color: 'var(--navy)', marginTop: '4px' }}>
                  {courses.length}
                </b>
              </div>

              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #bbf7d0', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>✅ QR Scanned (With GPS)</span>
                <b style={{ display: 'block', fontSize: '28px', fontFamily: 'Poppins, sans-serif', color: '#16a34a', marginTop: '4px' }}>
                  {courses.filter(c => c.scanned).length}
                </b>
              </div>

              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #fed7aa', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600 }}>⏳ Pending QR Scan</span>
                <b style={{ display: 'block', fontSize: '28px', fontFamily: 'Poppins, sans-serif', color: 'var(--orange)', marginTop: '4px' }}>
                  {courses.filter(c => !c.scanned).length}
                </b>
              </div>

              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #bfdbfe', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>🎯 Enrolled &amp; Verified</span>
                <b style={{ display: 'block', fontSize: '28px', fontFamily: 'Poppins, sans-serif', color: '#2563eb', marginTop: '4px' }}>
                  {courses.filter(c => c.payment_status === 'Verified' || c.payment_status === 'Completed').length}
                </b>
              </div>

              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #dcfce7', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>💰 Fees Collected (INR)</span>
                <b style={{ display: 'block', fontSize: '28px', fontFamily: 'Poppins, sans-serif', color: '#16a34a', marginTop: '4px' }}>
                  ₹{courses.reduce((acc, c) => {
                    const isPaid = c.payment_status === 'Verified' || c.payment_status === 'Completed' || Boolean(c.utr_number) || Boolean(c.receipt_number);
                    const val = Number(c.amount || 0);
                    return isPaid && !isNaN(val) ? acc + val : acc;
                  }, 0).toLocaleString('en-IN')}
                </b>
              </div>
            </div>

            {/* SEARCH & FILTER CONTROLS */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by Candidate ID (STS 001), name, mobile, email, or Aadhaar/PAN..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    color: '#0f172a',
                  }}
                />
              </div>

              {/* STATUS FILTER DROPDOWN */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Filter:</span>
                <select
                  value={courseStatusFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCourseStatusFilter(val);
                    loadCourses(val);
                  }}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    background: '#fff',
                    outline: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value="All">All Registrations</option>
                  <option value="Scanned">Scanned Only (GPS Available)</option>
                  <option value="Not Scanned">Not Scanned Yet</option>
                  <option value="Pending">Status: Pending</option>
                  <option value="Verified">Status: Verified</option>
                  <option value="Completed">Status: Completed</option>
                  <option value="Cancelled">Status: Cancelled</option>
                </select>
              </div>

              {(courseSearchQuery || courseStatusFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setCourseSearchQuery('');
                    setCourseStatusFilter('All');
                    loadCourses('All');
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Reset Filters
                </button>
              )}
            </div>

            {/* CANDIDATES TABLE */}
            {courseLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <p style={{ marginTop: '12px', color: '#64748b', fontSize: '13px' }}>Loading registered candidates...</p>
              </div>
            ) : (() => {
              const filteredList = courses.filter(c => {
                if (courseSearchQuery.trim()) {
                  const q = courseSearchQuery.toLowerCase().trim();
                  const matchId = (c.candidate_id || '').toLowerCase().includes(q);
                  const matchName = (c.name || '').toLowerCase().includes(q);
                  const matchFather = (c.father_name || '').toLowerCase().includes(q);
                  const matchPhone = (c.contact_number || '').includes(q);
                  const matchEmail = (c.email || '').toLowerCase().includes(q);
                  const matchGov = (c.id_number || '').toLowerCase().includes(q);
                  const matchCourse = (c.course || '').toLowerCase().includes(q);
                  if (!matchId && !matchName && !matchFather && !matchPhone && !matchEmail && !matchGov && !matchCourse) {
                    return false;
                  }
                }
                if (courseStatusFilter !== 'All') {
                  if (courseStatusFilter === 'Scanned') return c.scanned;
                  if (courseStatusFilter === 'Not Scanned') return !c.scanned;
                  if (c.payment_status !== courseStatusFilter) return false;
                }
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '50px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🎓</span>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: 'var(--navy)' }}>No Course Registrations Found</h3>
                    <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13px' }}>
                      {courseSearchQuery || courseStatusFilter !== 'All' 
                        ? 'No candidates match your current search or status filter.' 
                        : 'No students have submitted the course registration form yet.'}
                    </p>
                    <a
                      href="/training"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button primary"
                      style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-block' }}
                    >
                      Fill Test Registration ↗
                    </a>
                  </div>
                );
              }

              return (
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,23,42,0.03)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Candidate ID</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Candidate Name</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Contact &amp; Email</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Govt ID (Aadhaar/PAN)</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Course</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Amount (₹)</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>UTR &amp; Receipt</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>QR Scan Status &amp; GPS</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700 }}>Status</th>
                          <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredList.map((cand, idx) => (
                          <tr 
                            key={cand.id} 
                            style={{ 
                              borderBottom: idx === filteredList.length - 1 ? 'none' : '1px solid #f1f5f9',
                              transition: 'background 0.15s',
                              background: cand.scanned ? '#fdfffd' : '#ffffff'
                            }}
                          >
                            {/* CANDIDATE ID */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span 
                                  style={{ 
                                    fontFamily: 'monospace', 
                                    fontWeight: 800, 
                                    fontSize: '13px', 
                                    color: '#c2410c', 
                                    background: '#fff7ed', 
                                    border: '1px solid #fed7aa', 
                                    padding: '3px 8px', 
                                    borderRadius: '6px' 
                                  }}
                                >
                                  {cand.candidate_id || 'N/A'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(cand.candidate_id, cand.id)}
                                  title="Copy Candidate ID"
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    background: copiedId === cand.id ? '#16a34a' : '#fff',
                                    color: copiedId === cand.id ? '#fff' : '#475569',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                  }}
                                >
                                  {copiedId === cand.id ? '✓' : '📋'}
                                </button>
                              </div>
                              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                                Reg: {new Date(cand.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            {/* CANDIDATE NAME & FATHER'S NAME */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <strong style={{ display: 'block', color: 'var(--navy)', fontSize: '14px' }}>
                                {cand.name}
                              </strong>
                              <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                                S/O, D/O: <strong>{cand.father_name}</strong>
                              </small>
                            </td>

                            {/* CONTACT & EMAIL */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <a 
                                  href={`tel:+91${cand.contact_number}`} 
                                  style={{ color: '#0369a1', fontWeight: 600, textDecoration: 'none' }}
                                >
                                  +91 {cand.contact_number}
                                </a>
                                <a
                                  href={`https://wa.me/91${cand.contact_number}?text=${encodeURIComponent(`Hello ${cand.name}, this is Soft Tech Solution regarding your ${cand.course} registration.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#16a34a', textDecoration: 'none', fontSize: '12px' }}
                                  title="WhatsApp Student"
                                >
                                  💬
                                </a>
                              </div>
                              <a 
                                href={`mailto:${cand.email}`} 
                                style={{ color: '#64748b', fontSize: '11px', textDecoration: 'none', display: 'block' }}
                              >
                                {cand.email}
                              </a>
                            </td>

                            {/* GOVT ID */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span 
                                style={{ 
                                  fontSize: '10px', 
                                  fontWeight: 800, 
                                  background: cand.id_type === 'AADHAAR' ? '#eff6ff' : '#fef3c7', 
                                  color: cand.id_type === 'AADHAAR' ? '#1d4ed8' : '#b45309',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  marginRight: '6px'
                                }}
                              >
                                {cand.id_type}
                              </span>
                              <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '12px' }}>
                                {cand.id_number}
                              </strong>
                            </td>

                            {/* COURSE */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <span style={{ color: '#334155', fontWeight: 600, fontSize: '12px', display: 'block', maxWidth: '180px' }}>
                                {cand.course}
                              </span>
                            </td>

                            {/* AMOUNT (₹) */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              {(() => {
                                const rowAmt = cand.amount || (() => {
                                  if (!cand.receipt_data) return '';
                                  try {
                                    const parsed = typeof cand.receipt_data === 'string' ? JSON.parse(cand.receipt_data) : cand.receipt_data;
                                    return parsed?.amount || '';
                                  } catch { return ''; }
                                })();
                                return rowAmt && Number(rowAmt) > 0 ? (
                                  <div>
                                    <strong style={{ color: cand.utr_number || cand.payment_status === 'Verified' || cand.payment_status === 'Completed' ? '#16a34a' : '#d97706', fontSize: '13.5px', display: 'block' }}>
                                      ₹{Number(rowAmt).toLocaleString('en-IN')}
                                    </strong>
                                    {cand.paid_at ? (
                                      <small style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                        🕒 {new Date(cand.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </small>
                                    ) : (
                                      <small style={{ display: 'block', fontSize: '10px', color: cand.utr_number ? '#15803d' : '#d97706' }}>
                                        {cand.utr_number ? 'Paid via UTR' : 'Amount Selected'}
                                      </small>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                                    <small style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Unpaid</small>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* UTR & RECEIPT */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              {(() => {
                                const rowUtr = cand.utr_number || (() => {
                                  if (!cand.receipt_data) return '';
                                  try {
                                    const parsed = typeof cand.receipt_data === 'string' ? JSON.parse(cand.receipt_data) : cand.receipt_data;
                                    return parsed?.utr_number || '';
                                  } catch { return ''; }
                                })();
                                const rowReceipt = cand.receipt_number || (() => {
                                  if (!cand.receipt_data) return '';
                                  try {
                                    const parsed = typeof cand.receipt_data === 'string' ? JSON.parse(cand.receipt_data) : cand.receipt_data;
                                    return parsed?.receipt_number || '';
                                  } catch { return ''; }
                                })();

                                return rowUtr ? (
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '12px' }}>
                                        {rowUtr}
                                      </strong>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(rowUtr, `utr-${cand.id}`)}
                                        title="Copy UTR Number"
                                        style={{
                                          border: '1px solid #cbd5e1',
                                          background: copiedId === `utr-${cand.id}` ? '#16a34a' : '#fff',
                                          color: copiedId === `utr-${cand.id}` ? '#fff' : '#475569',
                                          padding: '1px 5px',
                                          borderRadius: '3px',
                                          cursor: 'pointer',
                                          fontSize: '10px',
                                        }}
                                      >
                                        {copiedId === `utr-${cand.id}` ? '✓' : '📋'}
                                      </button>
                                    </div>
                                    {rowReceipt && (
                                      <span style={{ display: 'inline-block', fontSize: '10px', fontFamily: 'monospace', color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 5px', borderRadius: '4px', marginTop: '3px' }}>
                                        {rowReceipt}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                );
                              })()}
                            </td>

                            {/* QR CODE SCAN & GEOLOCATION */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              {cand.scanned ? (
                                <div>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#15803d', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                    <span>✅ Scanned</span>
                                    {cand.scan_count > 1 && <span>({cand.scan_count}x)</span>}
                                  </div>

                                  {cand.scanned_at && (
                                    <small style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                      🕒 {new Date(cand.scanned_at).toLocaleString()}
                                    </small>
                                  )}

                                  {cand.scan_lat !== null && cand.scan_long !== null ? (
                                    <div style={{ marginTop: '5px' }}>
                                      <div style={{ fontSize: '11px', color: '#0f172a', fontFamily: 'monospace' }}>
                                        📍 {Number(cand.scan_lat).toFixed(4)}, {Number(cand.scan_long).toFixed(4)}
                                      </div>
                                      <a
                                        href={`https://www.google.com/maps?q=${cand.scan_lat},${cand.scan_long}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          marginTop: '3px',
                                          color: '#0284c7',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          textDecoration: 'none'
                                        }}
                                      >
                                        <span>View on Maps ↗</span>
                                      </a>
                                    </div>
                                  ) : (
                                    <small style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                      📍 GPS not enabled
                                    </small>
                                  )}
                                </div>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                  ⏳ Not Scanned
                                </span>
                              )}
                            </td>

                            {/* PAYMENT / ENROLLMENT STATUS DROPDOWN */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <select
                                value={cand.payment_status}
                                disabled={updatingCandidateId === cand.id}
                                onChange={(e) => handleCourseStatusChange(cand.id, e.target.value)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: '1px solid #cbd5e1',
                                  background: 
                                    cand.payment_status === 'Verified' || cand.payment_status === 'Completed' ? '#f0fdf4' :
                                    cand.payment_status === 'Scanned' ? '#eff6ff' :
                                    cand.payment_status === 'Cancelled' ? '#fef2f2' : '#fffbeb',
                                  color: 
                                    cand.payment_status === 'Verified' || cand.payment_status === 'Completed' ? '#166534' :
                                    cand.payment_status === 'Scanned' ? '#1e40af' :
                                    cand.payment_status === 'Cancelled' ? '#991b1b' : '#92400e',
                                }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Scanned">Scanned</option>
                                <option value="Verified">Verified</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>

                            {/* ACTIONS */}
                            <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setAdminReceiptCandidate(cand)}
                                  style={{
                                    background: cand.utr_number || cand.receipt_number ? '#f0fdf4' : '#f8fafc',
                                    border: `1px solid ${cand.utr_number || cand.receipt_number ? '#86efac' : '#cbd5e1'}`,
                                    color: cand.utr_number || cand.receipt_number ? '#15803d' : '#475569',
                                    padding: '5px 9px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  title="View / Print Official Fee Receipt"
                                >
                                  📄 Receipt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parsedAmt = cand.amount || (() => {
                                      if (!cand.receipt_data) return '';
                                      try {
                                        return (typeof cand.receipt_data === 'string' ? JSON.parse(cand.receipt_data) : cand.receipt_data)?.amount || '';
                                      } catch { return ''; }
                                    })();
                                    const parsedUtr = cand.utr_number || (() => {
                                      if (!cand.receipt_data) return '';
                                      try {
                                        return (typeof cand.receipt_data === 'string' ? JSON.parse(cand.receipt_data) : cand.receipt_data)?.utr_number || '';
                                      } catch { return ''; }
                                    })();
                                    setSelectedCandidate(cand);
                                    setCandidateNotesValue(cand.notes || '');
                                    setCandidateAmountValue(parsedAmt);
                                    setCandidateUtrValue(parsedUtr);
                                    setCandidateStatusValue(cand.payment_status || 'Pending');
                                  }}
                                  className="button outline"
                                  style={{ padding: '5px 10px', fontSize: '11px' }}
                                  title="View Full Profile & GPS Log"
                                >
                                  👁 View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCourse(cand.id, cand.candidate_id)}
                                  style={{
                                    background: '#fee2e2',
                                    border: '1px solid #fca5a5',
                                    color: '#dc2626',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Delete Registration"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* CANDIDATE DETAILS & GPS SCAN AUDIT MODAL */}
      {selectedCandidate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span 
                    style={{ 
                      fontFamily: 'monospace', 
                      fontWeight: 800, 
                      fontSize: '14px', 
                      color: '#c2410c', 
                      background: '#fff7ed', 
                      border: '1px solid #fed7aa', 
                      padding: '3px 10px', 
                      borderRadius: '6px' 
                    }}
                  >
                    {selectedCandidate.candidate_id}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Registered on {new Date(selectedCandidate.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--navy)' }}>
                  {selectedCandidate.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Father&apos;s Name</small>
                <strong style={{ color: '#0f172a' }}>{selectedCandidate.father_name}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Contact Phone</small>
                <a href={`tel:+91${selectedCandidate.contact_number}`} style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
                  +91 {selectedCandidate.contact_number}
                </a>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Candidate Email</small>
                <a href={`mailto:${selectedCandidate.email}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                  {selectedCandidate.email}
                </a>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Government ID ({selectedCandidate.id_type})</small>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedCandidate.id_number}</strong>
              </div>

              <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <small style={{ color: '#166534', display: 'block', fontSize: '11px', fontWeight: 700 }}>Payment Fee Amount</small>
                <strong style={{ color: '#15803d', fontSize: '15px' }}>
                  {selectedCandidate.amount ? `₹${Number(selectedCandidate.amount).toLocaleString('en-IN')}` : '— (Pending Payment)'}
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Bank UTR / UPI Reference</small>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '13px' }}>{selectedCandidate.utr_number || 'Not Submitted Yet'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Official Receipt No.</small>
                <strong style={{ fontFamily: 'monospace', color: '#c2410c' }}>{selectedCandidate.receipt_number || 'Pending Generation'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Payment Status</small>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>{selectedCandidate.payment_status || 'Pending'}</span>
              </div>

              <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Target Industrial Course</small>
                <strong style={{ color: 'var(--orange)', fontSize: '14px' }}>{selectedCandidate.course}</strong>
              </div>
            </div>

            {/* MANUAL AMOUNT & UTR MANAGEMENT FOR ADMIN */}
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', color: '#166534', fontWeight: 700 }}>
                  💰 Manual Amount (₹) &amp; UTR Management
                </h4>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                  Admin Dynamic Override
                </span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#14532d', lineHeight: 1.5 }}>
                View or manually adjust the exact amount (₹) and 12-digit UTR submitted by the candidate during payment. Changes save directly to the central database and dynamically update the official fee receipt.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Amount (₹):</label>
                  <input
                    type="number"
                    value={candidateAmountValue}
                    onChange={(e) => setCandidateAmountValue(e.target.value)}
                    placeholder="e.g. 5000"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>12-Digit Bank UTR:</label>
                  <input
                    type="text"
                    value={candidateUtrValue}
                    onChange={(e) => setCandidateUtrValue(e.target.value)}
                    placeholder="e.g. 397973124141"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Payment Status:</label>
                  <select
                    value={candidateStatusValue}
                    onChange={(e) => setCandidateStatusValue(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Scanned">Scanned</option>
                    <option value="Verified">Verified</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  disabled={savingAmountUtr}
                  onClick={() => handleSaveCourseAmountUtr(selectedCandidate.id)}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 0,
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                  }}
                >
                  {savingAmountUtr ? 'Saving…' : '💾 Save Amount & UTR to Database'}
                </button>
              </div>
            </div>

            {/* QR SCAN & GEOLOCATION AUDIT BOX */}
            <div style={{ 
              background: selectedCandidate.scanned ? '#f0fdf4' : '#fffbeb', 
              border: `1.5px solid ${selectedCandidate.scanned ? '#86efac' : '#fde68a'}`,
              borderRadius: '12px', 
              padding: '16px 20px', 
              marginBottom: '20px' 
            }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: selectedCandidate.scanned ? '#166534' : '#92400e' }}>
                {selectedCandidate.scanned ? '✅ QR Code Scan Audit Record' : '⏳ No QR Scan Recorded Yet'}
              </h4>

              {selectedCandidate.scanned ? (
                <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: '#166534' }}>
                  <div><strong>Scanned Timestamp:</strong> {new Date(selectedCandidate.scanned_at).toLocaleString()}</div>
                  {selectedCandidate.scan_lat && selectedCandidate.scan_long ? (
                    <>
                      <div><strong>GPS Coordinates:</strong> Latitude: {Number(selectedCandidate.scan_lat).toFixed(6)}, Longitude: {Number(selectedCandidate.scan_long).toFixed(6)}</div>
                      <div style={{ marginTop: '8px' }}>
                        <a
                          href={`https://www.google.com/maps?q=${selectedCandidate.scan_lat},${selectedCandidate.scan_long}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#16a34a',
                            color: '#fff',
                            textDecoration: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>📍 Open Exact GPS Location on Google Maps ↗</span>
                        </a>
                      </div>
                    </>
                  ) : (
                    <div>GPS Coordinates: Not provided by candidate device (Scan timestamp logged via network IP).</div>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>
                  The candidate has not scanned the bank account QR code yet. When scanned, latitude, longitude, and timestamp will automatically appear here.
                </p>
              )}
            </div>

            {/* ADMIN NOTES */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Internal Admin Notes:
              </label>
              <textarea
                rows={3}
                placeholder="Add notes about payment verification, batch allocation, or call logs..."
                value={candidateNotesValue}
                onChange={(e) => setCandidateNotesValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={() => handleSaveCourseNotes(selectedCandidate.id)}
                  className="button primary"
                  style={{ padding: '7px 16px', fontSize: '12px' }}
                >
                  {savingNotes ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAdminReceiptCandidate(selectedCandidate);
                    setSelectedCandidate(null);
                  }}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 0,
                    padding: '7px 14px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📄 View &amp; Print Fee Receipt
                </button>
                <a
                  href={`tel:+91${selectedCandidate.contact_number}`}
                  className="button outline"
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                >
                  📞 Call
                </a>
                <a
                  href={`https://wa.me/91${selectedCandidate.contact_number}?text=${encodeURIComponent(`Hello ${selectedCandidate.name}, this is Soft Tech Solution regarding your course registration (Candidate ID: ${selectedCandidate.candidate_id}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '7px 12px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  💬 WhatsApp
                </a>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="button outline"
                style={{ padding: '7px 18px', fontSize: '12px' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==============================================================
          ADMIN OFFICIAL FEE RECEIPT VIEWER & PRINTER MODAL
          ============================================================== */}
      {adminReceiptCandidate && (() => {
        const parsedReceipt = (() => {
          if (!adminReceiptCandidate.receipt_data) return null;
          try {
            return typeof adminReceiptCandidate.receipt_data === 'string'
              ? JSON.parse(adminReceiptCandidate.receipt_data)
              : adminReceiptCandidate.receipt_data;
          } catch (e) {
            return null;
          }
        })();
        const dynamicAmount = parsedReceipt?.amount || adminReceiptCandidate.amount || '';
        const dynamicAmountWords = (dynamicAmount && Number(dynamicAmount) > 0)
          ? numberToWordsINR(dynamicAmount)
          : (parsedReceipt?.amount_words || 'Zero Rupees Only');
        const dynamicUtr = parsedReceipt?.utr_number || adminReceiptCandidate.utr_number || 'PENDING-UTR';
        const dynamicReceiptNo = parsedReceipt?.receipt_number || adminReceiptCandidate.receipt_number || `REC-2026-${adminReceiptCandidate.candidate_id?.replace(/\s+/g, '') || 'STS'}-VERIFIED`;

        const waMessageText = `Hello Sir,\nHere is the official course fee payment receipt details:\n\n🧾 Receipt No: ${dynamicReceiptNo}\n👤 Candidate ID: ${adminReceiptCandidate.candidate_id}\n👤 Candidate Name: ${adminReceiptCandidate.name}\n👨‍👦 Father's Name: ${adminReceiptCandidate.father_name || 'N/A'}\n📞 Contact: +91 ${adminReceiptCandidate.contact_number}\n✉️ Email: ${adminReceiptCandidate.email}\n🪪 Govt ID: ${adminReceiptCandidate.id_type} - ${adminReceiptCandidate.id_number}\n📚 Course: ${adminReceiptCandidate.course}\n💰 Amount Paid: ₹${Number(dynamicAmount || 0).toLocaleString('en-IN')} (${dynamicAmountWords})\n🏦 Bank UTR: ${dynamicUtr}\n💳 Mode: UPI / SBI Bank Transfer\n📅 Date: ${new Date(adminReceiptCandidate.paid_at || adminReceiptCandidate.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n✅ Payment Status: ${adminReceiptCandidate.payment_status || 'Verified'}\n\nPlease verify admission record. Thank you!`;

        return (
          <div className="receipt-modal-backdrop" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            zIndex: 99999,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
          onClick={() => setAdminReceiptCandidate(null)}
          >
            {/* PRINT ISOLATION CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                html, body {
                  background: #ffffff !important;
                  color: #0f172a !important;
                  height: auto !important;
                  overflow: visible !important;
                }
                body > * {
                  visibility: hidden !important;
                }
                .receipt-modal-backdrop {
                  position: static !important;
                  background: transparent !important;
                  inset: auto !important;
                  overflow: visible !important;
                  display: block !important;
                  padding: 0 !important;
                  visibility: visible !important;
                }
                .receipt-card-wrapper {
                  box-shadow: none !important;
                  border: none !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  max-height: none !important;
                  height: auto !important;
                  visibility: visible !important;
                  overflow: visible !important;
                }
                #admin-receipt-print-area, #admin-receipt-print-area * {
                  visibility: visible !important;
                  overflow: visible !important;
                  max-height: none !important;
                  height: auto !important;
                }
                .admin-receipt-no-print {
                  display: none !important;
                }
              }
            ` }} />

            <div className="receipt-card-wrapper" 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: 'calc(100vh - 32px)',
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto',
                boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                border: '1px solid #e2e8f0',
                position: 'relative',
                overflow: 'hidden',
              }}>
              {/* TOP BAR */}
              <div className="admin-receipt-no-print" style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📄</span>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                    Admin Panel — Student Fee Receipt
                  </span>
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                    {adminReceiptCandidate.payment_status || 'Verified'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => printReceiptElement('admin-receipt-print-area', `Soft-Tech-Receipt-${adminReceiptCandidate.candidate_id}`)}
                    style={{
                      background: '#16a34a',
                      border: 0,
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    🖨️ Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminReceiptCandidate(null)}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 0,
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#cbd5e1',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* PRINTABLE RECEIPT CONTENT */}
              <div id="admin-receipt-print-area" style={{ padding: '28px 32px', background: '#ffffff', color: '#0f172a', overflowY: 'auto', flex: '1 1 auto' }}>
                
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #e9772d, #f5a42a)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '16px' }}>
                        S
                      </div>
                      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        SOFT TECH SOLUTION
                      </h2>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                      Industrial Software Training &amp; Technology Solutions
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                      Post Office: Noida Sector 62 S.O, District: Gautam Buddha Nagar, Uttar Pradesh - 201309 · Contact: +91 91176 96512
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', background: '#0f172a', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                      OFFICIAL FEE RECEIPT
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Receipt No: <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '12px' }}>{dynamicReceiptNo}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Date: <strong style={{ color: '#0f172a' }}>{new Date(adminReceiptCandidate.paid_at || adminReceiptCandidate.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </div>
                  </div>
                </div>

                {/* CANDIDATE INFO */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Candidate ID:</span>
                      <strong style={{ fontFamily: 'monospace', color: '#c2410c', fontSize: '13px', background: '#fff7ed', padding: '1px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                        {adminReceiptCandidate.candidate_id}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Candidate Name:</span>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>{adminReceiptCandidate.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Father&apos;s Name:</span>
                      <span style={{ color: '#334155' }}>{adminReceiptCandidate.father_name}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Contact Number:</span>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>+91 {adminReceiptCandidate.contact_number}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Email Address:</span>
                      <span style={{ color: '#334155' }}>{adminReceiptCandidate.email}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Government ID ({adminReceiptCandidate.id_type}):</span>
                      <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{adminReceiptCandidate.id_number}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Enrolled Industrial Track:</span>
                    <strong style={{ color: '#e9772d', fontSize: '12.5px' }}>{adminReceiptCandidate.course}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Duration: 6 Months (24 Weeks) Industrial Training · Mon-Fri, 8:00 PM – 9:00 PM
                    </div>
                  </div>
                </div>

                {/* PAYMENT TABLE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '18px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Bank Reference / UTR</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', verticalAlign: 'top' }}>1</td>
                      <td style={{ padding: '10px', verticalAlign: 'top' }}>
                        <strong>Full Stack Web Development Industrial Training Tuition Fee</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Beneficiary: Aashutosh Kumar (SBI A/c 39797312414, IFSC: SBIN0003002)
                        </div>
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'top', fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>
                        {dynamicUtr}
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'top', textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>
                        {dynamicAmount ? `₹${Number(dynamicAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={3} style={{ padding: '10px', textAlign: 'right' }}>
                        Total Amount Received:
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#16a34a', fontSize: '15px' }}>
                        {dynamicAmount ? `₹${Number(dynamicAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* AMOUNT IN WORDS & VERIFIED STAMP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ maxWidth: '380px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Amount in Words:</span>
                    <strong style={{ fontSize: '12px', color: '#0f172a', fontStyle: 'italic' }}>
                      {dynamicAmountWords}
                    </strong>
                    <div style={{ marginTop: '6px', fontSize: '10.5px', color: '#64748b' }}>
                      Payment Status: <strong style={{ color: '#16a34a' }}>✓ VERIFIED &amp; LOGGED IN DATABASE</strong>
                    </div>
                  </div>

                  <div style={{
                    border: '2px solid #16a34a',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    textAlign: 'center',
                    background: '#f0fdf4',
                    color: '#166534',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.1)'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      ★ SOFT TECH SOLUTION ★
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 800 }}>
                      FEES PAID &amp; CONFIRMED
                    </div>
                    <div style={{ fontSize: '9px', color: '#15803d', marginTop: '2px' }}>
                      AUTH CODE: {adminReceiptCandidate.candidate_id?.replace(/\s+/g, '')}-{(dynamicReceiptNo || 'VERIFIED').slice(-4)}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#64748b' }}>
                  <div style={{ maxWidth: '360px', lineHeight: 1.4 }}>
                    <p style={{ margin: '0 0 2px' }}><strong>Note:</strong> Official fee receipt issued via Soft Tech Solution Central Database.</p>
                    <p style={{ margin: 0 }}>Candidate ID: {adminReceiptCandidate.candidate_id} · Keep this receipt for batch onboarding.</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '130px', margin: '0 auto 4px', height: '24px' }}></div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Authorized Signatory</span>
                    <div style={{ fontSize: '9px' }}>Soft Tech Solution</div>
                  </div>
                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="admin-receipt-no-print" style={{ background: '#f8fafc', padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={`https://wa.me/919117696512?text=${encodeURIComponent(waMessageText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#16a34a',
                      color: '#fff',
                      textDecoration: 'none',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(22,163,74,0.25)'
                    }}
                  >
                    <span>💬 WhatsApp Receipt (to 9117696512)</span>
                  </a>

                  <a
                    href={`https://wa.me/91${adminReceiptCandidate.contact_number}?text=${encodeURIComponent(`Hello Sir,\nHere is your official course fee receipt from Soft Tech Solution:\n\nReceipt No: ${dynamicReceiptNo}\nCandidate ID: ${adminReceiptCandidate.candidate_id}\nCourse: ${adminReceiptCandidate.course}\nAmount Paid: ${dynamicAmount ? `₹${Number(dynamicAmount).toLocaleString('en-IN')}` : 'Pending'}\nBank UTR: ${dynamicUtr}\nStatus: Confirmed & Enrolled\n\nWelcome to Soft Tech Solution!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#0f172a',
                      color: '#fff',
                      textDecoration: 'none',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <span>📲 Send to Student (+91 {adminReceiptCandidate.contact_number})</span>
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => printReceiptElement('admin-receipt-print-area', `Soft-Tech-Receipt-${adminReceiptCandidate.candidate_id}`)}
                    style={{
                      background: '#e9772d',
                      color: '#fff',
                      border: 0,
                      padding: '9px 18px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🖨️ Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminReceiptCandidate(null)}
                    style={{
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

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
