'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrainingCoursePage() {
  const router = useRouter();

  // Next candidate ID from server
  const [nextCandId, setNextCandId] = useState('Loading...');
  const [loadingNextId, setLoadingNextId] = useState(true);

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

          {/* Assigned Candidate ID Notice */}
          <div 
            style={{ 
              marginTop: '28px', 
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
        </div>
      </section>

      {/* FORM + BENEFITS GRID */}
      <section className="wrap" style={{ marginTop: '-30px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '32px', alignItems: 'start' }}>
          
          {/* MAIN ENROLLMENT FORM CARD */}
          <div 
            style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)', 
              padding: 'clamp(24px, 4vw, 42px)',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    Government ID Verification <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  
                  {/* ID TYPE SELECTOR TABS */}
                  <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleChange('id_type', 'AADHAAR')}
                      style={{
                        border: 0,
                        background: formData.id_type === 'AADHAAR' ? '#ffffff' : 'transparent',
                        color: formData.id_type === 'AADHAAR' ? '#0f172a' : '#64748b',
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: formData.id_type === 'AADHAAR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      Aadhaar Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('id_type', 'PAN')}
                      style={{
                        border: 0,
                        background: formData.id_type === 'PAN' ? '#ffffff' : 'transparent',
                        color: formData.id_type === 'PAN' ? '#0f172a' : '#64748b',
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: formData.id_type === 'PAN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s',
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <small style={{ color: '#64748b', fontSize: '11px' }}>
                    {formData.id_type === 'AADHAAR' 
                      ? 'Format: 12 numeric digits with automated spacing check.' 
                      : 'Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).'}
                  </small>
                  <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
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
                      fontWeight: 600
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                    padding: '10px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.15)'
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
                    padding: '10px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: 700 
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
    </main>
  );
}
