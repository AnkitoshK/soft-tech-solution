'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PortfolioPage() {
  const [filter, setFilter] = useState('all');

  const projects = [
    {
      id: 'roast',
      title: 'A brand made for bright starts.',
      client: 'Morning Roast',
      types: ['branding', 'marketing'],
      typeLabel: 'Branding · Social Media Marketing',
      desc: 'Complete identity rebrand, visual art direction, packaging concepts, and high-engagement social media campaigns that generated 45,000+ organic followers.',
      metric: '+185% Engagement',
      bgGradient: 'linear-gradient(135deg, #1f5791, #187098)',
      tagColor: '#efcd8b',
    },
    {
      id: 'form',
      title: 'A digital storefront designed to convert.',
      client: 'Form Apparel',
      types: ['web', 'marketing'],
      typeLabel: 'Next.js Web Design · Paid Media',
      desc: 'Custom responsive e-commerce web application with instant checkout flow and Meta ad funnel optimization resulting in a 3.4x spike in revenue.',
      metric: '3.4x ROAS',
      bgGradient: '#df7040',
      tagColor: '#fff',
    },
    {
      id: 'arch',
      title: 'Giving a growing architecture studio a distinctive home.',
      client: 'Arch Studio',
      types: ['branding', 'web'],
      typeLabel: 'Branding · Portfolio Web Design',
      desc: 'Minimalist editorial website design and high-end typography showcasing architectural masterworks with interactive project galleries.',
      metric: '+92% Lead Inquiries',
      bgGradient: '#ded6cf',
      tagColor: '#2d333a',
    },
    {
      id: 'sprout',
      title: 'Growing a health & wellness community from the ground up.',
      client: 'Sprout Organic',
      types: ['marketing'],
      typeLabel: 'Social Media · Content Strategy',
      desc: 'End-to-end content creation, influencer partnerships, and educational email marketing campaigns establishing market authority.',
      metric: '120k+ Video Views',
      bgGradient: '#e4edcf',
      tagColor: '#31563f',
    },
  ];

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return p.types.includes(filter);
  });

  return (
    <>
      <section className="page-hero" style={{ padding: '90px 0 70px', background: 'linear-gradient(117deg, #f5faff, #fff7f0)' }}>
        <div className="wrap">
          <p className="eyebrow">
            <span></span> Proven Track Record
          </p>
          <h1 style={{ fontSize: 'clamp(38px, 5vw, 58px)', marginBottom: '16px' }}>
            Work designed to<br />
            <em>move the needle.</em>
          </h1>
          <p style={{ maxWidth: '540px', color: '#6d7788', fontSize: '16px', lineHeight: '1.75' }}>
            A curated selection of digital experiences, branding campaigns, and custom applications engineered for commercial impact.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#f8fafc' }}>
        <div className="wrap">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '36px', flexWrap: 'wrap' }}>
            {['all', 'branding', 'web', 'marketing'].map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #dbe3eb',
                  background: filter === category ? 'var(--navy)' : '#ffffff',
                  color: filter === category ? '#ffffff' : '#475467',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                }}
              >
                {category === 'all' ? 'All Work' : category === 'web' ? 'Web Design & Next.js' : category}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '26px' }}>
            {filteredProjects.map((p) => (
              <article 
                key={p.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e3e9ef',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div 
                  style={{
                    height: '240px',
                    background: p.bgGradient,
                    padding: '30px',
                    color: p.tagColor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '24px', letterSpacing: '1px' }}>
                    {p.client}
                  </span>
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.9)', color: '#1f2937', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '12px' }}>
                    {p.metric}
                  </div>
                </div>

                <div style={{ padding: '26px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <p style={{ color: 'var(--orange)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    {p.typeLabel}
                  </p>
                  <h2 style={{ fontSize: '22px', marginBottom: '12px', lineHeight: 1.3 }}>
                    {p.title}
                  </h2>
                  <p style={{ color: '#667085', fontSize: '14px', lineHeight: 1.7, marginBottom: '22px' }}>
                    {p.desc}
                  </p>
                  <Link 
                    href="/contact" 
                    style={{
                      marginTop: 'auto',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--navy)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Start a project like this <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--navy)', color: '#ffffff', padding: '80px 0' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
          <div>
            <p className="eyebrow light"><span></span> Your project could be next</p>
            <h2 style={{ color: '#ffffff', fontSize: '38px', margin: '0 0 10px' }}>
              Big idea?<br /><em style={{ color: 'var(--gold)' }}>Let’s make it real.</em>
            </h2>
            <p style={{ color: '#c7d5ec', fontSize: '15px' }}>
              Speak with Co-Founder Ankitosh Kumar (+91 6205570278) to get tailored strategic advice.
            </p>
          </div>
          <Link className="button primary" href="/contact">
            Tell us about your project <span>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
