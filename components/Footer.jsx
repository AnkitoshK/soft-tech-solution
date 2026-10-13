import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="wrap footer-grid">
        <Link href="/" className="brand" aria-label="Soft Tech Solution">
          <img 
            src="/soft-tech-solution-logo.jpeg" 
            alt="Soft Tech Solution" 
            className="brand-logo-img" 
            style={{ width: '44px', height: '44px' }} 
          />
          <span className="brand-name">
            Soft <b style={{ color: 'var(--orange)' }}>Tech</b>
            <small style={{ color: '#a4b3d1' }}>Solution</small>
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
        <small>© 2026 Soft Tech Solution. All rights reserved.<br />www.softtechsolution.vercel.app</small>
      </div>
    </footer>
  );
}
