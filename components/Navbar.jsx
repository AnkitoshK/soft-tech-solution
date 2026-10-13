'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span>
            ✦ IDEAS | CODE | SOLUTIONS · Founder: Aashutosh (+91 9876543753) · Co-Founder: Ankitosh (+91 6205570278)
          </span>
          <Link href="/contact" onClick={closeMenu}>
            Book a free strategy call <span>→</span>
          </Link>
        </div>
      </div>

      <header className="site-header">
        <div className="wrap nav">
          <Link href="/" className="brand" onClick={closeMenu} aria-label="Soft Tech Solution Home">
            <img 
              src="/soft-tech-solution-logo.jpeg" 
              alt="Soft Tech Solution" 
              className="brand-logo-img"
            />
            <span className="brand-name">
              Soft <b>Tech</b>
              <small>Solution</small>
            </span>
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
