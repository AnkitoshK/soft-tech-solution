import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contact Us | Soft Tech Solution',
  description: 'Get in touch with Soft Tech Solution. Call Founder Aashutosh Kumar at +91 9876543753 or Co-Founder Ankitosh Kumar at +91 6205570278.',
};

export default function ContactPage() {
  const faqs = [
    {
      q: 'How quickly can we get started?',
      a: 'After an initial discovery consultation with Founder Aashutosh Kumar or Co-Founder Ankitosh Kumar, we formulate a customized implementation roadmap within 24 to 48 hours. Most projects kick off within 1 to 2 weeks.',
    },
    {
      q: 'What core services do you offer?',
      a: 'We offer full-cycle solutions across 10 areas: Web Development, Mobile App Development, UI/UX Design, Cloud Solutions, IT Support & More, Digital Marketing, SEO, Social Media Management, Google / Meta Ads, and Graphics / Social Media Design.',
    },
    {
      q: 'Do you offer customized packages for startups and businesses?',
      a: 'Yes, absolutely. We tailor every contract around your immediate stage, growth bottlenecks, and commercial objectives rather than locking you into rigid retainers.',
    },
    {
      q: 'How are client reporting and communication handled?',
      a: 'We believe in complete transparency. You get a direct WhatsApp channel and scheduled weekly sprint check-ins with the founders, accompanied by real-time conversion and traffic analytics.',
    },
  ];

  return (
    <>
      <section className="contact-page" style={{ background: 'linear-gradient(120deg, #f5faff, #fff8f2)', padding: '90px 0 70px' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '80px', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">
              <span></span> Start a conversation · IDEAS | CODE | SOLUTIONS
            </p>
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 56px)', marginBottom: '16px' }}>
              Turning Your Ideas Into<br /><em>Digital Success.</em>
            </h1>
            <p style={{ color: '#6e7889', fontSize: '16px', lineHeight: '1.8', maxWidth: '480px', marginBottom: '32px' }}>
              Tell us what you are building, scaling, or hoping to fix. Founder Aashutosh Kumar and Co-Founder Ankitosh Kumar review every inquiry personally.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* FOUNDER: AASHUTOSH KUMAR */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff0e5', color: '#e67831', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                  ✆
                </span>
                <div>
                  <small style={{ display: 'block', fontSize: '11px', color: '#8590a0', fontWeight: 600 }}>Founder Direct Line</small>
                  <b style={{ fontSize: '15px', color: '#233453' }}>
                    <a href="tel:+919876543753" style={{ textDecoration: 'none', color: 'inherit' }}>+91 9876543753</a>
                  </b>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--orange)', fontWeight: 600 }}>Aashutosh Kumar (Founder)</span>
                </div>
              </div>

              {/* CO-FOUNDER: ANKITOSH KUMAR */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e8f3fa', color: '#277fb8', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                  ✆
                </span>
                <div>
                  <small style={{ display: 'block', fontSize: '11px', color: '#8590a0', fontWeight: 600 }}>Co-Founder Direct Line</small>
                  <b style={{ fontSize: '15px', color: '#233453' }}>
                    <a href="tel:+916205570278" style={{ textDecoration: 'none', color: 'inherit' }}>+91 6205570278</a>
                  </b>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--blue)', fontWeight: 600 }}>Ankitosh Kumar (Co-Founder)</span>
                </div>
              </div>

              {/* EMAIL */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f0ebf8', color: '#7253a3', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                  ✉
                </span>
                <div>
                  <small style={{ display: 'block', fontSize: '11px', color: '#8590a0', fontWeight: 600 }}>Email our leadership</small>
                  <b style={{ fontSize: '15px', color: '#233453' }}>
                    <a href="mailto:softtechsolution@gmail.com" style={{ textDecoration: 'none', color: 'inherit' }}>softtechsolution@gmail.com</a>
                  </b>
                </div>
              </div>

              {/* WEBSITE */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#eaf7ef', color: '#16a34a', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                  🌐
                </span>
                <div>
                  <small style={{ display: 'block', fontSize: '11px', color: '#8590a0', fontWeight: 600 }}>Official Website</small>
                  <b style={{ fontSize: '14px', color: '#233453' }}>www.softtechsolution.vercel.app</b>
                </div>
              </div>
            </div>

            {/* QUICK WHATSAPP CHIPS */}
            <div style={{ marginTop: '36px', padding: '24px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e5ebf1', maxWidth: '440px' }}>
              <b style={{ display: 'block', fontSize: '14px', color: 'var(--navy)', marginBottom: '8px' }}>⚡ Fast Track WhatsApp Support</b>
              <p style={{ fontSize: '13px', color: '#667085', margin: '0 0 16px', lineHeight: 1.6 }}>
                Message our founders directly on WhatsApp for an immediate response:
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a 
                  href="https://wa.me/919876543753?text=Hello%20Aashutosh,%20I%20want%20to%20discuss%20a%20project%20for%20my%20business." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="button primary"
                  style={{ flex: 1, padding: '10px 14px', fontSize: '12px' }}
                >
                  WhatsApp Aashutosh 💬
                </a>
                <a 
                  href="https://wa.me/916205570278?text=Hello%20Ankitosh,%20I%20want%20to%20discuss%20a%20project%20for%20my%20business." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="button secondary"
                  style={{ flex: 1, padding: '10px 14px', fontSize: '12px' }}
                >
                  WhatsApp Ankitosh 💬
                </a>
              </div>
            </div>
          </div>

          <ContactForm isLarge={true} />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="section" style={{ background: '#ffffff' }}>
        <div className="wrap" style={{ maxWidth: '800px', margin: 'auto' }}>
          <p className="eyebrow">
            <span></span> Helpful Answers
          </p>
          <h2 style={{ fontSize: '38px', marginBottom: '32px' }}>
            A few things you might<br /><em>want to know.</em>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {faqs.map((f, i) => (
              <details 
                key={i} 
                style={{
                  borderTop: '1px solid #e0e6ed',
                  padding: '20px 0',
                  borderBottom: i === faqs.length - 1 ? '1px solid #e0e6ed' : 'none',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '16px', color: '#233453', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{f.q}</span>
                  <span style={{ color: 'var(--orange)', fontSize: '20px' }}>+</span>
                </summary>
                <p style={{ marginTop: '14px', color: '#6d7788', fontSize: '14px', lineHeight: 1.8 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
