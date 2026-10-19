import Link from 'next/link';

export const metadata = {
  title: 'About Us | Soft Tech Solution',
  description: 'Meet the founders of Soft Tech Solution: Aashutosh Kumar (Founder) and Ankitosh Kumar (Co-Founder). Turning your ideas into digital success.',
};

export default function AboutPage() {
  return (
    <>
      {/* PAGE HERO */}
      <section className="page-hero" style={{ padding: '90px 0 70px', background: 'linear-gradient(117deg, #f5faff, #fff7f0)' }}>
        <div className="wrap">
          <p className="eyebrow">
            <span></span> About Soft Tech Solution · IDEAS | CODE | SOLUTIONS
          </p>
          <h1 style={{ fontSize: 'clamp(38px, 5vw, 58px)', marginBottom: '16px' }}>
            Turning Your Ideas Into<br />
            <em>Digital Success.</em>
          </h1>
          <p style={{ maxWidth: '580px', color: '#6d7788', fontSize: '16px', lineHeight: '1.75' }}>
            More Visibility | More Traffic | More Growth. Combining high-level strategy, cutting-edge software architecture, and creative marketing to help ambitious businesses become market leaders.
          </p>
        </div>
      </section>

      {/* STORY SECTION */}
      <section className="section" style={{ background: '#ffffff' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '80px', alignItems: 'center' }}>
          <div style={{ height: '380px', position: 'relative', background: 'linear-gradient(145deg, #e6f5fa, #fff2e4)', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: '320px', height: '320px', border: '1px solid rgba(42, 128, 181, 0.3)', borderRadius: '50%', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 0 34px rgba(42, 128, 181, 0.1)' }}></div>
            <div style={{ width: '130px', height: '130px', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: '#ffffff', display: 'grid', placeItems: 'center', boxShadow: '0 14px 28px rgba(31, 70, 144, 0.2)', padding: '16px' }}>
              <img src="/soft-tech-solution-logo.jpeg" alt="Soft Tech Solution" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>            <div style={{ position: 'absolute', bottom: '24px', left: '24px', borderRadius: '12px', background: '#ffffff', padding: '14px 18px', boxShadow: '0 10px 24px rgba(37, 68, 116, 0.12)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <b style={{ color: 'var(--orange)', fontFamily: 'Poppins, sans-serif', fontSize: '22px' }}>Sept 2026</b>
              <span style={{ fontSize: '11px', color: '#6d7788', lineHeight: 1.4 }}>
                Founded with Enterprise<br />Engineering Pedigree
              </span>
            </div>
          </div>

          <div>
            <p className="eyebrow"><span></span> Our Story &amp; Origins</p>
            <h2 style={{ fontSize: 'clamp(32px, 3.5vw, 42px)', marginBottom: '18px' }}>
              Founded in <em>September 2026.</em>
            </h2>
            <p style={{ color: '#667085', fontSize: '15px', lineHeight: 1.85, marginBottom: '14px' }}>
              Soft Tech Solution was established in <strong>September 2026</strong> by <strong>Aashutosh Kumar</strong> and <strong>Ankitosh Kumar</strong>. Both founders hold <strong>MCA (Master of Computer Applications)</strong> post-graduate degrees and bring real-world corporate engineering experience from leading organizations including <strong>Railworld (Railworld India Pvt Ltd)</strong> and <strong>Tata Power (The Tata Power Company Limited)</strong>.
            </p>
            <p style={{ color: '#667085', fontSize: '15px', lineHeight: 1.85, marginBottom: '18px' }}>
              Having worked on enterprise systems and critical software infrastructure, our founders started Soft Tech Solution to give growing businesses access to the same high-level software craftsmanship, scalable cloud architectures, and data-backed digital marketing.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <b style={{ color: 'var(--orange)', fontSize: '14px', display: 'block' }}>✓ Enterprise Engineering</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tier-1 corporate standards (Tata Power &amp; Railworld)</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <b style={{ color: 'var(--blue)', fontSize: '14px', display: 'block' }}>✓ MCA Post-Graduate Leads</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Computer Applications &amp; Fullstack Architecture</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#16a34a', fontSize: '14px', display: 'block' }}>✓ On-Time Delivery</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Disciplined agile sprints &amp; milestone transparency</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <b style={{ color: 'var(--purple)', fontSize: '14px', display: 'block' }}>✓ 100% Client Commitment</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Continuous conversion optimization &amp; monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE FOUNDERS SECTION */}
      <section className="section" style={{ background: '#fff7f0' }}>
        <div className="wrap">
          <div className="section-head" style={{ marginBottom: '36px' }}>
            <div>
              <p className="eyebrow"><span></span> Executive Leadership</p>
              <h2>Meet the <em>Founders.</em></h2>
            </div>
            <p>
              Direct accessibility, enterprise corporate experience, and technical vision guiding every project at Soft Tech Solution.
            </p>
          </div>

          <div className="founders-grid">
            {/* FOUNDER (LEFT SIDE): AASHUTOSH KUMAR */}
            <div className="founder-card">
              <div className="founder-avatar-wrap ashutosh">
                <img 
                  src="/ashutosh-kumar-founder.jpeg" 
                  alt="Aashutosh Kumar, Founder of Soft Tech Solution (in Blue Coat)" 
                />
              </div>
              <h3>Aashutosh Kumar</h3>
              <span className="founder-role-badge orange">Founder &amp; Strategy Lead</span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0 14px', width: '100%' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                  🎓 MCA (Master of Computer Applications)
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '4px 10px', borderRadius: '6px' }}>
                  🏢 Ex-Railworld (Railworld India Pvt Ltd)
                </span>
              </div>
              
              <a 
                href="tel:+919117696512" 
                className="founder-phone-chip" 
                title="Call Founder Aashutosh Kumar"
              >
                <span>📞</span>
                <span>+91 9117696512</span>
              </a>

              <p className="founder-bio">
                “With an MCA degree and corporate software engineering experience at Railworld, I founded Soft Tech Solution in September 2026. Every business deserves authentic, reliable digital growth built on disciplined architecture and measurable customer acquisition.”
              </p>
              
              <div className="founder-action-buttons" style={{ display: 'flex', gap: '10px', width: '100%', marginTop: 'auto' }}>
                <a 
                  className="button primary" 
                  href="tel:+919117696512" 
                  style={{ flex: 1, padding: '12px 14px', fontSize: '13px' }}
                >
                  Call Aashutosh <span>📞</span>
                </a>
                <a 
                  className="button secondary" 
                  href="https://wa.me/919117696512?text=Hi%20Aashutosh,%20I%20would%20like%20to%20discuss%20a%20project%20with%20Soft%20Tech%20Solution." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ flex: 1, padding: '12px 14px', fontSize: '13px' }}
                >
                  WhatsApp <span>💬</span>
                </a>
              </div>
            </div>

            {/* CO-FOUNDER (RIGHT SIDE): ANKITOSH KUMAR */}
            <div className="founder-card">
              <div className="founder-avatar-wrap ankitosh">
                <img 
                  src="/ankitosh-kumar-cofounder.jpeg" 
                  alt="Ankitosh Kumar, Co-Founder of Soft Tech Solution (in Blue Suit)" 
                />
              </div>
              <h3>Ankitosh Kumar</h3>
              <span className="founder-role-badge blue">Co-Founder &amp; Tech Lead</span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0 14px', width: '100%' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                  🎓 MCA (Master of Computer Applications)
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px' }}>
                  🏢 Ex-Tata Power (Tata Power Co. Ltd)
                </span>
              </div>
              
              <a 
                href="tel:+916205570278" 
                className="founder-phone-chip" 
                title="Call Co-Founder Ankitosh Kumar"
              >
                <span>📞</span>
                <span>+91 6205570278</span>
              </a>

              <p className="founder-bio">
                “Armed with an MCA degree and enterprise software &amp; systems engineering experience at Tata Power, I lead our technical architecture. We engineer robust, modern Next.js applications and cloud infrastructures built to convert traffic into scalable business revenue.”
              </p>
              <div className="founder-action-buttons" style={{ display: 'flex', gap: '10px', width: '100%', marginTop: 'auto' }}>
                <a 
                  className="button primary" 
                  href="tel:+916205570278" 
                  style={{ flex: 1, padding: '12px 14px', fontSize: '13px' }}
                >
                  Call Ankitosh <span>📞</span>
                </a>
                <a 
                  className="button secondary" 
                  href="https://wa.me/916205570278?text=Hi%20Ankitosh,%20I%20would%20like%20to%20discuss%20a%20project%20with%20Soft%20Tech%20Solution." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ flex: 1, padding: '12px 14px', fontSize: '13px' }}
                >
                  WhatsApp <span>💬</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUIDING VALUES */}
      <section className="section" style={{ background: '#f6f9fb' }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow"><span></span> What Guides Us</p>
              <h2>Good work starts with<br /><em>good principles.</em></h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '22px' }}>
            <article style={{ background: '#ffffff', border: '1px solid #e5ebf1', padding: '32px', borderRadius: '14px' }}>
              <b style={{ color: 'var(--orange)', fontFamily: 'Poppins, sans-serif', fontSize: '16px' }}>01</b>
              <h3 style={{ fontSize: '20px', margin: '18px 0 10px' }}>Be genuinely useful</h3>
              <p style={{ color: '#6d7788', fontSize: '14px', lineHeight: 1.75 }}>
                We prioritize strategies and code that generate real customer acquisition and commercial value, not vanity metrics.
              </p>
            </article>

            <article style={{ background: '#ffffff', border: '1px solid #e5ebf1', padding: '32px', borderRadius: '14px' }}>
              <b style={{ color: 'var(--blue)', fontFamily: 'Poppins, sans-serif', fontSize: '16px' }}>02</b>
              <h3 style={{ fontSize: '20px', margin: '18px 0 10px' }}>Stay technologically curious</h3>
              <p style={{ color: '#6d7788', fontSize: '14px', lineHeight: 1.75 }}>
                Digital moves fast. From modern Next.js architectures to algorithmic marketing updates, we stay ahead so our clients win.
              </p>
            </article>

            <article style={{ background: '#ffffff', border: '1px solid #e5ebf1', padding: '32px', borderRadius: '14px' }}>
              <b style={{ color: 'var(--purple)', fontFamily: 'Poppins, sans-serif', fontSize: '16px' }}>03</b>
              <h3 style={{ fontSize: '20px', margin: '18px 0 10px' }}>Transparent reporting</h3>
              <p style={{ color: '#6d7788', fontSize: '14px', lineHeight: 1.75 }}>
                Clear accountability and honest communication are integral to our partnership. You will always know what is performing.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* TEAM BANNER CTA */}
      <section style={{ background: 'var(--navy)', color: '#ffffff', padding: '80px 0' }}>
        <div className="wrap" style={{ textAlign: 'center', maxWidth: '750px', margin: 'auto' }}>
          <p className="eyebrow light" style={{ justifyContent: 'center' }}>
            <span></span> Direct Founder Access
          </p>
          <h2 style={{ color: '#ffffff', fontSize: '42px', margin: '0 0 16px' }}>
            Creative minds.<br /><em style={{ color: 'var(--gold)' }}>Commercial thinking.</em>
          </h2>
          <p style={{ color: '#cad5e8', fontSize: '16px', lineHeight: 1.8, marginBottom: '30px' }}>
            Connect directly with Founders Aashutosh Kumar (+91 9117696512) and Ankitosh Kumar (+91 6205570278) to start your digital growth sprint today.
          </p>
          <div className="services-cta-buttons" style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="button primary" href="/contact">
              Start a Conversation <span>→</span>
            </Link>
            <a className="button secondary" href="tel:+919117696512">
              Call Aashutosh (+91 9117696512)
            </a>
            <a className="button secondary" href="tel:+916205570278">
              Call Ankitosh (+91 6205570278)
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
