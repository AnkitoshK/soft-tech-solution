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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
          Phone Number *
          <input 
            type="tel" 
            name="phone" 
            required 
            placeholder="e.g. +91 98765 43210" 
            value={formData.phone}
            onChange={handleChange}
          />
        </label>
      </div>

      <label>
        Work Email *
        <input 
          type="email" 
          name="email" 
          required 
          placeholder="you@company.com" 
          value={formData.email}
          onChange={handleChange}
        />
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
