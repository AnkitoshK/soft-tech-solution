const toggle = document.querySelector('.menu-toggle');
if (location.pathname !== '/' && !location.pathname.endsWith('index.html')) {
  const pageStyles = document.createElement('link');
  pageStyles.rel = 'stylesheet';
  pageStyles.href = 'pages.css';
  document.head.append(pageStyles);
}
const brandUpdate = document.createElement('link');
brandUpdate.rel = 'stylesheet';
brandUpdate.href = 'brand-update.css';
document.head.append(brandUpdate);
document.querySelectorAll('.brand').forEach(brand => {
  brand.innerHTML = '<img src="soft-tech-solution-logo.jpeg" alt="Soft Tech Solution logo"><span class="brand-name">Soft <b>Tech</b><small>Solution</small></span>';
});
const brandNameStyles = document.createElement('style');
brandNameStyles.textContent = '.brand{display:flex!important;align-items:center;gap:9px;line-height:1!important}.brand img{width:54px!important;height:54px!important;object-fit:contain}.brand-name{display:block;color:#23417b;font:800 17px Poppins;letter-spacing:-.8px;white-space:nowrap}.brand-name b{color:#e8752c}.brand-name small{font:800 17px Poppins;letter-spacing:-.8px;color:#47546b}.footer-grid .brand img{filter:none!important;width:50px!important;height:50px!important}.footer-grid .brand-name{color:#fff}.footer-grid .brand-name small{color:#d6dcec}';
document.head.append(brandNameStyles);
const phoneBrand = document.querySelector('.device .screen-nav b');
if (phoneBrand) phoneBrand.innerHTML = 'Soft <span>Tech</span> <small>Solution</small>';
const founderPhotoStyles = document.createElement('style');
founderPhotoStyles.textContent = '.device .screen-nav b{font-size:8px!important;white-space:nowrap}.device .screen-nav b small{font-size:7px;color:#fff}.founder-grid{grid-template-columns:250px 1fr!important;gap:65px!important}.founder-photo{width:220px!important;height:275px!important;border-radius:10px!important;box-shadow:10px 11px 0 #f2a12c!important;margin:auto!important}.founder-photo img{object-position:center 12%!important}@media(max-width:800px){.founder-grid{grid-template-columns:1fr!important;gap:32px!important}.founder-photo{margin:0!important;width:200px!important;height:250px!important}}';
document.head.append(founderPhotoStyles);
const storyLogo = document.querySelector('.story-logo');
if (storyLogo) {
  storyLogo.innerHTML = '<img src="soft-tech-solution-logo.jpeg" alt="Soft Tech Solution logo">';
  const storyLogoStyles = document.createElement('style');
  storyLogoStyles.textContent = '.story-logo{background:#fff!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;padding:14px!important}.story-logo img{width:100%;height:100%;object-fit:contain}';
  document.head.append(storyLogoStyles);
}
if (location.pathname.endsWith('about.html')) {
  const values = document.querySelector('.values');
  const founder = document.createElement('section');
  founder.className = 'founder section';
  founder.innerHTML = '<div class="wrap"><div class="section-head" style="margin-bottom:32px"><div><p class="eyebrow"><span></span> Leadership Team</p><h2>Meet the <em>Founders.</em></h2></div><p style="color:#6f7889;font-size:14px">The vision and energy steering Soft Tech Solution forward.</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;align-items:stretch;"><div style="background:#fff;border-radius:18px;padding:32px;box-shadow:0 12px 36px rgba(35,63,123,0.08);display:flex;flex-direction:column;align-items:center;text-align:center;border:1px solid #eef2f7;"><div style="width:190px;height:230px;border-radius:14px;overflow:hidden;box-shadow:0 10px 24px rgba(242,161,44,0.3);margin-bottom:20px;background:#243f7b;"><img src="ashutosh-kumar-founder.jpeg" alt="Ashutosh Kumar, Founder" style="width:100%;height:100%;object-fit:cover;object-position:center 12%;"></div><h3 style="font:700 24px Poppins;margin:0 0 4px;color:#233b78">Ashutosh Kumar</h3><p style="font:700 13px Poppins;color:#e47830;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px">Founder</p><p style="color:#6f7889;font-size:14px;line-height:1.7;margin-bottom:20px">“I started Soft Tech Solution with a simple belief: every business deserves a clear, powerful way to grow online. We pair creative ideas with practical digital strategy to help our clients build something meaningful.”</p><a class="button primary" href="contact.html" style="margin-top:auto">Work with us <span>→</span></a></div><div style="background:#fff;border-radius:18px;padding:32px;box-shadow:0 12px 36px rgba(35,63,123,0.08);display:flex;flex-direction:column;align-items:center;text-align:center;border:1px solid #eef2f7;"><div style="width:190px;height:230px;border-radius:14px;overflow:hidden;box-shadow:0 10px 24px rgba(31,125,185,0.3);margin-bottom:20px;background:#1f7db9;"><img src="ankitosh-kumar-cofounder.jpeg" alt="Ankitosh Kumar, Co-Founder" style="width:100%;height:100%;object-fit:cover;object-position:center top;"></div><h3 style="font:700 24px Poppins;margin:0 0 4px;color:#233b78">Ankitosh Kumar</h3><p style="font:700 13px Poppins;color:#1f7db9;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Co-Founder</p><div style="display:inline-flex;align-items:center;gap:6px;background:#eef5fa;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;color:#233b78;margin-bottom:14px"><span>📞</span> <a href=\"tel:+916205570278\" style=\"color:inherit;text-decoration:none\">+91 6205570278</a></div><p style="color:#6f7889;font-size:14px;line-height:1.7;margin-bottom:20px">“Empowering businesses through cutting-edge technology and data-driven marketing. Together, we engineer scalable digital growth that delivers real commercial impact.”</p><a class="button primary" href=\"tel:+916205570278\" style="margin-top:auto">Call Ankitosh <span>📞</span></a></div></div></div>';
  values.before(founder);
}
const nav = document.querySelector('.nav-links');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false');
}));
document.querySelectorAll('.contact-form').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const toast = document.querySelector('.toast');
  const button = form.querySelector('button[type=submit]');
  const original = button?.innerHTML;
  if (button) { button.disabled = true; button.innerHTML = 'Sending…'; }
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch('/api/enquiries', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to submit enquiry');
    toast.textContent = 'Thanks! Your enquiry has been received.';
    toast.classList.add('show');
    form.reset();
    setTimeout(() => toast.classList.remove('show'), 4000);
  } catch (error) {
    toast.textContent = error.message || 'Something went wrong. Please try again.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
  } finally {
    if (button) { button.disabled = false; button.innerHTML = original; }
  }
}));
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  document.querySelectorAll('.project').forEach(project => project.classList.toggle('hidden', filter !== 'all' && !project.dataset.type.includes(filter)));
}));
