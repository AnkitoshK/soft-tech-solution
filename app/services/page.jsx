import Link from 'next/link';

export const metadata = {
  title: 'Our Services | Soft Tech Solution',
  description: 'Full-suite digital services: Web Development, Mobile Apps, UI/UX Design, Cloud Solutions, IT Support, Digital Marketing, SEO, Social Media, Google & Meta Ads, Graphic Design.',
};

export default function ServicesPage() {
  const services = [
    {
      num: '01',
      icon: '</>',
      title: 'Web Development',
      desc: 'High-performing, responsive web applications built with Next.js, React, Node.js, and modern databases. Engineered for blistering speed, security, and maximum conversion rates.',
      tags: ['Next.js / React Apps', 'Fullstack Web Portals', 'E-Commerce Platforms', 'API & Database Integration', 'Speed & CWV Optimization'],
      iconBg: '#e4f4f9',
      iconColor: '#247fb8',
    },
    {
      num: '02',
      icon: '📱',
      title: 'Mobile App Development',
      desc: 'Seamless, feature-rich iOS and Android mobile applications built using cross-platform and native frameworks with offline support, push notifications, and intuitive UX.',
      tags: ['iOS & Android Apps', 'React Native & Flutter', 'App Store & Play Store Publishing', 'Real-time Sync & Notifications'],
      iconBg: '#fff1e4',
      iconColor: '#e57832',
    },
    {
      num: '03',
      icon: '✒️',
      title: 'UI/UX Design',
      desc: 'User-centered interface design, wireframing, interactive prototypes, and design systems in Figma that captivate visitors and streamline user journeys into paying customers.',
      tags: ['Figma Prototyping', 'User Research & Wireframing', 'Design Systems & Tokens', 'Conversion Rate Optimization (CRO)'],
      iconBg: '#f0ecfa',
      iconColor: '#6c58a0',
    },
    {
      num: '04',
      icon: '☁️',
      title: 'Cloud Solutions',
      desc: 'Modern cloud infrastructure architecture, serverless backend microservices, database management, and zero-downtime deployment pipelines on Vercel, AWS, and Supabase.',
      tags: ['Cloud Architecture', 'Serverless Functions', 'PostgreSQL / Supabase', 'CI/CD Automation', 'Cloud Security'],
      iconBg: '#e5f4fa',
      iconColor: '#2781b9',
    },
    {
      num: '05',
      icon: '⚙️',
      title: 'IT Support & More',
      desc: 'Comprehensive technical maintenance, system troubleshooting, software upgrades, bug fixes, performance monitoring, and round-the-clock technological advisory.',
      tags: ['24/7 Technical Maintenance', 'Software Bug Fixes & Patches', 'Security Audits', 'Infrastructure Monitoring', 'IT Advisory'],
      iconBg: '#f1f5f9',
      iconColor: '#334155',
    },
    {
      num: '06',
      icon: '📢',
      title: 'Digital Marketing',
      desc: 'Full-funnel digital growth campaigns that expand your brand awareness, attract high-intent traffic, and generate predictable, scalable inbound customer pipelines.',
      tags: ['Inbound Growth Funnels', 'Multi-channel Campaigns', 'Email Marketing Automation', 'Lead Generation & Nurturing'],
      iconBg: '#fff0e7',
      iconColor: '#d87138',
    },
    {
      num: '07',
      icon: '📈',
      title: 'SEO (Search Engine Optimization)',
      desc: 'Proven search optimization combining technical health, on-page optimization, keyword architecture, and backlink authority to dominate first-page Google rankings.',
      tags: ['Technical SEO Audits', 'Keyword Research', 'Local Business SEO', 'On-Page Content Optimization', 'Rank Tracking'],
      iconBg: '#f0ecfa',
      iconColor: '#6c58a0',
    },
    {
      num: '08',
      icon: '📸',
      title: 'Social Media Management',
      desc: 'Engaging, authentic social media presence across Instagram, Facebook, LinkedIn, X, and YouTube with viral content calendars, reel production, and daily audience engagement.',
      tags: ['Instagram & LinkedIn Growth', 'Reels & Short Video Concepts', 'Community Management', 'Monthly Analytics Audits'],
      iconBg: '#fff0e5',
      iconColor: '#e67831',
    },
    {
      num: '09',
      icon: '🎯',
      title: 'Google / Meta Ads',
      desc: 'Laser-targeted paid advertising on Google Search, Performance Max, Instagram, and Facebook engineered for positive unit economics and measurable return on ad spend (ROAS).',
      tags: ['Google Search & Shopping Ads', 'Meta (FB & IG) Paid Funnels', 'Retargeting Pixels', 'A/B Creative Split Testing', 'ROAS Scaling'],
      iconBg: '#fff7e0',
      iconColor: '#e89d20',
    },
    {
      num: '10',
      icon: '🎨',
      title: 'Graphics / Social Media Design',
      desc: 'Bespoke brand identities, striking logos, social media creative kits, marketing collateral, banners, and brochures that project immense credibility and prestige.',
      tags: ['Brand Identity & Logo Systems', 'Social Media Creative Kits', 'Marketing Banners & Brochures', 'Packaging & Pitch Decks'],
      iconBg: '#e4f4f9',
      iconColor: '#247fb8',
    },
  ];

  return (
    <>
      <section className="page-hero" style={{ padding: '90px 0 70px', background: 'linear-gradient(117deg, #f5faff, #fff7f0)' }}>
        <div className="wrap">
          <p className="eyebrow">
            <span></span> IDEAS | CODE | SOLUTIONS
          </p>
          <h1 style={{ fontSize: 'clamp(38px, 5vw, 58px)', marginBottom: '16px' }}>
            Turning Your Ideas Into<br />
            <em>Digital Success.</em>
          </h1>
          <p style={{ maxWidth: '620px', color: '#6d7788', fontSize: '16px', lineHeight: '1.75' }}>
            More Visibility | More Traffic | More Growth. All 10 core offerings engineered around your commercial milestones by Founders Aashutosh Kumar &amp; Ankitosh Kumar.
          </p>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '30px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)' }}>✓ Creative Solutions</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue)' }}>✓ Expert Team</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>✓ On-Time Delivery</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple)' }}>✓ 100% Client Satisfaction</span>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#ffffff' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '26px' }}>
            {services.map((s) => (
              <article 
                key={s.num} 
                style={{
                  background: '#ffffff',
                  border: '1px solid #e7edf5',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 8px 24px rgba(35, 63, 120, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div 
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: s.iconBg,
                      color: s.iconColor,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '24px',
                      fontWeight: 800,
                    }}
                  >
                    {s.icon}
                  </div>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '14px', color: '#94a3b8' }}>
                    {s.num}
                  </span>
                </div>

                <h2 style={{ fontSize: '22px', marginBottom: '12px', lineHeight: 1.3 }}>{s.title}</h2>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                  {s.desc}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px', marginTop: 'auto' }}>
                  {s.tags.map((tag) => (
                    <span 
                      key={tag}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link 
                  href="/contact" 
                  className="button outline"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
                >
                  Request Consultation <span>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP WITH BOTH FOUNDERS */}
      <section style={{ background: 'var(--navy)', color: '#ffffff', padding: '80px 0' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
          <div>
            <p className="eyebrow light"><span></span> Direct Line to Founders</p>
            <h2 style={{ color: '#ffffff', fontSize: '38px', margin: '0 0 10px' }}>
              Let’s build something<br /><em style={{ color: 'var(--gold)' }}>extraordinary.</em>
            </h2>
            <p style={{ color: '#c7d5ec', fontSize: '15px', lineHeight: 1.7 }}>
              Founder Aashutosh Kumar: <a href="tel:+919117696512" style={{ color: '#ffffff', fontWeight: 700 }}>+91 9117696512</a><br />
              Co-Founder Ankitosh Kumar: <a href="tel:+916205570278" style={{ color: '#ffffff', fontWeight: 700 }}>+91 6205570278</a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <Link className="button primary" href="/contact">
              Get a Proposal <span>→</span>
            </Link>
            <a className="button secondary" href="tel:+919117696512">
              Call Aashutosh <span>📞</span>
            </a>
            <a className="button secondary" href="tel:+916205570278">
              Call Ankitosh <span>📞</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
