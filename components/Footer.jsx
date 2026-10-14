import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="wrap footer-grid">
        <Link href="/" className="brand" aria-label="SoftTech Solution">
          <img 
            src="/soft-tech-logo-transparent.png" 
            alt="SoftTech Solution" 
            className="brand-logo-img" 
            style={{ width: '42px', height: '42px' }} 
          />
          <div className="brand-lockup">
            <span className="brand-shared-s">S</span>
            <div className="brand-text-stack">
              <span className="brand-top-text">
                oft<b className="brand-tech-highlight">Tech</b>
              </span>
              <span className="brand-bottom-text">
                olution
              </span>
            </div>
          </div>
        </Link>
        <p>
          Turning Your Ideas into Digital Success.<br />
          <strong style={{ color: '#fff' }}>Founder: Aashutosh Kumar</strong> (+91 9117696512)<br />
          <strong style={{ color: '#fff' }}>Co-Founder: Ankitosh Kumar</strong> (+91 6205570278)
        </p>
        <div className="footer-links">
          <Link href="/services">Services</Link>
          <Link href="/portfolio">Our Work</Link>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <small>
          © 2026 SoftTech Solution. All rights reserved.
        </small>
      </div>
    </footer>
  );
}

