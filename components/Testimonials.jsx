'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Testimonials() {
  const [activeFilter, setActiveFilter] = useState('all');

  const testimonialsData = [
    {
      id: 'softride',
      category: 'softride',
      projectTag: '🚗 SoftRide · Online Vehicle Booking Website',
      projectType: 'Custom Next.js Web App & Booking System',
      clientName: 'Juli Kumari',
      clientRole: 'Founder & Managing Director',
      company: 'SoftRide Solutions',
      avatar: 'JK',
      avatarBg: 'linear-gradient(135deg, #059669, #10b981)',
      rating: 5,
      impactMetric: '🚀 +240% Daily Bookings Surge',
      techStack: ['Next.js App', 'Google Maps Route API', 'Instant Fare Calculator', 'Razorpay Checkout', 'Fleet Dispatch'],
      quote:
        'Soft Tech Solution engineered SoftRide from the ground up—a high-performance online vehicle booking and fleet reservation website with real-time route calculations, instant fare estimates, and automated driver dispatch. Our daily bookings surged by 240% in the first two months, and the uptime has been rock-solid. Aashutosh and Ankitosh bring top-tier enterprise engineering that truly transformed our business!',
    },
    {
      id: 'workmate-ai',
      category: 'workmate',
      projectTag: '🤖 Workmate AI · Intelligent Ticketing Tool',
      projectType: 'Enterprise AI & Support Automation Desk',
      clientName: 'Neha Deshmukh',
      clientRole: 'Head of Operations & Product',
      company: 'Workmate Technologies',
      avatar: 'ND',
      avatarBg: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      rating: 5,
      impactMetric: '⚡ 72% Faster Issue Resolution',
      techStack: ['AI Ticketing Engine', 'NLP Auto-Categorization', 'SLA Tracking', 'Smart Priority Routing', 'Real-time WebSocket'],
      quote:
        'We commissioned Soft Tech Solution to build Workmate AI, our custom AI-powered support ticketing tool. Their team delivered intelligent NLP ticket categorisation, automated priority routing, and instant AI draft responses. It cut our client response turnaround time by 72% and saved hundreds of support hours. Truly phenomenal full-stack and AI execution!',
    },
    {
      id: 'ui-ux-banner',
      category: 'banners',
      projectTag: '🎨 Brand UI/UX & Marketing Banner Suite',
      projectType: 'High-Converting Ad Creatives & Design System',
      clientName: 'Arjun Mehta',
      clientRole: 'Growth & Brand Marketing Lead',
      company: 'Nexus Digital Brands',
      avatar: 'AM',
      avatarBg: 'linear-gradient(135deg, #9333ea, #a855f7)',
      rating: 5,
      impactMetric: '📈 3.8x Click-Through Rate (CTR)',
      techStack: ['Figma Design System', 'Meta & Google Ad Banners', 'Hero Banner Visuals', 'Conversion Rate Optimization (CRO)'],
      quote:
        'We needed complete UI/UX design and high-converting marketing banners for our seasonal product launches and Google/Meta ad funnels. Soft Tech Solution delivered breathtaking banner designs, consistent design systems, and engaging social visual assets. Our click-through rate jumped 3.8x, and our ad spend conversion doubled within weeks. Their creative design sense is exceptional!',
    },
    {
      id: 'job-portal',
      category: 'jobportal',
      projectTag: '💼 TalentHire · Enterprise Job & Hiring Portal',
      projectType: 'Custom Recruitment Portal & Applicant Tracking',
      clientName: 'Sunil Kulkarni',
      clientRole: 'VP of Talent Acquisition',
      company: 'Apex Global Solutions',
      avatar: 'SK',
      avatarBg: 'linear-gradient(135deg, #ea580c, #f97316)',
      rating: 5,
      impactMetric: '🎯 150+ Hires Streamlined',
      techStack: ['Fullstack Job Portal', 'Automated Resume Parsing', 'Applicant Tracking System (ATS)', 'Candidate Interview Flow'],
      quote:
        'Soft Tech Solution developed an end-to-end job portal for our company that handles our entire hiring lifecycle—from posting openings and parsing candidate resumes to automated skill screening and employee onboarding. It completely replaced multiple expensive third-party tools and allowed us to recruit 150+ top employees effortlessly. Unbeatable ROI and reliable engineering!',
    },
  ];

  const filtered = activeFilter === 'all'
    ? testimonialsData
    : testimonialsData.filter(t => t.category === activeFilter);

  return (
    <section className="testimonial" id="testimonials">
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        
        {/* SECTION HEADER */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 40px' }}>
          <p className="eyebrow" style={{ color: '#ffd288', justifyContent: 'center' }}>
            <span></span> Real Client Stories &amp; Proven Deliverables
          </p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#ffffff', marginBottom: '14px', lineHeight: 1.2 }}>
            Delivered Results That Speak<br />
            <em style={{ color: '#ffd288', fontStyle: 'normal' }}>Louder Than Words.</em>
          </h2>
          <p style={{ color: '#c7d5ea', fontSize: '15px', lineHeight: 1.7, margin: '0 auto' }}>
            From high-traffic online booking systems like <b>SoftRide</b> and intelligent automation like <b>Workmate AI</b>, to conversion-optimized <b>UI/UX banner designs</b> and enterprise <b>job hiring portals</b>—see how we help businesses grow and scale.
          </p>
        </div>

        {/* FILTER TABS */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '36px',
        }}>
          {[
            { id: 'all', label: 'All Projects (4)' },
            { id: 'softride', label: '🚗 SoftRide (Vehicle Booking)' },
            { id: 'workmate', label: 'Workmate AI (Ticketing Tool)', isWorkmate: true },
            { id: 'banners', label: '🎨 UI/UX & Banner Design' },
            { id: 'jobportal', label: '💼 TalentHire (Job Portal)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: activeFilter === tab.id ? '1px solid #ffad39' : '1px solid rgba(255, 255, 255, 0.15)',
                background: activeFilter === tab.id ? 'linear-gradient(135deg, #e8772e, #f5a42a)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                boxShadow: activeFilter === tab.id ? '0 8px 20px rgba(232, 119, 46, 0.35)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {tab.isWorkmate && (
                <img
                  src="/workmate-tool-icon.svg"
                  alt="Workmate Tool Logo"
                  style={{ width: '18px', height: '18px', borderRadius: '4px', verticalAlign: 'middle' }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TESTIMONIAL CARDS GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
          gap: '24px',
        }}>
          {filtered.map((item) => (
            <article
              key={item.id}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '20px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 15px 35px rgba(10, 20, 45, 0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* TOP STRIP: PROJECT BADGE & IMPACT */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'rgba(255, 255, 255, 0.12)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    letterSpacing: '0.2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    {item.id === 'workmate-ai' && (
                      <img
                        src="/workmate-tool-icon.svg"
                        alt="Workmate Tool Logo"
                        style={{ width: '18px', height: '18px', borderRadius: '4px', verticalAlign: 'middle' }}
                      />
                    )}
                    {item.projectTag}
                  </span>
                  
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#064e3b',
                    background: '#a7f3d0',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: '1px solid #6ee7b7',
                  }}>
                    {item.impactMetric}
                  </span>
                </div>

                {/* STAR RATING & VERIFIED BADGE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '15px', letterSpacing: '2px' }}>
                    ★★★★★
                  </div>
                  <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 600 }}>
                    5.0 / 5.0 · <span style={{ color: '#86efac' }}>✓ Verified Deliverable</span>
                  </span>
                </div>

                {/* QUOTE BODY */}
                <p style={{
                  color: '#e2e8f0',
                  fontSize: '14px',
                  lineHeight: 1.8,
                  fontStyle: 'normal',
                  margin: '0 0 20px',
                }}>
                  "{item.quote}"
                </p>

                {/* TECH STACK / DELIVERED SCOPE */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                  {item.techStack.map((tech, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '11px',
                        color: '#cbd5e1',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* CLIENT PROFILE FOOTER */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: item.avatarBg,
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  flexShrink: 0,
                }}>
                  {item.avatar}
                </div>
                <div>
                  <b style={{ display: 'block', fontSize: '15px', color: '#ffffff', letterSpacing: '-0.2px' }}>
                    {item.clientName}
                  </b>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {item.clientRole} · <strong style={{ color: '#cbd5e1' }}>{item.company}</strong>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* REALISTIC ADVERTISEMENT CTA BANNER */}
        <div style={{
          marginTop: '48px',
          background: 'linear-gradient(135deg, rgba(232, 119, 46, 0.15), rgba(31, 125, 185, 0.2))',
          border: '1px solid rgba(245, 164, 42, 0.35)',
          borderRadius: '20px',
          padding: '30px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 20px 40px rgba(10, 20, 45, 0.35)',
        }}>
          <div style={{ maxWidth: '640px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#fed7aa',
              background: 'rgba(234, 88, 12, 0.25)',
              padding: '3px 10px',
              borderRadius: '20px',
              marginBottom: '8px',
            }}>
              💡 Ready To Build Yours?
            </span>
            <h3 style={{ fontSize: '20px', color: '#ffffff', margin: '0 0 6px', fontWeight: 700 }}>
              Need a vehicle booking website, AI ticketing tool, custom hiring portal, or banner creatives?
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
              Direct founders consultation with Aashutosh Kumar &amp; Ankitosh Kumar. We turn your project blueprint into a high-converting, scalable reality.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              className="button primary"
              style={{
                padding: '12px 22px',
                fontSize: '14px',
                boxShadow: '0 8px 24px rgba(232, 119, 46, 0.4)',
              }}
            >
              Get Free Project Proposal ↗
            </Link>
            <a
              href="https://wa.me/919117696512?text=Hello%20Aashutosh,%20I%20am%20interested%20in%20building%20a%20project%20like%20SoftRide%20/%20Workmate%20AI%20/%20Job%20Portal."
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary"
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              WhatsApp Founders 💬
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
