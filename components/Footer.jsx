import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="wrap footer-grid">
        <Link href="/" className="brand" aria-label="softTech Solution">
          <img 
            src="/soft-tech-logo-transparent.png" 
            alt="softTech Solution" 
            className="brand-logo-img" 
            style={{ width: '42px', height: '42px' }} 
          />
          <span className="brand-name">
            <span className="brand-main" style={{ color: '#ffffff' }}>soft<b style={{ color: 'var(--orange)' }}>Tech</b></span>
            <span className="brand-sub" style={{ color: '#a4b3d1' }}>Solution</span>
          </span>
        </Link>
        <p>
          Turning Your Ideas into Digital Success.<br />
          <strong style={{ color: '#fff' }}>Founder: Aashutosh Kumar</strong> (+91 9876543753)<br />
          <strong style={{ color: '#fff' }}>Co-Founder: Ankitosh Kumar</strong> (+91 6205570278)
        </p>
        <div className="footer-links">
          <Link href="/services">Services</Link>
          <Link href="/portfolio">Our Work</Link>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/admin/login" style={{ opacity: 0.75 }}>Admin Login</Link>
        </div>
        <small>
          © 2026 softTech Solution. All rights reserved.<br />
          <a 
            href="https://soft-tech-solution-ebon.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#a4b3d1', textDecoration: 'underline' }}
          >
            soft-tech-solution-ebon.vercel.app
          </a>
        </small>
      </div>
    </footer>
  );
}
