'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrainingCoursePage() {
  const router = useRouter();

  // Next candidate ID from server
  const [nextCandId, setNextCandId] = useState('Loading...');
  const [loadingNextId, setLoadingNextId] = useState(true);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    father_name: '',
    id_type: 'AADHAAR', // 'AADHAAR' | 'PAN'
    id_number: '',
    email: '',
    course: 'Full Stack Web Development Course (HTML, CSS, JS, React, MySQL, Node.js, GitHub, Prompting etc.)', // auto-selected single track
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Fetch next candidate ID on mount
  useEffect(() => {
    async function fetchNextId() {
      try {
        const res = await fetch('/api/courses/next-id', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.nextId) {
            setNextCandId(data.nextId);
          }
        }
      } catch (err) {
        console.warn('Could not load next candidate ID:', err);
        setNextCandId('cand 001');
      } finally {
        setLoadingNextId(false);
      }
    }
    fetchNextId();
  }, []);

  // Format Aadhaar with spaces (XXXX XXXX XXXX)
  const formatAadhaar = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  // Validate fields in real time
  const validate = () => {
    const newErrors = {};

    // 1. Candidate Name
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name (minimum 2 characters).';
    }

    // 2. Contact Number (10 digits)
    const cleanPhone = formData.contact_number.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.contact_number = 'Contact number must be exactly 10 digits.';
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.contact_number = 'Indian mobile number should start with 6, 7, 8, or 9.';
    }

    // 3. Father's Name
    if (!formData.father_name.trim() || formData.father_name.trim().length < 2) {
      newErrors.father_name = "Please enter father's full name (minimum 2 characters).";
    }

    // 4. Aadhaar / PAN
    const rawId = formData.id_number.replace(/[\s-]/g, '').toUpperCase();
    if (!rawId) {
      newErrors.id_number = `Please enter your ${formData.id_type === 'AADHAAR' ? '12-digit Aadhaar' : '10-character PAN'} number.`;
    } else if (formData.id_type === 'AADHAAR') {
      if (!/^\d{12}$/.test(rawId)) {
        newErrors.id_number = 'Aadhaar must be exactly 12 numeric digits.';
      } else if (/^(\d)\1{11}$/.test(rawId)) {
        newErrors.id_number = 'Invalid Aadhaar: cannot consist of 12 identical digits.';
      }
    } else if (formData.id_type === 'PAN') {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(rawId)) {
        newErrors.id_number = 'PAN format must be 5 uppercase letters, 4 digits, and 1 letter (e.g. ABCDE1234F).';
      }
    }

    // 5. Candidate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid candidate email address.';
    } else {
      const domain = formData.email.trim().toLowerCase().split('@')[1] || '';
      if (domain.includes('gmail') && domain !== 'gmail.com') {
        newErrors.email = 'Did you mean @gmail.com? Please verify.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setApiError('');
    if (field === 'contact_number') {
      // Only keep digits and limit to 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, contact_number: digits }));
    } else if (field === 'id_number') {
      if (formData.id_type === 'AADHAAR') {
        const formatted = formatAadhaar(value);
        setFormData(prev => ({ ...prev, id_number: formatted }));
      } else {
        const panVal = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        setFormData(prev => ({ ...prev, id_number: panVal }));
      }
    } else if (field === 'id_type') {
      setFormData(prev => ({
        ...prev,
        id_type: value,
        id_number: '', // reset id number when switching type
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const cleanId = formData.id_number.replace(/[\s-]/g, '').toUpperCase();
      const payload = {
        name: formData.name.trim(),
        contact_number: formData.contact_number.trim(),
        father_name: formData.father_name.trim(),
        id_type: formData.id_type,
        id_number: cleanId,
        email: formData.email.trim().toLowerCase(),
        course: formData.course,
      };

      const res = await fetch('/api/courses/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit course registration.');
      }

      // Successful registration! Redirect to QR code payment page with candidate id
      const candidateId = data.candidate?.id || data.candidate?.candidate_id;
      router.push(`/training/payment?id=${encodeURIComponent(candidateId)}`);
    } catch (err) {
      setApiError(err.message || 'An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* HERO SECTION */}
      <section 
        style={{
          background: 'linear-gradient(135deg, #101c3d 0%, #172a5a 55%, #1f3b80 100%)',
          color: '#fff',
          padding: '75px 0 65px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(233,119,45,0.18) 0%, rgba(233,119,45,0) 70%)',
            right: '-100px',
            top: '-100px',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#fed7aa', marginBottom: '18px' }}>
            <span>⚡ Professional Tech Training &amp; Industrial Cohort</span>
          </div>

          <h1 
            style={{ 
              fontFamily: 'Poppins, sans-serif', 
              fontSize: 'clamp(32px, 4.5vw, 52px)', 
              fontWeight: 800, 
              letterSpacing: '-0.03em', 
              lineHeight: 1.15,
              margin: '0 0 16px',
              color: '#ffffff',
            }}
          >
            Candidate Admission &amp; <span style={{ color: 'var(--orange, #e9772d)' }}>Course Registration</span>
          </h1>

          <p style={{ maxWidth: '680px', color: '#cbd5e1', fontSize: '16px', lineHeight: 1.7, margin: 0 }}>
            Enroll in high-impact industrial software engineering tracks mentored directly by MCA graduates from <strong>Tata Power</strong> &amp; <strong>Railworld</strong>. Learn full stack architecture, write production code, and gain verifiable enterprise experience.
          </p>

          {/* Assigned Candidate ID Notice & Course Syllabus PDF Actions */}
          <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Real-time Candidate ID Badge */}
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '12px', 
                background: 'rgba(255, 255, 255, 0.08)', 
                backdropFilter: 'blur(10px)',
                padding: '10px 18px', 
                borderRadius: '10px', 
                border: '1px solid rgba(255, 255, 255, 0.15)' 
              }}
            >
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Next Auto-Assigned Candidate ID:</span>
              <span 
                style={{ 
                  fontFamily: 'monospace', 
                  fontWeight: 800, 
                  fontSize: '15px', 
                  color: '#ff944d', 
                  background: '#0b1329', 
                  padding: '4px 10px', 
                  borderRadius: '6px',
                  border: '1px solid #ff944d55'
                }}
              >
                {loadingNextId ? 'Calculating...' : nextCandId}
              </span>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>✓ Real-time Sequential ID</span>
            </div>

            {/* Syllabus in PDF Format - Directly Beside Candidate ID */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="/syllabus-web-development-course.pdf"
                download="SoftTechSolution-WebDevelopment-Syllabus.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #e9772d 0%, #ea580c 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(233,119,45,0.35)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span style={{ fontSize: '15px' }}>📄</span>
                <span>Download Syllabus (PDF)</span>
                <span 
                  style={{ 
                    background: 'rgba(0,0,0,0.25)', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 800 
                  }}
                >
                  6 Months / 24 Weeks
                </span>
              </a>

              <button
                type="button"
                onClick={() => setShowSyllabusModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>👁️</span>
                <span>View Full Syllabus &amp; Roadmap</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FORM + BENEFITS GRID */}
      <section className="wrap" style={{ marginTop: '-30px', position: 'relative', zIndex: 10 }}>
        <div className="training-layout-grid" style={{ display: 'grid', gap: '32px', alignItems: 'start' }}>
          
          {/* MAIN ENROLLMENT FORM CARD */}
          <div 
            className="training-form-card"
            style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)', 
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px', marginBottom: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                    Student Application Form
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Fill all details accurately for your official batch registration &amp; QR verification.
                  </p>
                </div>
                <div 
                  style={{ 
                    background: '#fff7ed', 
                    border: '1px solid #fed7aa', 
                    color: '#c2410c', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: 700 
                  }}
                >
                  Candidate ID: {nextCandId}
                </div>
              </div>
            </div>

            {apiError && (
              <div 
                style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  color: '#991b1b', 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  marginBottom: '20px', 
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* 1. CANDIDATE NAME */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="candidate_name"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}
                >
                  Candidate Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  id="candidate_name"
                  type="text"
                  placeholder="e.g. Rahul Kumar Verma"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    border: `1.5px solid ${errors.name ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: '14px',
                    color: '#0f172a',
                    background: '#fff',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.name && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0', fontWeight: 500 }}>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 2. CONTACT NUMBER */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label 
                    htmlFor="contact_number"
                    style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}
                  >
                    Contact Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: formData.contact_number.length === 10 ? '#16a34a' : '#94a3b8' }}>
                    {formData.contact_number.length}/10 Digits
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <span 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      fontSize: '13px', 
                      color: '#64748b', 
                      fontWeight: 600 
                    }}
                  >
                    +91
                  </span>
                  <input 
                    id="contact_number"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.contact_number}
                    onChange={(e) => handleChange('contact_number', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px 12px 48px',
                      borderRadius: '8px',
                      border: `1.5px solid ${errors.contact_number ? '#ef4444' : '#cbd5e1'}`,
                      outline: 'none',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#fff',
                    }}
                  />
                </div>
                {errors.contact_number && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0', fontWeight: 500 }}>
                    {errors.contact_number}
                  </p>
                )}
              </div>

              {/* 3. FATHER'S NAME */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="father_name"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}
                >
                  Father&apos;s Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  id="father_name"
                  type="text"
                  placeholder="e.g. Ramesh Chandra Verma"
                  value={formData.father_name}
                  onChange={(e) => handleChange('father_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    border: `1.5px solid ${errors.father_name ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: '14px',
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
                {errors.father_name && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0', fontWeight: 500 }}>
                    {errors.father_name}
                  </p>
                )}
              </div>

              {/* 4. AADHAAR / PAN NUMBER WITH PROPER CHECK */}
              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div className="gov-id-header">
                  <label htmlFor="id_number" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    Government ID Verification <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  
                  {/* ID TYPE SELECTOR TABS */}
                  <div className="gov-id-tabs">
                    <button
                      type="button"
                      onClick={() => handleChange('id_type', 'AADHAAR')}
                      style={{
                        flex: 1,
                        border: 0,
                        background: formData.id_type === 'AADHAAR' ? '#ffffff' : 'transparent',
                        color: formData.id_type === 'AADHAAR' ? '#0f172a' : '#64748b',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: formData.id_type === 'AADHAAR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}
                    >
                      Aadhaar Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('id_type', 'PAN')}
                      style={{
                        flex: 1,
                        border: 0,
                        background: formData.id_type === 'PAN' ? '#ffffff' : 'transparent',
                        color: formData.id_type === 'PAN' ? '#0f172a' : '#64748b',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: formData.id_type === 'PAN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}
                    >
                      PAN Card
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <input 
                    id="id_number"
                    type="text"
                    placeholder={formData.id_type === 'AADHAAR' ? '1234 5678 9012 (12 digits)' : 'ABCDE1234F (10 characters)'}
                    value={formData.id_number}
                    onChange={(e) => handleChange('id_number', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      border: `1.5px solid ${errors.id_number ? '#ef4444' : '#cbd5e1'}`,
                      outline: 'none',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#ffffff',
                      fontFamily: 'monospace',
                      letterSpacing: '1px',
                    }}
                  />
                  {formData.id_number && !errors.id_number && (
                    <span 
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: '#16a34a',
                        fontWeight: 700,
                        fontSize: '14px' 
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  <small style={{ color: '#64748b', fontSize: '11px', flex: '1 1 180px' }}>
                    {formData.id_type === 'AADHAAR' 
                      ? 'Format: 12 numeric digits with automated spacing check.' 
                      : 'Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).'}
                  </small>
                  <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    🔒 Verified &amp; Encrypted
                  </span>
                </div>

                {errors.id_number && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0', fontWeight: 500 }}>
                    {errors.id_number}
                  </p>
                )}
              </div>

              {/* 5. CANDIDATE EMAIL ID */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="candidate_email"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}
                >
                  Candidate Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  id="candidate_email"
                  type="email"
                  placeholder="candidate@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    border: `1.5px solid ${errors.email ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: '14px',
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
                {errors.email && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0', fontWeight: 500 }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 6. COURSE SELECTION (ONLY ONE AUTO-SELECTED OPTION) */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '7px' }}>
                  <label 
                    htmlFor="course_select"
                    style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}
                  >
                    Target Industrial Training Course <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      background: '#ecfdf5', 
                      color: '#065f46', 
                      border: '1px solid #a7f3d0', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ✓ Auto-Selected Track
                  </span>
                </div>
                <select
                  id="course_select"
                  value={formData.course}
                  onChange={(e) => handleChange('course', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 15px',
                    borderRadius: '8px',
                    border: '1.5px solid #0284c7',
                    outline: 'none',
                    fontSize: '13px',
                    color: '#0f172a',
                    background: '#f0f9ff',
                    fontWeight: 700,
                    cursor: 'default',
                  }}
                >
                  <option value="Full Stack Web Development Course (HTML, CSS, JS, React, MySQL, Node.js, GitHub, Prompting etc.)">
                    Full Stack Web Development Course (HTML, CSS, JS, React, MySQL, Node.js, GitHub, Prompting etc.)
                  </option>
                </select>

                {/* TECH STACK PILLS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {['HTML5', 'CSS3', 'JavaScript', 'React', 'MySQL', 'Node.js', 'GitHub', 'AI Prompting'].map((tech) => (
                    <span 
                      key={tech} 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        background: '#ffffff', 
                        color: '#0f172a', 
                        border: '1px solid #cbd5e1', 
                        padding: '3px 8px', 
                        borderRadius: '6px' 
                      }}
                    >
                      ⚡ {tech}
                    </span>
                  ))}
                </div>

                <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '8px' }}>
                  Includes 100% hands-on training in HTML, CSS, JS, React, MySQL, Node.js, GitHub, and AI Prompt Engineering.
                </small>
              </div>

              {/* SUBMISSION BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(100deg, #e9772d 0%, #f5a42a 100%)',
                  color: '#ffffff',
                  border: 0,
                  borderRadius: '10px',
                  padding: '16px 24px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.75 : 1,
                  boxShadow: '0 10px 25px rgba(233, 119, 45, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                {submitting ? (
                  <>
                    <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                    <span>Creating Enrollment &amp; Generating QR...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Form &amp; Proceed to Bank QR Code</span>
                    <span style={{ fontSize: '18px' }}>→</span>
                  </>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '12px', margin: '12px 0 0' }}>
                Upon submission, your candidate record and ID ({nextCandId}) will be secured, and you will be redirected to the official bank account QR code.
              </p>
            </form>
          </div>

          {/* RIGHT COLUMN: COHORT HIGHLIGHTS & FOUNDER MENTORSHIP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* CARD 1: TRACK HIGHLIGHTS */}
            <div 
              style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                padding: '28px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', display: 'grid', placeItems: 'center', fontSize: '18px', fontWeight: 800 }}>
                  🚀
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Full Stack Web Development
                  </h3>
                  <small style={{ color: '#64748b', fontSize: '11px' }}>Flagship 6-Month Intensive Track</small>
                </div>
              </div>

              <ul style={{ margin: '16px 0', paddingLeft: '18px', fontSize: '13px', color: '#475569', lineHeight: 1.8 }}>
                <li><strong>HTML5 &amp; CSS3:</strong> Modern semantic web, responsive UI, Flexbox, CSS Grid.</li>
                <li><strong>JavaScript (ES6+):</strong> Async/await, DOM APIs, event loop, functional programming.</li>
                <li><strong>React.js:</strong> Component architecture, Custom Hooks, state management, SPA.</li>
                <li><strong>MySQL Database:</strong> Relational schema design, SQL queries, indexing, transactions.</li>
                <li><strong>Node.js &amp; Express:</strong> RESTful APIs, JWT authentication, backend services.</li>
                <li><strong>GitHub &amp; Git:</strong> Version control, branch strategies, collaborative PR workflows.</li>
                <li><strong>AI Prompting &amp; Tools:</strong> AI pair programming, prompt engineering for developers.</li>
              </ul>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
                💡 <strong>Direct Mentorship:</strong> 1-on-1 code reviews by Ex-Tata Power &amp; Ex-Railworld tech leads to build an industry-ready engineering portfolio.
              </div>
            </div>

            {/* CARD 2: MENTOR DIRECT CALL/WHATSAPP */}
            <div 
              style={{ 
                background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
                color: '#ffffff', 
                borderRadius: '16px', 
                padding: '26px', 
                border: '1px solid rgba(255,255,255,0.08)' 
              }}
            >
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fb923c', fontWeight: 700 }}>
                HAVE QUESTIONS BEFORE JOINING?
              </span>
              <h3 style={{ margin: '8px 0 10px', fontSize: '18px', fontWeight: 700 }}>
                Speak with the Leadership Team
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px' }}>
                Our mentors are accessible directly to help guide your career path and syllabus fit.
              </p>

              <div className="training-mentor-buttons">
                <a 
                  href="tel:+919117696512" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    background: 'rgba(255,255,255,0.1)', 
                    color: '#fff', 
                    textDecoration: 'none', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.15)',
                    minHeight: '44px',
                  }}
                >
                  📞 Call Aashutosh
                </a>
                <a 
                  href="https://wa.me/916205570278?text=Hello%20Ankitosh,%20I%20have%20an%20inquiry%20regarding%20the%20Full%20Stack%20Web%20Development%20Course." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    background: '#16a34a', 
                    color: '#fff', 
                    textDecoration: 'none', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 700,
                    minHeight: '44px',
                  }}
                >
                  💬 WhatsApp Tech Lead
                </a>
              </div>
            </div>

            {/* CARD 3: AUDIT & QR NOTICE */}
            <div 
              style={{ 
                background: '#fffbeb', 
                border: '1px solid #fef3c7', 
                borderRadius: '12px', 
                padding: '18px', 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'start' 
              }}
            >
              <span style={{ fontSize: '20px' }}>📍</span>
              <div style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.6 }}>
                <strong>Automated Geolocation Audit:</strong> When you submit this registration, you will be directed to our official bank QR code where the QR scan entry will be timestamped with GPS location coordinates in our database.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          INTERACTIVE FULL COURSE SYLLABUS & ROADMAP MODAL
          ============================================================ */}
      {showSyllabusModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: 'clamp(10px, 3vw, 20px)',
            overflowY: 'auto'
          }}
          onClick={() => setShowSyllabusModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              animation: 'scaleUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* STICKY MODAL HEADER */}
            <div
              style={{
                padding: '20px 28px',
                background: '#0f172a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#e9772d', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '2px' }}>
                  INDUSTRIAL COHORT ROADMAP • 6 MONTHS (24 WEEKS)
                </span>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Syllabus: Full Stack Web Development Course
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href="/syllabus-web-development-course.pdf"
                  download="SoftTechSolution-WebDevelopment-Syllabus.pdf"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#e9772d',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <span>📥 Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowSyllabusModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 0,
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* SCROLLABLE MODAL BODY */}
            <div style={{ padding: '28px', overflowY: 'auto', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
              
              {/* KEY STATS CARD */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px 22px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Course Duration</small>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>6 Months (24 Weeks)</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Class Schedule</small>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>Mon–Fri, 8:00 PM – 9:00 PM</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Sunday Schedule</small>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>Weekly Interview Prep &amp; Assessment</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Learning Approach</small>
                  <strong style={{ color: '#e9772d', fontSize: '14px' }}>Fundamentals → Practice → Projects → Deploy</strong>
                </div>
              </div>

              {/* COURSE OBJECTIVE */}
              <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '18px 20px', border: '1px solid #fef3c7', marginBottom: '26px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎯 Course Objective
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>
                  To develop practical skills in frontend web development, database management, version control, AI-assisted coding, website deployment, and interview preparation. By the end of the course, learners should be able to design responsive websites, build interactive React applications, manage databases, use GitHub collaboratively, and deploy a project online.
                </p>
              </div>

              {/* 11 CORE MODULES */}
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                📚 11 Comprehensive Course Modules
              </h4>

              <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                
                {/* MODULE 1 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 1: HTML3 Fundamentals &amp; HTML5
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Weeks 1–2
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> Introduction to web, browsers, servers; HTML structure, tags, elements, attributes; HTML3 legacy concepts &amp; overview; HTML5 document structure &amp; modern standards; Headings, paragraphs, links, images, lists, tables, forms, inputs, buttons, validation; Semantic elements (header, nav, main, section, article, footer); Audio, video, iframe; Entities, metadata, favicon; Accessibility basics &amp; SEO-friendly structure.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Personal profile webpage, interactive registration form, multi-page HTML portfolio.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Build structured, accessible web pages using modern HTML5.
                  </div>
                </div>

                {/* MODULE 2 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 2: CSS — Styling &amp; Responsive Design
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Weeks 3–5
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> CSS syntax, selectors, properties, values (inline, internal, external); Colors, backgrounds, borders, shadows, gradients; Units (px, %, em, rem, vh, vw); Typography, fonts, icons; Box model, margin, padding, borders; Display, position, z-index, overflow, visibility; Flexbox and CSS Grid layout engines; Transitions, transforms, keyframes; Responsive design, media queries, mobile-first layouts; CSS variables, browser DevTools.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Responsive landing page, navbar &amp; card layouts, responsive portfolio website, pixel-perfect sample webpage reproduction.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Design attractive, responsive websites for mobile, tablet, and desktop.
                  </div>
                </div>

                {/* MODULE 3 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 3: JavaScript — Programming &amp; DOM
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Weeks 6–10
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> JS setup, console, variables (var, let, const), data types, operators, coercion; Conditionals, loops (for, while, for...of, for...in); Functions, arrow functions, scope, hoisting, closures; Arrays, objects, destructuring, spread/rest; Methods: map, filter, find, reduce, forEach; DOM selection, manipulation, events; Form validation; ES6+ modules, error handling (try/catch); JSON, localStorage, sessionStorage; Callbacks, Promises, async/await, event loop, Fetch API &amp; REST fundamentals.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Calculator app, To-do list with localStorage, form validator, search &amp; filter UI, live Weather app with public API.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Write interactive JavaScript applications and master asynchronous programming.
                  </div>
                </div>

                {/* MODULE 4 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 4: Git &amp; GitHub — Version Control
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Week 11
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> Git vs GitHub differences; Repository creation, git init, status, add, commit, log; Branching, checkout/switch, merge; Remote repositories, origin, git push, pull, fetch, clone; Pull requests, code review basics; Merge conflicts &amp; resolution; .gitignore, README.md, branching workflows, commit conventions.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Push all assignments to GitHub, create feature branches, resolve simulated merge conflict, maintain clean repository documentation.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Manage project code safely and collaboratively using Git and GitHub.
                  </div>
                </div>

                {/* MODULE 5 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 5: MySQL, MySQL Workbench &amp; XAMPP
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Weeks 12–14
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> Relational database fundamentals, tables, rows, columns; MySQL installation, Workbench setup, XAMPP, MariaDB, phpMyAdmin; Database/table creation, data types, primary/foreign keys, constraints; CRUD (INSERT, SELECT, UPDATE, DELETE); WHERE, ORDER BY, GROUP BY, HAVING; Aggregates, aliases; Joins (INNER, LEFT, RIGHT, Self); Subqueries, views, indexes, normalization, transactions, ACID, ER diagrams, backups.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Student management database, employee management database, complex CRUD queries &amp; multi-table joins, ER diagram schema design.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Design relational databases and write practical SQL queries using MySQL tools.
                  </div>
                </div>

                {/* MODULE 6 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 6: ChatGPT &amp; Effective Prompting
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Week 15
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> Understanding AI assistants &amp; limitations; Writing clear, specific prompts; Providing context, requirements, examples; Prompting for HTML, CSS, JS, React, SQL; Code explanation line-by-line; Debugging errors with logs; Test case generation; AI for documentation &amp; code review; Iterative prompting; Verifying correctness, security, avoiding leaking confidential keys.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Convert requirements to coding prompts, debug JS runtime errors, generate SQL queries with validation, plan and document a mini-project.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Use AI productively while understanding and verifying code rather than blindly copying.
                  </div>
                </div>

                {/* MODULE 7 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 7: React.js — Frontend Development
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Weeks 16–20
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> Component-based architecture; Node.js, npm, dev server; JSX syntax, expressions; Functional components, props, composition; useState, event handling, conditional rendering; Lists &amp; keys; Forms &amp; controlled components; useEffect &amp; lifecycle; Fetch API &amp; integration; Loading, error, empty states; React Router navigation; Context API (useContext); Custom hooks; Performance optimization; React DevTools; Safe rendering.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Reusable component library, product listing &amp; search UI, multi-page React application, REST API integration with forms &amp; routing.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Build maintainable, interactive, component-based frontend applications using React.js.
                  </div>
                </div>

                {/* MODULE 8 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 8: PostgreSQL &amp; Neon Database
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Week 21
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> PostgreSQL fundamentals &amp; MySQL differences; PostgreSQL data types; Neon serverless PostgreSQL introduction; Creating projects &amp; databases; Connection strings, pooling concepts; Tables, constraints, relationships; CRUD queries, joins, aggregation; Environment variables, credentials, backups, access management.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Create Neon PostgreSQL database, design tables for capstone project, run CRUD queries, configure production database credentials.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Create and manage a cloud-hosted PostgreSQL database.
                  </div>
                </div>

                {/* MODULE 9 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 9: Vercel — Website Hosting &amp; Deployment
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Week 22
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> Hosting, domains, DNS, HTTPS; Static hosting vs serverless; Connecting GitHub to Vercel; Deploying React apps, build commands, output dirs; Environment variables, production configuration; Preview deployments vs production; Auto-deploy on git push; Logs, build errors, debugging; Custom domain setup; Serverless function fundamentals.
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px' }}>
                    <strong>Practical Tasks:</strong> Deploy React project to Vercel, configure production environment variables, push updates to GitHub with auto-deployment verification, cross-device testing.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Publish a website and understand modern production development workflows.
                  </div>
                </div>

                {/* MODULE 10 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 10: Final Project &amp; Portfolio
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Week 23
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Capstone:</strong> Employee Management System / Job Portal — Responsive interface with HTML/CSS/React; Reusable components, forms, validation, search, filter; Database design with PostgreSQL on Neon; Full CRUD access layer; GitHub repository &amp; documentation; Live Vercel deployment, testing, debugging, and final presentation.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Complete and present a practical project demonstrating full stack capabilities.
                  </div>
                </div>

                {/* MODULE 11 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      MODULE 11: Revision, Testing &amp; Final Assessment
                    </h5>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9772d', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                      Week 24
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                    <strong>Topics:</strong> Comprehensive revision of HTML, CSS, JavaScript, React; SQL query practice, database design review; GitHub workflow revision; Prompt-writing &amp; AI debugging exercises; Deployment troubleshooting; Project code review; Final practical assessment; Resume and portfolio project discussion.
                  </p>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Outcome: Consolidate knowledge and prepare to explain and demonstrate the project confidently.
                  </div>
                </div>

              </div>

              {/* SUNDAY INTERVIEW SCHEDULE */}
              <div style={{ background: '#0f172a', color: '#fff', borderRadius: '14px', padding: '22px', marginBottom: '26px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#e9772d', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>
                  WEEKLY PLACEMENT COACHING
                </span>
                <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  Weekly Interview Preparation — Every Sunday (24 Weeks)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                  <div>• Sunday 1: HTML fundamentals &amp; common interview questions</div>
                  <div>• Sunday 2: HTML5, forms, semantics, accessibility</div>
                  <div>• Sunday 3: CSS selectors, box model, specificity</div>
                  <div>• Sunday 4: Flexbox, Grid &amp; responsive layouts</div>
                  <div>• Sunday 5: CSS practical tasks &amp; layout debugging</div>
                  <div>• Sunday 6: JS variables, data types &amp; operators</div>
                  <div>• Sunday 7: Conditions, loops &amp; coding challenges</div>
                  <div>• Sunday 8: Functions, scope, closures &amp; execution</div>
                  <div>• Sunday 9: Arrays, objects &amp; array methods</div>
                  <div>• Sunday 10: DOM, events &amp; form validation</div>
                  <div>• Sunday 11: Promises, async/await &amp; API questions</div>
                  <div>• Sunday 12: Git commands, branching, push/pull, conflicts</div>
                  <div>• Sunday 13: SQL fundamentals &amp; CRUD queries</div>
                  <div>• Sunday 14: Joins, subqueries, indexes &amp; DB design</div>
                  <div>• Sunday 15: ChatGPT prompting, debugging &amp; code review</div>
                  <div>• Sunday 16: React components, JSX &amp; props</div>
                  <div>• Sunday 17: State, events &amp; conditional rendering</div>
                  <div>• Sunday 18: Hooks &amp; component lifecycle concepts</div>
                  <div>• Sunday 19: Routing, forms &amp; API integration</div>
                  <div>• Sunday 20: React coding test &amp; debugging</div>
                  <div>• Sunday 21: PostgreSQL &amp; Neon database questions</div>
                  <div>• Sunday 22: Vercel deployment &amp; GitHub integration</div>
                  <div>• Sunday 23: Final project review &amp; project-based Q&amp;A</div>
                  <div>• Sunday 24: Mock interview, technical assessment &amp; feedback</div>
                </div>
              </div>

              {/* DAILY LEARNING STRATEGY */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px 20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  ⏱️ Daily Learning Strategy (Mon–Fri | 8:00 PM – 9:00 PM)
                </h4>
                <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#475569' }}>
                  <div>• <strong>8:00–8:10 PM:</strong> Revise the previous lesson</div>
                  <div>• <strong>8:10–8:35 PM:</strong> Learn a new concept with live code demonstration</div>
                  <div>• <strong>8:35–8:55 PM:</strong> Hands-on coding exercises and mentor assistance</div>
                  <div>• <strong>8:55–9:00 PM:</strong> Summarize learning and note doubts for review</div>
                  <div>• <strong>Saturday:</strong> Optional self-practice, assignment completion, and project work</div>
                  <div>• <strong>Sunday:</strong> Dedicated interview preparation, weekly revision, and assessment</div>
                </div>
              </div>

              {/* EXPECTED OUTCOME */}
              <div style={{ background: '#ecfdf5', borderRadius: '12px', padding: '16px 20px', border: '1px solid #a7f3d0' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
                  🏆 Expected Outcomes
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#047857', lineHeight: 1.6 }}>
                  By completing the syllabus and assignments, learners will possess a rock-solid foundation in modern HTML5/CSS, asynchronous JavaScript, component-based React development, relational MySQL &amp; PostgreSQL database architecture, Git/GitHub collaboration, AI-assisted development, a deployed portfolio web application, and interview readiness verified through 24 mock sessions.
                </p>
              </div>

            </div>

            {/* STICKY MODAL FOOTER */}
            <div
              style={{
                padding: '16px 28px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Soft Tech Solution • Verified Industrial Cohort Syllabus
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/syllabus-web-development-course.pdf"
                  download="SoftTechSolution-WebDevelopment-Syllabus.pdf"
                  style={{
                    background: '#e9772d',
                    color: '#fff',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  📥 Download PDF File
                </a>
                <button
                  type="button"
                  onClick={() => setShowSyllabusModal(false)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 0,
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
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
      )}
    </main>
  );
}
