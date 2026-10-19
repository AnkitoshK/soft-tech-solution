import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import Testimonials from '@/components/Testimonials';

export default function HomePage() {
  const officialServices = [
    { title: 'Web Development', icon: '</>', desc: 'High-performance Next.js & React apps, custom fullstack portals, and responsive websites.' },
    { title: 'Mobile App Development', icon: '📱', desc: 'Native & cross-platform iOS & Android mobile applications with offline sync.' },
    { title: 'UI/UX Design', icon: '✒️', desc: 'Figma wireframing, high-converting prototypes, and interactive user experiences.' },
    { title: 'Cloud Solutions', icon: '☁️', desc: 'Serverless architectures, cloud databases, Vercel & AWS deployments.' },
    { title: 'IT Support & More', icon: '⚙️', desc: '24/7 technical consulting, maintenance, software bug fixes, and security patches.' },
    { title: 'Digital Marketing', icon: '📢', desc: 'Full-funnel inbound marketing campaigns that drive measurable qualified traffic.' },
    { title: 'SEO (Search Engine Optimization)', icon: '📈', desc: 'Keyword strategy, technical audits, and on-page SEO to dominate Google search results.' },
    { title: 'Social Media Management', icon: '📸', desc: 'Engaging content calendars, reels production, and community growth across Instagram & LinkedIn.' },
    { title: 'Google / Meta Ads', icon: '🎯', desc: 'High-ROAS targeted paid advertising on Google Search, YouTube, Instagram & Facebook.' },
    { title: 'Graphics / Social Media Design', icon: '🎨', desc: 'Standout logos, branding design kits, marketing banners, and visual identities.' },
  ];

  return (
    <>
      {/* HERO SECTION */}
      <section id="home" className="hero">
        <div className="orb orb-one"></div>
        <div className="orb orb-two"></div>
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span></span> Soft Tech Solution · IDEAS | CODE | SOLUTIONS
            </p>
            <h1>
              Turning Your Ideas Into<br />
              <em>Digital Success.</em>
            </h1>
            <p className="hero-text">
              More Visibility | More Traffic | More Growth. We combine strategic marketing, memorable branding, and high-performing websites to help your business stand out, generate qualified leads, and scale sustainably.
            </p>
            
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', margin: '16px 0 24px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ color: 'var(--orange)' }}>✓ Creative Solutions</span>
              <span style={{ color: 'var(--blue)' }}>✓ Expert Team</span>
              <span style={{ color: '#16a34a' }}>✓ On-Time Delivery</span>
              <span style={{ color: 'var(--purple)' }}>✓ 100% Client Satisfaction</span>
            </div>

            <div className="hero-actions">
              <Link className="button primary" href="#contact">
                Get a free consultation <span>→</span>
              </Link>
              <Link className="play-link" href="/portfolio">
                <b>▶</b> See our work
              </Link>
            </div>
            
            <div className="hero-proof">
              <div className="avatars">
                <span>AK</span>
                <span>AK</span>
                <span>RS</span>
                <span>+</span>
              </div>
              <p>
                <strong>100+ businesses</strong><br />
                trust Soft Tech Solution to grow online
              </p>
            </div>
          </div>

          <div className="hero-visual" aria-label="Digital marketing performance preview">
            <div className="glow-ring"></div>
            <div className="spark s1">✦</div>
            <div className="spark s2">✦</div>
            <div className="growth-card">
              <div className="chart-label">
                <span>Campaign growth</span>
                <b>+148%</b>
              </div>
              <div className="bars">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              </div>
              <div className="chart-months">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
              </div>
            </div>
            <div className="device">
              <div className="device-top">
                <span></span><span></span><span></span>
              </div>
              <div className="device-screen">
                <div className="screen-nav">
                  <b>Soft <span>Tech</span> <small style={{ color: '#fff', fontSize: '7px' }}>Solution</small></b>
                  <i></i><i></i>
                </div>
                <h4>Grow digitally.<br /><em>Lead confidently.</em></h4>
                <div className="mini-chart">
                  <i></i><i></i><i></i><i></i><i></i>
                </div>
                <div className="screen-stat">
                  <span>Qualified leads</span>
                  <strong>2,480 <em>↑ 32%</em></strong>
                </div>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon">↗</span>
              <p>New leads<br /><b>+38.6%</b></p>
            </div>
          </div>
        </div>

        <div className="wrap logo-strip">
          <p>POWERING GROWTH FOR FORWARD-THINKING BRANDS</p>
          <div>
            <span>Venturely</span>
            <span>NorthStar</span>
            <span>BRIGHTLAB</span>
            <span>Urban+Co</span>
            <span>Alta</span>
          </div>
        </div>
      </section>

      {/* OUR SERVICES SECTION (FROM FLYER) */}
      <section id="services" className="services section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow"><span></span> What we do</p>
              <h2>Our Core <em>Services.</em></h2>
            </div>
            <p>Smart, practical digital solutions engineered around your business goals. Everything you need to turn your ideas into digital success.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {officialServices.map((srv, idx) => (
              <article 
                key={srv.title}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e7edf5',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 18px rgba(35, 63, 120, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div 
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: idx % 2 === 0 ? '#e4f4f9' : '#fff0e5',
                      color: idx % 2 === 0 ? '#247fb8' : '#e67831',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '20px',
                      fontWeight: 800,
                    }}
                  >
                    {srv.icon}
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', lineHeight: 1.3 }}>{srv.title}</h3>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                  {srv.desc}
                </p>
                <Link 
                  href="/services" 
                  style={{ marginTop: 'auto', fontSize: '12px', fontWeight: 700, color: 'var(--orange)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Learn more →
                </Link>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link className="button primary" href="/services">
              View All 10 Services in Detail <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* MEET THE FOUNDERS SECTION (AASHUTOSH LEFT, ANKITOSH RIGHT) */}
      <section className="section" style={{ background: '#fff7f0' }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow"><span></span> Executive Leadership</p>
              <h2>Meet the <em>Founders.</em></h2>
            </div>
            <p>
              Direct accessibility and technical vision guiding every project at Soft Tech Solution.
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
                “With an MCA degree and software engineering experience at Railworld, I founded Soft Tech Solution in September 2026. Every business deserves authentic, reliable digital growth built on disciplined architecture and measurable customer acquisition.”
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
                “Armed with an MCA degree and enterprise software engineering experience at Tata Power, I lead our technical architecture. We engineer robust, modern Next.js applications and cloud infrastructures built to convert traffic into scalable business revenue.”
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

      {/* PROCESS SECTION */}
      <section id="process" className="process section">
        <div className="wrap">
          <div className="section-head centered">
            <p className="eyebrow"><span></span> Our approach</p>
            <h2>A simple roadmap to<br /><em>predictable growth.</em></h2>
          </div>
          <div className="steps">
            <article>
              <b>01</b>
              <span>⌁</span>
              <h3>Discover</h3>
              <p>We analyze your target market, competitors, and growth bottlenecks.</p>
            </article>
            <article>
              <b>02</b>
              <span>◫</span>
              <h3>Strategize</h3>
              <p>We engineer a personalized campaign and conversion architecture.</p>
            </article>
            <article>
              <b>03</b>
              <span>↗</span>
              <h3>Launch</h3>
              <p>We deploy high-converting creative, websites, and paid ad funnels.</p>
            </article>
            <article>
              <b>04</b>
              <span>◌</span>
              <h3>Optimize</h3>
              <p>We continuously analyze metrics to lower CAC and amplify ROI.</p>
            </article>
          </div>
        </div>
      </section>

      {/* CASE STUDIES PREVIEW */}
      <section id="work" className="work section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow"><span></span> Selected work</p>
              <h2>Results that speak<br /><em>for themselves.</em></h2>
            </div>
            <Link className="button outline" href="/portfolio">
              View all work <span>→</span>
            </Link>
          </div>
          <div className="case-grid">
            <article className="case-case blue-case">
              <div className="case-circle"></div>
              <p className="case-tag">Next.js Web App · Fleet Dispatch · Online Booking</p>
              <h3>SoftRide Solutions: Scaling online vehicle bookings by +240%.</h3>
              <p style={{ color: '#eef5fa', fontSize: '13px', marginBottom: '20px' }}>
                Engineered an enterprise vehicle booking and fleet reservation website with real-time route estimates, Razorpay checkout, and automated driver dispatch.
              </p>
              <Link href="/portfolio">View case study <span>↗</span></Link>
            </article>

            <article className="case-case orange-case">
              <p className="case-tag">AI Automation · NLP · Support Ticketing Tool</p>
              <h3>Workmate AI: Smart ticketing tool cutting turnaround by 72%.</h3>
              <p style={{ color: '#fff', fontSize: '13px', marginBottom: '20px' }}>
                Architected an intelligent ticketing and customer support desk featuring NLP auto-categorization, priority technician routing, and live SLA analytics.
              </p>
              <Link href="/portfolio">View case study <span>↗</span></Link>
            </article>
          </div>
        </div>
      </section>

      {/* DELIVERED CLIENT SOLUTIONS & TESTIMONIALS */}
      <Testimonials />


      {/* CONTACT SECTION */}
      <section id="contact" className="contact section">
        <div className="wrap contact-grid">
          <div>
            <p className="eyebrow light"><span></span> Let’s build something great</p>
            <h2>Ready to grow<br /><em>with purpose?</em></h2>
            <p style={{ color: '#c6d1e2', fontSize: '15px', lineHeight: '1.8', margin: '20px 0 25px' }}>
              Tell us a little about your business goals. We’ll bring the strategy, technical execution, and creative energy.
            </p>
            
            <div className="contact-method">
              <span>✆</span>
              <div>
                <small>Call or WhatsApp (Founder: Aashutosh Kumar)</small>
                <strong><a href="tel:+919117696512" style={{ color: '#ffffff', textDecoration: 'none' }}>+91 9117696512</a></strong>
              </div>
            </div>

            <div className="contact-method">
              <span>✆</span>
              <div>
                <small>Call or WhatsApp (Co-Founder: Ankitosh Kumar)</small>
                <strong><a href="tel:+916205570278" style={{ color: '#ffffff', textDecoration: 'none' }}>+91 6205570278</a></strong>
              </div>
            </div>

            <div className="contact-method">
              <span>✉</span>
              <div>
                <small>Send us an email</small>
                <strong><a href="mailto:softtechsolution@gmail.com" style={{ color: '#ffffff', textDecoration: 'none' }}>softtechsolution@gmail.com</a></strong>
              </div>
            </div>

            <div className="contact-method">
              <span>⏰</span>
              <div>
                <small>Consultation Hours</small>
                <strong style={{ color: '#ffffff' }}>Mon – Sat, 9:00 AM – 7:30 PM IST</strong>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
