'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide Navbar only from admin section (/admin, /admin/login, etc.)
  if (pathname && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return null;
  }

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span className="topbar-slogan">
            ✦ Transforming Theoretical Logic into Scalable Digital Solutions · IDEAS | CODE | SOLUTIONS ⚡
          </span>
          <Link href="/contact" onClick={closeMenu}>
            Book a free strategy call <span>→</span>
          </Link>
        </div>
      </div>

      <header className="site-header">
        <div className="wrap nav">
          <Link href="/" className="brand" onClick={closeMenu} aria-label="SoftTech Solution Home">
            <img 
              src="/soft-tech-logo-transparent.png" 
              alt="SoftTech Solution" 
              className="brand-logo-img"
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

          <button 
            className="menu-toggle" 
            onClick={toggleMenu} 
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <span style={{ transform: isOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: isOpen ? 0 : 1 }}></span>
            <span style={{ transform: isOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
          </button>

          <nav className={`nav-links ${isOpen ? 'open' : ''}`}>
            <Link 
              href="/" 
              className={pathname === '/' ? 'active' : ''} 
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link 
              href="/services" 
              className={pathname === '/services' ? 'active' : ''} 
              onClick={closeMenu}
            >
              Services
            </Link>
            <Link 
              href="/#process" 
              onClick={closeMenu}
            >
              Our Process
            </Link>
            <Link 
              href="/portfolio" 
              className={pathname === '/portfolio' ? 'active' : ''} 
              onClick={closeMenu}
            >
              Our Work
            </Link>
            <Link 
              href="/about" 
              className={pathname === '/about' ? 'active' : ''} 
              onClick={closeMenu}
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className="nav-cta" 
              onClick={closeMenu}
            >
              Get a Proposal ↗
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
