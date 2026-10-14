import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        {/* MAIN FOOTER GRID */}
        <div className="footer-top-grid">
          {/* COL 1: BRAND & MISSION */}
          <div className="footer-col brand-col">
            <Link href="/" className="brand" aria-label="SoftTech Solution">
              <img 
                src="/soft-tech-logo-transparent.png" 
                alt="SoftTech Solution" 
                className="brand-logo-img" 
                style={{ width: '44px', height: '44px', objectFit: 'contain' }} 
              />
              <div className="brand-lockup">
                <span className="brand-shared-s" style={{ fontSize: '32px' }}>S</span>
                <div className="brand-text-stack">
                  <span className="brand-top-text" style={{ fontSize: '15px' }}>
                    oft<b className="brand-tech-highlight">Tech</b>
                  </span>
                  <span className="brand-bottom-text" style={{ fontSize: '10px' }}>
                    olution
                  </span>
                </div>
              </div>
            </Link>
            <p className="footer-tagline">
              <strong>IDEAS | CODE | SOLUTIONS</strong>
            </p>
            <p className="footer-desc">
              Your Growth, Our Mission. We engineer custom web software, high-converting digital campaigns, and branding built to scale businesses.
            </p>
            <div className="footer-contact-item">
              <span className="footer-icon">✉</span>
              <a href="mailto:softtechsolution@gmail.com">softtechsolution@gmail.com</a>
            </div>
            <div className="footer-contact-item">
              <span className="footer-icon">🌐</span>
              <a href="https://soft-tech-solution-ebon.vercel.app/" target="_blank" rel="noopener noreferrer">
                soft-tech-solution-ebon.vercel.app
              </a>
            </div>
          </div>

          {/* COL 2: LEADERSHIP DIRECT LINES */}
          <div className="footer-col">
            <h4 className="footer-heading">Executive Leadership</h4>
            
            {/* FOUNDER: AASHUTOSH */}
            <div className="footer-founder-card">
              <div className="footer-founder-info">
                <strong className="footer-founder-name">Aashutosh Kumar</strong>
                <span className="footer-founder-role">Founder &amp; Strategy</span>
              </div>
              <div className="footer-founder-actions">
                <a href="tel:+919117696512" className="footer-call-btn">
                  📞 +91 9117696512
                </a>
                <a 
                  href="https://wa.me/919117696512?text=Hello%20Aashutosh,%20I%20want%20to%20discuss%20a%20project%20for%20my%20business." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="footer-wa-btn"
                  title="WhatsApp Aashutosh"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* CO-FOUNDER: ANKITOSH */}
            <div className="footer-founder-card" style={{ marginTop: '14px' }}>
              <div className="footer-founder-info">
                <strong className="footer-founder-name">Ankitosh Kumar</strong>
                <span className="footer-founder-role">Co-Founder &amp; Technology</span>
              </div>
              <div className="footer-founder-actions">
                <a href="tel:+916205570278" className="footer-call-btn">
                  📞 +91 6205570278
                </a>
                <a 
                  href="https://wa.me/916205570278?text=Hello%20Ankitosh,%20I%20want%20to%20discuss%20a%20project%20for%20my%20business." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="footer-wa-btn"
                  title="WhatsApp Ankitosh"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* COL 3: SOLUTIONS */}
          <div className="footer-col">
            <h4 className="footer-heading">Our Services</h4>
            <ul className="footer-nav-list">
              <li><Link href="/services">Web Development (&lt;/&gt;)</Link></li>
              <li><Link href="/services">Mobile App Development</Link></li>
              <li><Link href="/services">UI/UX Design Systems</Link></li>
              <li><Link href="/services">Cloud Solutions &amp; DevOps</Link></li>
              <li><Link href="/services">SEO &amp; Content Strategy</Link></li>
              <li><Link href="/services">Google &amp; Meta Ads</Link></li>
              <li><Link href="/services">Social Media Management</Link></li>
              <li><Link href="/services">Graphic Design &amp; Branding</Link></li>
            </ul>
          </div>

          {/* COL 4: QUICK NAVIGATION & PROPOSAL */}
          <div className="footer-col">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-nav-list">
              <li><Link href="/">Home Overview</Link></li>
              <li><Link href="/services">All Services</Link></li>
              <li><Link href="/#process">Our Process</Link></li>
              <li><Link href="/portfolio">Our Work (Portfolio)</Link></li>
              <li><Link href="/about">About Us &amp; Leadership</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
            <div style={{ marginTop: '20px' }}>
              <Link 
                href="/contact" 
                className="button primary" 
                style={{ width: '100%', padding: '11px 16px', fontSize: '13px', textAlign: 'center', display: 'inline-block' }}
              >
                Get a Proposal ↗
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT STRIP */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © {new Date().getFullYear()} <strong>Soft Tech Solution</strong>. All rights reserved. Your Growth, Our Mission.
          </p>
          <div className="footer-meta-links">
            <span>Founded by Aashutosh Kumar &amp; Ankitosh Kumar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
