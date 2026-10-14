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
    service: '',
    message: '',
  });

  const [errors, setErrors] = useState({
    phone: '',
    email: '',
    service: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict numeric restriction, max 10 digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digitsOnly }));
      setErrors(prev => ({ ...prev, phone: '' }));
      return;
    }

    if (name === 'email') {
      setFormData(prev => ({ ...prev, email: value }));
      setErrors(prev => ({ ...prev, email: '' }));
      return;
    }

    if (name === 'service') {
      setFormData(prev => ({ ...prev, service: value }));
      setErrors(prev => ({ ...prev, service: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate Phone Number (must be exactly 10 digits)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid 10-digit mobile number.' }));
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    // 2. Validate Email Address
    const cleanEmail = formData.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    const domain = cleanEmail.split('@')[1] || '';
    if (domain.toLowerCase().includes('gmail') && domain.toLowerCase() !== 'gmail.com') {
      setErrors(prev => ({ ...prev, email: 'Please check your email address.' }));
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    // 3. Validate Service selection
    if (!formData.service) {
      setErrors(prev => ({ ...prev, service: 'Please select a service.' }));
      showToast('Please choose a service you need.', 'error');
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
        service: '',
        message: '',
      });
      setErrors({ phone: '', email: '', service: '' });
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
            placeholder="Full Name" 
            value={formData.name}
            onChange={handleChange}
          />
        </label>
        <label>
          Phone Number *
          <input 
            type="tel" 
            name="phone" 
            required 
            maxLength={10}
            inputMode="numeric"
            pattern="[0-9]{10}"
            placeholder="Mobile Number" 
            value={formData.phone}
            onChange={handleChange}
            style={{
              borderColor: errors.phone ? '#dc2626' : undefined,
              outlineColor: errors.phone ? '#dc2626' : undefined,
            }}
          />
          {errors.phone && (
            <span style={{ display: 'block', color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
              {errors.phone}
            </span>
          )}
        </label>
      </div>

      <label>
        Email Address *
        <input 
          type="email" 
          name="email" 
          required 
          placeholder="Email Address" 
          value={formData.email}
          onChange={handleChange}
          style={{
            borderColor: errors.email ? '#dc2626' : undefined,
            outlineColor: errors.email ? '#dc2626' : undefined,
          }}
        />
        {errors.email && (
          <span style={{ display: 'block', color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
            {errors.email}
          </span>
        )}
      </label>

      <label>
        What can we help with? *
        <select 
          name="service" 
          required
          value={formData.service}
          onChange={handleChange}
          style={{
            borderColor: errors.service ? '#dc2626' : undefined,
            color: formData.service ? '#1f2937' : '#9ca3af',
          }}
        >
          <option value="" disabled>-- Select a Service --</option>
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
        {errors.service && (
          <span style={{ display: 'block', color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
            {errors.service}
          </span>
        )}
      </label>

      <label>
        Tell us about your goals
        <textarea 
          name="message" 
          rows={3} 
          placeholder="Message or project requirements..."
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
