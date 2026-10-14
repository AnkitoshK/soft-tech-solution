'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastContext';

export default function ContactForm({ isLarge = false }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Web Development',
    message: '',
  });

  const [errors, setErrors] = useState({
    phone: '',
    email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict 10-digit contact number handling
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digitsOnly }));

      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        setErrors(prev => ({ ...prev, phone: `${digitsOnly.length}/10 digits entered (10 digits required)` }));
      } else {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
      return;
    }

    // Email validation
    if (name === 'email') {
      setFormData(prev => ({ ...prev, email: value }));
      const cleanEmail = value.trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (cleanEmail && !emailRegex.test(cleanEmail)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g. name@gmail.com)' }));
      } else {
        const domain = cleanEmail.split('@')[1] || '';
        if (domain.toLowerCase().includes('gmail') && domain.toLowerCase() !== 'gmail.com') {
          setErrors(prev => ({ ...prev, email: 'Did you mean @gmail.com? Please verify.' }));
        } else {
          setErrors(prev => ({ ...prev, email: '' }));
        }
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate Phone Number (must be exactly 10 digits)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrors(prev => ({ ...prev, phone: 'Contact number must be exactly 10 digits.' }));
      showToast('Contact number must be exactly 10 digits.', 'error');
      return;
    }

    // 2. Validate Email Address
    const cleanEmail = formData.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email (e.g. yourname@gmail.com).' }));
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    const domain = cleanEmail.split('@')[1] || '';
    if (domain.toLowerCase().includes('gmail') && domain.toLowerCase() !== 'gmail.com') {
      setErrors(prev => ({ ...prev, email: 'Did you mean @gmail.com? Please verify your Gmail.' }));
      showToast('Please check your Gmail address format (@gmail.com).', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: cleanPhone,
          email: cleanEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit enquiry.');
      }

      showToast('Thank you for consulting us, our team will contact you within 24 to 48 hours.', 'success');
      setFormData({
        name: '',
        phone: '',
        email: '',
        service: 'Web Development',
        message: '',
      });
      setErrors({ phone: '', email: '' });
    } catch (err) {
      showToast(err.message || 'Something went wrong. Please call +91 9117696512 or +91 6205570278.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`contact-form ${isLarge ? 'large-form' : ''}`} onSubmit={handleSubmit}>
      {isLarge && (
        <div className="form-title">
          <span>✦</span>
          <div>
            <h2>Tell us about your project</h2>
            <p>Direct review by Founders Aashutosh Kumar &amp; Ankitosh Kumar.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isLarge ? '1fr 1fr' : '1fr', gap: '15px' }}>
        <label>
          Your Name *
          <input 
            type="text" 
            name="name" 
            required 
            placeholder="e.g. Rahul Sharma" 
            value={formData.name}
            onChange={handleChange}
          />
        </label>
        <label>
          Phone Number (10 digits) *
          <input 
            type="tel" 
            name="phone" 
            required 
            maxLength={10}
            inputMode="numeric"
            pattern="[0-9]{10}"
            placeholder="e.g. 9876543210 (10 digits)" 
            value={formData.phone}
            onChange={handleChange}
            style={{
              borderColor: errors.phone ? '#dc2626' : undefined,
              outlineColor: errors.phone ? '#dc2626' : undefined,
            }}
          />
          {errors.phone ? (
            <span style={{ display: 'block', color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
              ⚠️ {errors.phone}
            </span>
          ) : formData.phone.length === 10 ? (
            <span style={{ display: 'block', color: '#16a34a', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
              ✓ 10-digit number entered
            </span>
          ) : null}
        </label>
      </div>

      <label>
        Valid Email Address *
        <input 
          type="email" 
          name="email" 
          required 
          placeholder="e.g. you@gmail.com or company email" 
          value={formData.email}
          onChange={handleChange}
          style={{
            borderColor: errors.email ? '#dc2626' : undefined,
            outlineColor: errors.email ? '#dc2626' : undefined,
          }}
        />
        {errors.email ? (
          <span style={{ display: 'block', color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
            ⚠️ {errors.email}
          </span>
        ) : formData.email.includes('@') && !errors.email ? (
          <span style={{ display: 'block', color: '#16a34a', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
            ✓ Valid email format
          </span>
        ) : null}
      </label>

      <label>
        What can we help with?
        <select 
          name="service" 
          value={formData.service}
          onChange={handleChange}
        >
          <option value="Web Development">Web Development (&lt;/&gt;)</option>
          <option value="Mobile App Development">Mobile App Development</option>
          <option value="UI/UX Design">UI/UX Design</option>
          <option value="Cloud Solutions">Cloud Solutions</option>
          <option value="IT Support & More">IT Support &amp; More</option>
          <option value="Digital Marketing">Digital Marketing</option>
          <option value="SEO (Search Engine Optimization)">SEO (Search Engine Optimization)</option>
          <option value="Social Media Management">Social Media Management</option>
          <option value="Google / Meta Ads">Google / Meta Ads</option>
          <option value="Graphics / Social Media Design">Graphics / Social Media Design</option>
        </select>
      </label>

      <label>
        Tell us about your goals
        <textarea 
          name="message" 
          rows={3} 
          placeholder="Describe your project, timeline, budget, or ideas..."
          value={formData.message}
          onChange={handleChange}
        />
      </label>

      <button className="button primary" type="submit" disabled={loading}>
        {loading ? 'Submitting Enquiry…' : 'Send My Enquiry →'}
      </button>

      <small className="form-note">
        We respect your privacy. Our team will contact you within 24 to 48 hours.
      </small>
    </form>
  );
}
