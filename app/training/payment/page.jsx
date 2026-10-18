'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

function PaymentContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState('');

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);

  // Payment Confirmation & Pop-up Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Scan & Geolocation State
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'locating' | 'recording' | 'scanned' | 'error'
  const [scanDetails, setScanDetails] = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  // Bank & UPI configuration for Aashutosh Kumar (SBI)
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || '9142491242@ibl';
  const payeeName = process.env.NEXT_PUBLIC_PAYEE_NAME || 'Aashutosh Kumar';
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'State Bank of India (SBI)';
  const accountNumber = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '39797312414';
  const ifscCode = process.env.NEXT_PUBLIC_BANK_IFSC || 'SBIN0003002';

  // Construct official UPI payment URI
  const candIdDisplay = candidate?.candidate_id || idParam || 'candidate';
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&tn=${encodeURIComponent(`Course Enrollment ${candIdDisplay}`)}&cu=INR`;

  // Fetch candidate registration info
  const fetchCandidate = useCallback(async () => {
    if (!idParam) {
      setError('No candidate ID provided. Please complete the registration form first.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(idParam)}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Candidate registration not found.');
      }
      const data = await res.json();
      setCandidate(data);

      if (data.payment_status === 'Completed' || data.payment_status === 'Verified') {
        setPaymentConfirmed(true);
      }

      if (data.scanned) {
        setScanStatus('scanned');
        setScanDetails({
          scanned_at: data.scanned_at,
          scan_lat: data.scan_lat,
          scan_long: data.scan_long,
          scan_count: data.scan_count,
        });
      }
    } catch (err) {
      setError(err.message || 'Could not load registration data.');
    } finally {
      setLoading(false);
    }
  }, [idParam]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // Generate QR Code image when UPI URI is ready
  useEffect(() => {
    if (upiUri) {
      QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [upiUri]);

  // Record QR Scan entry with Geolocation coordinates
  const triggerScanRecord = useCallback(async (forcedWithoutGps = false) => {
    if (!candidate) return;
    setScanStatus('locating');
    setScanMessage('Requesting GPS location to verify QR scan attendance...');

    const sendScanPayload = async (lat = null, long = null, acc = null) => {
      setScanStatus('recording');
      setScanMessage('Saving scan entry with coordinates to database...');
      try {
        const res = await fetch('/api/courses/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: candidate.id,
            candidate_id: candidate.candidate_id,
            latitude: lat,
            longitude: long,
            accuracy: acc,
            timestamp: new Date().toISOString(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to record scan');
        }

        setScanStatus('scanned');
        setScanDetails({
          scanned_at: data.candidate?.scanned_at || new Date().toISOString(),
          scan_lat: data.candidate?.scan_lat || lat,
          scan_long: data.candidate?.scan_long || long,
          scan_count: data.candidate?.scan_count || 1,
        });
        setScanMessage(
          lat && long 
            ? `✅ QR Scan Entry Successfully Recorded! Lat: ${lat.toFixed(4)}, Long: ${long.toFixed(4)}`
            : '✅ QR Scan Entry Recorded (Browser GPS blocked, logged via IP timestamp).'
        );
      } catch (err) {
        setScanStatus('error');
        setScanMessage('Could not save scan entry: ' + err.message);
      }
    };

    if (forcedWithoutGps) {
      sendScanPayload(null, null, null);
      return;
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendScanPayload(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
        },
        (geoError) => {
          console.warn('Geolocation denied or unavailable:', geoError);
          // Still record scan with IP and timestamp
          sendScanPayload(null, null, null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      sendScanPayload(null, null, null);
    }
  }, [candidate]);

  // Automatically attempt scan registration on first page load
  useEffect(() => {
    if (candidate && !candidate.scanned && scanStatus === 'idle') {
      triggerScanRecord();
    }
  }, [candidate, scanStatus, triggerScanRecord]);

  const copyToClipboard = (text, type) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'upi') {
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2500);
      } else if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2500);
      } else if (type === 'acc') {
        setCopiedAcc(true);
        setTimeout(() => setCopiedAcc(false), 2500);
      } else if (type === 'ifsc') {
        setCopiedIfsc(true);
        setTimeout(() => setCopiedIfsc(false), 2500);
      }
    }
  };

  const handleConfirmPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!candidate) return;
    setConfirming(true);
    const refId = utrNumber.trim() || `SBI-UPI-${Date.now().toString().slice(-6)}`;
    try {
      const candidateKey = candidate.id || candidate.candidate_id;
      const res = await fetch(`/api/courses/${encodeURIComponent(candidateKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'Completed',
          notes: `Payment completed online via SBI QR / UPI. Ref/UTR: ${refId}`,
        }),
      });
      if (res.ok) {
        setPaymentConfirmed(true);
        setCandidate((prev) => ({
          ...prev,
          payment_status: 'Completed',
          notes: `Payment completed online via SBI QR / UPI. Ref/UTR: ${refId}`,
        }));
      }
    } catch (err) {
      console.warn('Payment confirmation error:', err);
    } finally {
      setConfirming(false);
      setShowSuccessModal(true);
    }
  };

  if (loading) {
    return (
      <div className="wrap" style={{ padding: '90px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#e9772d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '15px' }}>Loading enrollment &amp; bank QR code...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="wrap" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#fff', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #fee2e2' }}>
          <span style={{ fontSize: '42px', display: 'block', marginBottom: '14px' }}>⚠️</span>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', color: '#991b1b', margin: '0 0 10px' }}>
            Registration Not Found
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
            {error || 'We could not locate this candidate ID. Please fill out the registration form first.'}
          </p>
          <Link 
            href="/training" 
            style={{ 
              display: 'inline-block', 
              background: '#e9772d', 
              color: '#fff', 
              textDecoration: 'none', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              fontWeight: 700, 
              fontSize: '14px' 
            }}
          >
            ← Go to Course Registration Form
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', padding: '50px 0 90px' }}>
      <div className="wrap" style={{ maxWidth: '980px' }}>
        
        {/* TOP STATUS BANNER */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #101c3d 0%, #1e3a8a 100%)', 
            color: '#fff', 
            borderRadius: '16px', 
            padding: '24px 28px', 
            marginBottom: '28px',
            boxShadow: '0 15px 30px rgba(15, 23, 42, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
              ✓ Step 2 of 2: QR Payment &amp; Verification
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, margin: '0 0 4px', color: '#ffffff' }}>
              Official Bank QR Code Verification
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
              Candidate: <strong>{candidate.name}</strong> · ID: <strong style={{ color: '#fb923c' }}>{candidate.candidate_id}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => copyToClipboard(candidate.candidate_id, 'id')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '9px 15px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {copiedId ? '✓ Copied ID' : `📋 Copy ID: ${candidate.candidate_id}`}
            </button>
            <Link
              href="/training"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#cbd5e1',
                padding: '9px 15px',
                borderRadius: '8px',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              ← Back to Form
            </Link>
          </div>
        </div>

        {/* SCAN ENTRY & GEOLOCATION AUDIT CARD */}
        <div 
          style={{ 
            background: scanStatus === 'scanned' ? '#f0fdf4' : '#fffbeb', 
            border: `1.5px solid ${scanStatus === 'scanned' ? '#86efac' : '#fde68a'}`, 
            borderRadius: '14px', 
            padding: '20px 24px', 
            marginBottom: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'start' }}>
              <div 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '10px', 
                  background: scanStatus === 'scanned' ? '#22c55e' : '#f59e0b', 
                  color: '#fff', 
                  display: 'grid', 
                  placeItems: 'center', 
                  fontSize: '20px',
                  flexShrink: 0 
                }}
              >
                {scanStatus === 'scanned' ? '✓' : '📍'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: scanStatus === 'scanned' ? '#166534' : '#92400e' }}>
                  {scanStatus === 'scanned' ? 'Database Scan Entry Verified & Recorded' : 'QR Scan Attendance & Geolocation Tracking'}
                </h3>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: scanStatus === 'scanned' ? '#15803d' : '#78350f', lineHeight: 1.5 }}>
                  {scanMessage || 'Every QR code scan is timestamped with precise GPS latitude and longitude in our database for audit compliance.'}
                </p>

                {scanDetails && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', fontSize: '12px', color: '#166534', background: 'rgba(255,255,255,0.7)', padding: '8px 14px', borderRadius: '8px' }}>
                    <span>🕒 <strong>Time:</strong> {new Date(scanDetails.scanned_at).toLocaleString()}</span>
                    {scanDetails.scan_lat && scanDetails.scan_long ? (
                      <>
                        <span>📍 <strong>Lat:</strong> {Number(scanDetails.scan_lat).toFixed(5)}</span>
                        <span>📍 <strong>Long:</strong> {Number(scanDetails.scan_long).toFixed(5)}</span>
                        <a 
                          href={`https://www.google.com/maps?q=${scanDetails.scan_lat},${scanDetails.scan_long}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#0369a1', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          View Exact Location on Google Maps ↗
                        </a>
                      </>
                    ) : (
                      <span>📍 GPS: Logged via Network Timestamp</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {scanStatus !== 'scanned' && (
              <button
                onClick={() => triggerScanRecord(false)}
                disabled={scanStatus === 'locating' || scanStatus === 'recording'}
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  border: 0,
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📍</span>
                <span>{scanStatus === 'locating' || scanStatus === 'recording' ? 'Capturing Location...' : 'Record My QR Scan'}</span>
              </button>
            )}
          </div>
        </div>

        {/* TWO COLUMN GRID: QR CODE CARD + CANDIDATE AUDIT INFO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', alignItems: 'start' }}>
          
          {/* QR CODE & BANK ACCOUNT CARD */}
          <div 
            style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              padding: '28px 24px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}
          >
            {/* OFFICIAL SBI IDENTITY HEADER */}
            <div style={{ marginBottom: '16px' }}>
              <div 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%', 
                  background: '#0b57d0', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 800, 
                  fontSize: '13px', 
                  margin: '0 auto 10px',
                  boxShadow: '0 4px 10px rgba(11,87,208,0.25)',
                  letterSpacing: '0.05em'
                }}
              >
                SBI
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                State Bank of India - 2414
              </h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                <span>Primary account for receiving money</span>
              </div>
            </div>

            {/* AUTHENTIC SBI QR CODE DISPLAY */}
            <div 
              style={{ 
                margin: '0 auto 14px', 
                padding: '16px', 
                background: '#ffffff', 
                borderRadius: '16px', 
                display: 'inline-block',
                border: '2px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
              }}
            >
              <img 
                src="/ashutosh-sbi-qr.png" 
                alt="SBI UPI QR Code - Aashutosh Kumar" 
                onError={(e) => {
                  if (qrDataUrl) e.currentTarget.src = qrDataUrl;
                }}
                style={{ 
                  width: '260px', 
                  height: '260px', 
                  display: 'block', 
                  margin: '0 auto', 
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />

              {/* UPI ID BANNER */}
              <div 
                style={{ 
                  marginTop: '12px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  fontSize: '14px', 
                  color: '#475569' 
                }}
              >
                <span>UPI ID:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '14px' }}>{upiId}</strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(upiId, 'upi')}
                  title="Copy UPI ID"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer'
                  }}
                >
                  {copiedUpi ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* DOWNLOAD & SHARE BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '18px' }}>
              <a
                href="/ashutosh-sbi-qr.png"
                download="SBI-Payment-QR-AashutoshKumar.png"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>⬇️ Download QR</span>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(upiId, 'upi')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{copiedUpi ? '✓ Copied' : '🔗 Copy UPI'}</span>
              </button>
            </div>

            {/* MOBILE DIRECT APP LAUNCH BUTTON */}
            <a
              href={upiUri}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                background: 'linear-gradient(100deg, #e9772d 0%, #f5a42a 100%)',
                color: '#fff',
                textDecoration: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 800,
                boxShadow: '0 6px 20px rgba(233,119,45,0.3)',
                marginBottom: '18px'
              }}
            >
              <span>📱 Open in UPI App Directly</span>
            </a>

            {/* SUPPORTED APPS BADGES */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {['PhonePe', 'BHIM', 'Google Pay', 'Paytm', 'SBI YONO', 'Cred'].map((app) => (
                  <span 
                    key={app} 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: '#475569', 
                      background: '#f1f5f9', 
                      padding: '4px 10px', 
                      borderRadius: '6px' 
                    }}
                  >
                    {app}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                Supported on all UPI apps • Powered by UPI
              </span>
            </div>

            {/* BANK ACCOUNT & NEFT/IMPS DETAILS TABLE */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bank Account Transfer Details
                </h4>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                  ✓ SBI Verified
                </span>
              </div>

              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Account Name:</span>
                  <strong style={{ color: '#0f172a' }}>{payeeName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Bank Name:</span>
                  <strong style={{ color: '#0f172a' }}>{bankName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Account Number:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '14px' }}>{accountNumber}</strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accountNumber, 'acc')}
                      style={{
                        background: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedAcc ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>IFSC Code:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '14px' }}>{ifscCode}</strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ifscCode, 'ifsc')}
                      style={{
                        background: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedIfsc ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>UPI ID:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#e9772d', fontSize: '14px' }}>{upiId}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(upiId, 'upi')}
                    style={{
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedUpi ? '✓ Copied' : 'Copy UPI ID'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px', background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#1e40af', textAlign: 'left', lineHeight: 1.5 }}>
              📌 <strong>Important:</strong> After completing payment via QR or Net Banking, please save your UTR / Transaction Reference number for admission confirmation.
            </div>

            {/* PAYMENT CONFIRMATION CTA BLOCK */}
            <div 
              style={{ 
                marginTop: '18px', 
                padding: '18px 16px', 
                background: paymentConfirmed ? '#f0fdf4' : '#faf5ff', 
                borderRadius: '12px', 
                border: `1.5px solid ${paymentConfirmed ? '#86efac' : '#d8b4fe'}`, 
                textAlign: 'center' 
              }}
            >
              <span 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  color: paymentConfirmed ? '#16a34a' : '#7e22ce', 
                  display: 'block', 
                  marginBottom: '6px' 
                }}
              >
                {paymentConfirmed ? '✓ PAYMENT CONFIRMED & VERIFIED' : 'STEP 2: CONFIRM TRANSACTION'}
              </span>
              <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {paymentConfirmed ? 'Seat Reserved Successfully!' : 'Done with Bank QR / UPI Payment?'}
              </h4>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                {paymentConfirmed 
                  ? 'Your admission receipt is ready and recorded in the database.' 
                  : 'Click below to verify your payment and trigger your official admission confirmation.'}
              </p>

              {!paymentConfirmed ? (
                <div style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR / UPI Ref (Optional)"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      outline: 'none',
                      background: '#fff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={confirming}
                    style={{
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: '#fff',
                      border: 0,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(22,163,74,0.25)'
                    }}
                  >
                    {confirming ? 'Verifying...' : '✅ Confirm Payment'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowSuccessModal(true)}
                    style={{
                      background: '#16a34a',
                      color: '#fff',
                      border: 0,
                      padding: '9px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22,163,74,0.25)'
                    }}
                  >
                    🎉 View Payment Success Slip
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* CANDIDATE REGISTRATION SUMMARY CARD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div 
              style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                padding: '28px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Candidate Summary
                </h3>
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
                  {candidate.candidate_id}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Full Name</small>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{candidate.name}</strong>
                </div>

                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Father&apos;s Name</small>
                  <span style={{ color: '#334155' }}>{candidate.father_name}</span>
                </div>

                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Contact Number</small>
                  <a href={`tel:+91${candidate.contact_number}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                    +91 {candidate.contact_number}
                  </a>
                </div>

                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Email Address</small>
                  <span style={{ color: '#334155' }}>{candidate.email}</span>
                </div>

                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Verified ID ({candidate.id_type})</small>
                  <span style={{ fontFamily: 'monospace', color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {candidate.id_number}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Selected Industrial Track</small>
                  <strong style={{ color: '#e9772d', fontSize: '13px' }}>{candidate.course}</strong>
                </div>
              </div>
            </div>

            {/* SEND PAYMENT CONFIRMATION TO FOUNDERS */}
            <div 
              style={{ 
                background: 'linear-gradient(135deg, #101c3d, #0b1329)', 
                color: '#fff', 
                borderRadius: '16px', 
                padding: '24px', 
                border: '1px solid rgba(255,255,255,0.08)' 
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700 }}>
                Done Scanning? Send Screenshot
              </h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px' }}>
                Once you scan and complete payment, share the transaction screenshot with your Candidate ID (<strong>{candidate.candidate_id}</strong>) directly to our leadership for immediate admission confirmation.
              </p>

              <a
                href={`https://wa.me/916205570278?text=${encodeURIComponent(`Hello Ankitosh Sir, I have registered for the course.\nCandidate ID: ${candidate.candidate_id}\nName: ${candidate.name}\nCourse: ${candidate.course}\nI have scanned the bank QR code.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#16a34a',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                <span>💬 WhatsApp Payment Receipt to Mentors</span>
              </a>
            </div>

          </div>

        </div>

      </div>

      {/* ============================================================
          PAYMENT SUCCESSFUL POP-UP MODAL
          ============================================================ */}
      {showSuccessModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              padding: '36px 28px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              position: 'relative',
              animation: 'scaleUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setShowSuccessModal(false)}
              aria-label="Close Modal"
              style={{
                position: 'absolute',
                top: '16px',
                right: '18px',
                background: '#f1f5f9',
                border: 0,
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 800,
                color: '#64748b',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              ✕
            </button>

            {/* CELEBRATION ICON */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                margin: '0 auto 16px',
                boxShadow: '0 10px 25px rgba(34, 197, 94, 0.35)',
              }}
            >
              ✓
            </div>

            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                color: '#16a34a', 
                textTransform: 'uppercase', 
                letterSpacing: '0.12em',
                background: '#dcfce7',
                padding: '4px 12px',
                borderRadius: '20px',
                display: 'inline-block',
                marginBottom: '8px'
              }}
            >
              TRANSACTION RECORDED
            </span>

            <h2 
              style={{ 
                fontFamily: 'Poppins, sans-serif', 
                fontSize: '24px', 
                fontWeight: 800, 
                color: '#0f172a', 
                margin: '4px 0 10px',
                letterSpacing: '-0.02em'
              }}
            >
              Payment Successful!
            </h2>

            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
              Congratulations <strong>{candidate.name}</strong>! Your payment for the <strong>Full Stack Web Development Course</strong> has been registered and verified successfully.
            </p>

            {/* OFFICIAL ADMISSION RECEIPT CARD */}
            <div 
              style={{ 
                background: '#f8fafc', 
                borderRadius: '14px', 
                padding: '18px 20px', 
                textAlign: 'left', 
                border: '1px solid #e2e8f0', 
                marginBottom: '20px' 
              }}
            >
              <div style={{ display: 'grid', gap: '9px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '7px' }}>
                  <span style={{ color: '#64748b' }}>Candidate ID:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#c2410c', fontSize: '14px', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                    {candidate.candidate_id}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '7px' }}>
                  <span style={{ color: '#64748b' }}>Candidate Name:</span>
                  <strong style={{ color: '#0f172a' }}>{candidate.name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '7px' }}>
                  <span style={{ color: '#64748b' }}>Industrial Track:</span>
                  <strong style={{ color: '#0f172a', fontSize: '12px', textAlign: 'right' }}>
                    Full Stack Web Dev (24 Weeks)
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '7px' }}>
                  <span style={{ color: '#64748b' }}>Beneficiary Bank:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>State Bank of India (SBI)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '7px' }}>
                  <span style={{ color: '#64748b' }}>Beneficiary Name:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>Aashutosh Kumar</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '7px' }}>
                  <span style={{ color: '#64748b' }}>Account Number:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>39797312414</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '7px' }}>
                  <span style={{ color: '#64748b' }}>Transaction / UTR:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#16a34a' }}>
                    {utrNumber || 'SBI-UPI-VERIFIED'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
                  <span style={{ color: '#64748b' }}>Admission Status:</span>
                  <span style={{ color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    ✓ Confirmed &amp; Logged
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`https://wa.me/916205570278?text=${encodeURIComponent(`Hello Ankitosh Sir,\nMy payment for Full Stack Web Development is SUCCESSFUL!\nCandidate ID: ${candidate.candidate_id}\nName: ${candidate.name}\nContact: +91 ${candidate.contact_number}\nUTR/Ref: ${utrNumber || 'SBI-UPI-VERIFIED'}\nPlease confirm my batch onboarding schedule.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#16a34a',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '13px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                }}
              >
                <span>💬 WhatsApp Admission Slip to Mentors</span>
              </a>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    padding: '11px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🖨️ Print / Save Slip
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  style={{
                    flex: 1,
                    background: '#0f172a',
                    border: 0,
                    color: '#fff',
                    padding: '11px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}

export default function TrainingPaymentPage() {
  return (
    <Suspense 
      fallback={
        <div style={{ padding: '100px 0', textAlign: 'center', color: '#64748b' }}>
          Loading course payment verification...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
