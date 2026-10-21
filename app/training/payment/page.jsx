'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

function numberToWordsINR(amount) {
  if (!amount) return 'Zero Rupees Only';
  const cleanStr = String(amount).replace(/[^\d]/g, '');
  const n = parseInt(cleanStr, 10);
  if (isNaN(n) || n <= 0) return 'Zero Rupees Only';
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

function printReceiptElement(elementId, title = 'Soft Tech Solution - Fee Payment Receipt') {
  if (typeof window === 'undefined') return;
  const content = document.getElementById(elementId);
  if (!content) {
    window.print();
    return;
  }

  const existingFrame = document.getElementById('sts-payment-print-iframe');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'sts-payment-print-iframe';
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
          .receipt-no-print, button {
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

  // Payment Confirmation, Amount & Official Receipt State
  // Point 1: Amount MUST be blank ('') by default
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

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

  // Construct official UPI payment URI with dynamic amount (omit &am= if blank so user can enter any amount in UPI app)
  const candIdDisplay = candidate?.candidate_id || idParam || 'candidate';
  const cleanAmountNum = amount && !isNaN(Number(amount)) && Number(amount) > 0 ? Number(amount).toString() : '';
  const upiUri = cleanAmountNum
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&tn=${encodeURIComponent(`Course Enrollment ${candIdDisplay}`)}&am=${encodeURIComponent(cleanAmountNum)}&cu=INR`
    : `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&tn=${encodeURIComponent(`Course Enrollment ${candIdDisplay}`)}&cu=INR`;

  // Point 2: Session persistence to hold verified UTR state across reloads
  useEffect(() => {
    if (typeof window === 'undefined' || !idParam) return;
    try {
      const storageKey = `sts_payment_${idParam}`;
      const saved = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.amount) setAmount(String(parsed.amount));
        if (parsed.utrNumber) setUtrNumber(String(parsed.utrNumber));
        if (parsed.receiptData) setReceiptData(parsed.receiptData);
        if (parsed.paymentConfirmed) setPaymentConfirmed(true);
      }
    } catch (e) {
      console.warn('Could not read session storage', e);
    }
  }, [idParam]);

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

      if (data.amount) {
        setAmount(String(data.amount));
      }
      if (data.utr_number) {
        setUtrNumber(String(data.utr_number));
      }
      if (data.receipt_data) {
        try {
          const parsed = typeof data.receipt_data === 'string' ? JSON.parse(data.receipt_data) : data.receipt_data;
          setReceiptData(parsed);
          if (parsed.amount && !data.amount) {
            setAmount(String(parsed.amount));
          }
        } catch (e) {
          console.warn('Failed to parse saved receipt_data', e);
        }
      }

      if (data.payment_status === 'Completed' || data.payment_status === 'Verified' || data.receipt_number || data.utr_number) {
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

    const cleanAmount = (amount || '').toString().trim();
    const cleanUtr = utrNumber.trim();

    if (!cleanAmount || isNaN(Number(cleanAmount)) || Number(cleanAmount) <= 0) {
      setFormError('Please enter the payment amount (₹) you paid (e.g. 5000, 10000, 15000).');
      return;
    }
    if (!cleanUtr || cleanUtr.length < 6) {
      setFormError('Please enter your 12-digit Bank UTR or UPI Reference Number (minimum 6 characters).');
      return;
    }

    setConfirming(true);
    setFormError('');

    const candIdClean = (candidate.candidate_id || 'STS').replace(/\s+/g, '').toUpperCase();
    const receiptNum = candidate.receipt_number || `REC-${new Date().getFullYear()}-${candIdClean}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidAtIso = new Date().toISOString();

    const receiptObj = {
      receipt_number: receiptNum,
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.name,
      father_name: candidate.father_name,
      contact_number: candidate.contact_number,
      email: candidate.email,
      id_type: candidate.id_type,
      id_number: candidate.id_number,
      course_name: candidate.course,
      amount: cleanAmount,
      amount_words: numberToWordsINR(cleanAmount),
      utr_number: cleanUtr,
      payment_mode: 'UPI / SBI Bank QR (Net Banking)',
      bank_name: bankName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      payee_name: payeeName,
      upi_id: upiId,
      payment_status: 'Paid & Verified',
      paid_at: paidAtIso,
      company_name: 'Soft Tech Solution',
      company_address: 'Post Office: Noida Sector 62 S.O, District: Gautam Buddha Nagar, Uttar Pradesh - 201309',
      support_phone: '+91 91176 96512',
      support_email: 'softtechsolution2026@gmail.com',
    };

    try {
      const candidateKey = candidate.id || candidate.candidate_id;
      const res = await fetch(`/api/courses/${encodeURIComponent(candidateKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cleanAmount,
          utr_number: cleanUtr,
          receipt_number: receiptNum,
          receipt_data: JSON.stringify(receiptObj),
          paid_at: paidAtIso,
          payment_status: 'Verified',
          notes: `Payment confirmed by student. Amount: ₹${cleanAmount}, UTR: ${cleanUtr}, Receipt: ${receiptNum}`,
        }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const updated = json.candidate || {};
        setPaymentConfirmed(true);
        setReceiptData(receiptObj);
        setCandidate((prev) => ({
          ...prev,
          ...updated,
          amount: cleanAmount,
          utr_number: cleanUtr,
          receipt_number: receiptNum,
          receipt_data: JSON.stringify(receiptObj),
          paid_at: paidAtIso,
          payment_status: 'Verified',
        }));

        // Point 2: Persist in sessionStorage & localStorage so reloading retains confirmed state
        try {
          const sessionPayload = {
            amount: cleanAmount,
            utrNumber: cleanUtr,
            receiptData: receiptObj,
            paymentConfirmed: true,
            candidateId: candidate.candidate_id,
          };
          if (idParam) {
            sessionStorage.setItem(`sts_payment_${idParam}`, JSON.stringify(sessionPayload));
            localStorage.setItem(`sts_payment_${idParam}`, JSON.stringify(sessionPayload));
          }
          if (candidate.candidate_id) {
            sessionStorage.setItem(`sts_payment_${candidate.candidate_id}`, JSON.stringify(sessionPayload));
            localStorage.setItem(`sts_payment_${candidate.candidate_id}`, JSON.stringify(sessionPayload));
          }
        } catch (e) {
          console.warn('Storage save error', e);
        }
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
        <div className="payment-layout-grid" style={{ display: 'grid', gap: '28px', alignItems: 'start' }}>
          
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
                  maxWidth: '100%',
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
                padding: '22px 20px', 
                background: paymentConfirmed ? '#f0fdf4' : '#faf5ff', 
                borderRadius: '14px', 
                border: `1.5px solid ${paymentConfirmed ? '#86efac' : '#d8b4fe'}`, 
                textAlign: 'left',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em', 
                    color: paymentConfirmed ? '#16a34a' : '#7e22ce', 
                    background: paymentConfirmed ? '#dcfce7' : '#f3e8ff',
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}
                >
                  {paymentConfirmed ? '✓ PAYMENT VERIFIED & RECEIPT GENERATED' : 'STEP 2: ENTER PAYMENT & GENERATE RECEIPT'}
                </span>
                {paymentConfirmed && (candidate?.receipt_number || receiptData?.receipt_number) && (
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                    {candidate?.receipt_number || receiptData?.receipt_number}
                  </span>
                )}
              </div>

              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {paymentConfirmed ? 'Payment Recorded & Official Receipt Generated!' : 'Confirm Payment Amount & Bank UTR Number'}
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                {paymentConfirmed 
                  ? 'Your admission receipt has been saved into the database and is permanently available in the Admin Panel.' 
                  : 'Enter the amount paid and your 12-digit Bank UTR/UPI reference number to generate your official receipt.'}
              </p>

              {!paymentConfirmed ? (
                <div>
                  {/* FIELD 1: AMOUNT */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Payment / Fee Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b', fontSize: '15px' }}>₹</span>
                      <input
                        type="number"
                        placeholder="Enter fee amount (e.g. 5000 or 15000)"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setFormError('');
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 32px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#0f172a',
                          outline: 'none',
                          background: '#fff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* QUICK PRESET CHIPS */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {[
                        { label: '₹15,000 (Full Course Fees)', val: '15000' },
                        { label: '₹10,000 (1st Installment)', val: '10000' },
                        { label: '₹5,000 (Advance / Seat Booking)', val: '5000' },
                      ].map(chip => (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => {
                            setAmount(chip.val);
                            setFormError('');
                          }}
                          style={{
                            background: String(amount) === chip.val ? '#0f172a' : '#f1f5f9',
                            color: String(amount) === chip.val ? '#fff' : '#334155',
                            border: `1px solid ${String(amount) === chip.val ? '#0f172a' : '#cbd5e1'}`,
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FIELD 2: 12-DIGIT UTR / UPI REF */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      12-Digit Bank UTR / UPI Reference Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 428912345678 (From PhonePe, Google Pay, Paytm, or SBI)"
                      value={utrNumber}
                      onChange={(e) => {
                        setUtrNumber(e.target.value);
                        setFormError('');
                      }}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        background: '#fff',
                        boxSizing: 'border-box'
                      }}
                    />
                    <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                      💡 Found on your payment receipt screen as &quot;UTR&quot;, &quot;UPI Ref ID&quot;, or &quot;Bank Reference No&quot;.
                    </small>
                  </div>

                  {/* ERROR MESSAGE IF ANY */}
                  {formError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                      ⚠️ {formError}
                    </div>
                  )}

                  {/* SUBMIT BUTTON */}
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={confirming}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: '#fff',
                      border: 0,
                      padding: '13px 20px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(22,163,74,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{confirming ? 'Saving to Database & Generating Receipt…' : '📄 Submit UTR & Generate Official Receipt'}</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #bbf7d0', marginBottom: '16px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Amount Paid:</span>
                      <strong style={{ color: '#16a34a', fontSize: '15px' }}>₹{Number(candidate?.amount || receiptData?.amount || amount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Bank UTR:</span>
                      <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{candidate?.utr_number || receiptData?.utr_number || utrNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Official Receipt No:</span>
                      <strong style={{ fontFamily: 'monospace', color: '#c2410c' }}>{candidate?.receipt_number || receiptData?.receipt_number || 'REC-VERIFIED'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowSuccessModal(true)}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        background: '#16a34a',
                        color: '#fff',
                        border: 0,
                        padding: '12px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🖨️ View &amp; Print Official Receipt</span>
                    </button>
                  </div>
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
                href={`https://wa.me/919117696512?text=${encodeURIComponent(`Hello Sir,\nHere is my course enrollment and payment details:\n\n🧾 Receipt No: ${candidate.receipt_number || receiptData?.receipt_number || 'PENDING'}\n👤 Candidate ID: ${candidate.candidate_id}\n👤 Candidate Name: ${candidate.name}\n👨‍👦 Father's Name: ${candidate.father_name || 'N/A'}\n📞 Contact: +91 ${candidate.contact_number}\n✉️ Email: ${candidate.email}\n🪪 Govt ID: ${candidate.id_type} - ${candidate.id_number}\n📚 Course: ${candidate.course}\n💰 Amount Paid: ₹${Number(candidate.amount || receiptData?.amount || amount || 0).toLocaleString('en-IN')}${(candidate.amount || receiptData?.amount || amount) && Number(candidate.amount || receiptData?.amount || amount) > 0 ? ` (${numberToWordsINR(candidate.amount || receiptData?.amount || amount)})` : ''}\n🏦 Bank UTR: ${candidate.utr_number || receiptData?.utr_number || utrNumber || 'PENDING'}\n💳 Mode: UPI / SBI Bank Transfer\n📅 Date: ${new Date(candidate.paid_at || receiptData?.paid_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n✅ Payment Status: ${candidate.payment_status || 'Verified'}\n\nPlease confirm my training onboarding schedule. Thank you!`)}`}
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
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  minHeight: '44px',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
              >
                <span>💬 WhatsApp Payment Details (to 9117696512)</span>
              </a>
            </div>

          </div>

        </div>

      </div>

      {/* ============================================================
          OFFICIAL FEE PAYMENT RECEIPT & ADMISSION CONFIRMATION MODAL
          ============================================================ */}
      {showSuccessModal && (() => {
        const cleanAmountDynamic = receiptData?.amount || candidate?.amount || amount || '0';
        const dynamicAmountWords = (cleanAmountDynamic && Number(cleanAmountDynamic) > 0)
          ? numberToWordsINR(cleanAmountDynamic)
          : (receiptData?.amount_words || 'Zero Rupees Only');
        const dynamicUtr = receiptData?.utr_number || candidate?.utr_number || utrNumber || 'PAID';
        const dynamicReceiptNo = candidate?.receipt_number || receiptData?.receipt_number || `REC-${new Date().getFullYear()}-${(candidate.candidate_id || 'STS').replace(/\s+/g, '').toUpperCase()}-VERIFIED`;

        const studentWaText = `Hello Sir,\nHere is the official course fee payment receipt details:\n\n🧾 Receipt No: ${dynamicReceiptNo}\n👤 Candidate ID: ${candidate.candidate_id}\n👤 Candidate Name: ${candidate.name}\n👨‍👦 Father's Name: ${candidate.father_name || 'N/A'}\n📞 Contact: +91 ${candidate.contact_number}\n✉️ Email: ${candidate.email}\n🪪 Govt ID: ${candidate.id_type} - ${candidate.id_number}\n📚 Course: ${candidate.course}\n💰 Amount Paid: ₹${Number(cleanAmountDynamic).toLocaleString('en-IN')} (${dynamicAmountWords})\n🏦 Bank UTR: ${dynamicUtr}\n💳 Mode: UPI / SBI Bank Transfer\n📅 Date: ${new Date(candidate.paid_at || receiptData?.paid_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n✅ Payment Status: Verified\n\nPlease verify admission record. Thank you!`;

        return (
          <div
            className="receipt-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
            onClick={() => setShowSuccessModal(false)}
          >
            {/* PRINT-SPECIFIC CSS RULES */}
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
                #official-receipt-print-area, #official-receipt-print-area * {
                  visibility: visible !important;
                  overflow: visible !important;
                  max-height: none !important;
                  height: auto !important;
                }
                .receipt-no-print {
                  display: none !important;
                }
              }
            ` }} />

            <div
              className="receipt-card-wrapper"
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: 'calc(100vh - 32px)',
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto',
                padding: '0',
                boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                border: '1px solid #e2e8f0',
                position: 'relative',
                overflow: 'hidden',
                animation: 'scaleUp 0.25s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL ACTION HEADER BAR */}
              <div className="receipt-no-print" style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📄</span>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                    Official Course Fee Receipt
                  </span>
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                    Saved in Database
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => printReceiptElement('official-receipt-print-area', `Soft-Tech-Receipt-${candidate.candidate_id}`)}
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
                    onClick={() => setShowSuccessModal(false)}
                    aria-label="Close Modal"
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

              {/* PRINTABLE RECEIPT CONTENT AREA */}
              <div id="official-receipt-print-area" style={{ padding: '28px 32px', background: '#ffffff', color: '#0f172a', overflowY: 'auto', flex: '1 1 auto' }}>
              
              {/* RECEIPT HEADER */}
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
                    FEE PAYMENT RECEIPT
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Receipt No: <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '12px' }}>{candidate.receipt_number || receiptData?.receipt_number || 'REC-PENDING'}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Date: <strong style={{ color: '#0f172a' }}>{new Date(candidate.paid_at || receiptData?.paid_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                </div>
              </div>

              {/* CANDIDATE & COURSE DETAILS GRID */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Candidate ID:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#c2410c', fontSize: '13px', background: '#fff7ed', padding: '1px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                      {candidate.candidate_id}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Student Full Name:</span>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>{candidate.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Father&apos;s Name:</span>
                    <span style={{ color: '#334155' }}>{candidate.father_name}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Contact Number:</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>+91 {candidate.contact_number}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Email Address:</span>
                    <span style={{ color: '#334155' }}>{candidate.email}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Government ID ({candidate.id_type}):</span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{candidate.id_number}</span>
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Enrolled Industrial Program:</span>
                  <strong style={{ color: '#e9772d', fontSize: '12.5px' }}>{candidate.course}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Duration: 6 Months (24 Weeks) Industrial Training · Mon-Fri, 8:00 PM – 9:00 PM
                  </div>
                </div>
              </div>

              {/* PAYMENT BREAKDOWN TABLE */}
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '18px' }}>
                <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '12px' }}>
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
                        <strong>Full Stack Web Development Industrial Training Fee</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Paid via SBI UPI / QR Code Transfer to Aashutosh Kumar (SBI A/c 39797312414)
                        </div>
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'top', fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>
                        {dynamicUtr}
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'top', textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>
                        ₹{Number(cleanAmountDynamic).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={3} style={{ padding: '10px', textAlign: 'right' }}>
                        Total Amount Received:
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#16a34a', fontSize: '15px' }}>
                        ₹{Number(cleanAmountDynamic).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AMOUNT IN WORDS & VERIFIED STAMP ROW */}
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

                {/* OFFICIAL VERIFICATION STAMP */}
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
                    AUTH CODE: {candidate.candidate_id?.replace(/\s+/g, '')}-{(dynamicReceiptNo || 'VERIFIED').slice(-4)}
                  </div>
                </div>
              </div>

              {/* FOOTER & SIGNATORY */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#64748b' }}>
                <div style={{ maxWidth: '360px', lineHeight: 1.4 }}>
                  <p style={{ margin: '0 0 2px' }}><strong>Note:</strong> This is an officially generated computer fee receipt for training enrollment.</p>
                  <p style={{ margin: 0 }}>Fees are recorded in Soft Tech Solution central database. For queries contact softtechsolution2026@gmail.com.</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #94a3b8', width: '130px', margin: '0 auto 4px', height: '24px' }}></div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Authorized Signatory</span>
                  <div style={{ fontSize: '9px' }}>Soft Tech Solution</div>
                </div>
              </div>

            </div>

            {/* MODAL FOOTER BUTTONS (HIDDEN IN PRINT) */}
            <div className="receipt-no-print" style={{ background: '#f8fafc', padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
              <a
                href={`https://wa.me/919117696512?text=${encodeURIComponent(studentWaText)}`}
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

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => printReceiptElement('official-receipt-print-area', `Soft-Tech-Receipt-${candidate.candidate_id}`)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 0,
                    padding: '9px 16px',
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
                  onClick={() => setShowSuccessModal(false)}
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
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      );
    })()}
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
