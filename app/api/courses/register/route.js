import { NextResponse } from 'next/server';
import { createCourseRegistration } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safe(v, max = 500) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = safe(body.name, 120);
    const rawContact = safe(body.contact_number, 30);
    const fatherName = safe(body.father_name, 120);
    let idType = safe(body.id_type, 20).toUpperCase();
    const rawIdNumber = safe(body.id_number, 50);
    const email = safe(body.email, 180).toLowerCase();
    const course = safe(body.course, 160) || 'Full stack web development course';

    // 1. Candidate Name check
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Please enter a valid candidate full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    // 2. Contact Number check (10 digits)
    const cleanPhone = rawContact.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Contact number must be exactly 10 digits (e.g. 9876543210).' },
        { status: 400 }
      );
    }

    // 3. Father's Name check
    if (!fatherName || fatherName.length < 2) {
      return NextResponse.json(
        { error: "Please enter father's name (at least 2 characters)." },
        { status: 400 }
      );
    }

    // 4. Aadhar / PAN validation
    const cleanIdNumber = rawIdNumber.replace(/[\s-]/g, '').toUpperCase();

    // Auto-detect if idType not explicitly specified
    if (!idType || (idType !== 'AADHAAR' && idType !== 'PAN')) {
      if (/^\d{12}$/.test(cleanIdNumber)) {
        idType = 'AADHAAR';
      } else if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanIdNumber)) {
        idType = 'PAN';
      } else {
        return NextResponse.json(
          { error: 'Please select an ID type (Aadhaar or PAN) and enter a valid number.' },
          { status: 400 }
        );
      }
    }

    if (idType === 'AADHAAR') {
      const isDigitsOnly = /^\d{12}$/.test(cleanIdNumber);
      if (!isDigitsOnly) {
        return NextResponse.json(
          { error: 'Aadhaar number must be exactly 12 numeric digits (e.g. 1234 5678 9012).' },
          { status: 400 }
        );
      }
      if (/^(\d)\1{11}$/.test(cleanIdNumber)) {
        return NextResponse.json(
          { error: 'Invalid Aadhaar number (cannot be repeating digits).' },
          { status: 400 }
        );
      }
    } else if (idType === 'PAN') {
      const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanIdNumber);
      if (!isPanValid) {
        return NextResponse.json(
          { error: 'PAN card must follow standard 10-character format (5 letters, 4 digits, 1 letter, e.g. ABCDE1234F).' },
          { status: 400 }
        );
      }
    }

    // 5. Candidate Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid candidate email address (e.g. candidate@gmail.com).' },
        { status: 400 }
      );
    }

    // Gmail typo safety check
    const domainPart = email.split('@')[1] || '';
    if (domainPart.includes('gmail') && domainPart !== 'gmail.com') {
      return NextResponse.json(
        { error: 'Did you mean @gmail.com? Please verify the email address.' },
        { status: 400 }
      );
    }

    const saved = await createCourseRegistration({
      name,
      contact_number: cleanPhone,
      father_name: fatherName,
      id_type: idType,
      id_number: cleanIdNumber,
      email,
      course,
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Course registration submitted successfully!',
        candidate: saved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Course registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process course registration.' },
      { status: 500 }
    );
  }
}
