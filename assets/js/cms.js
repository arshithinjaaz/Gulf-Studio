/* ============================================================
   Gulf Studio FZE LLC — CMS Content Loader
   Fetches /api/content and injects live data into pages.
   Falls back silently when the server is not running.
   ============================================================ */
(async function () {
  'use strict';

  /* CMS replaces DOM after main.js registers scroll-reveal — new .fade-up nodes must be shown */
  function revealInjected(root) {
    if (!root) return;
    root.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
  }

  let C;
  try {
    const r = await fetch('/api/content');
    if (!r.ok) return;
    C = await r.json();
  } catch { return; } // server not running — use static HTML

  /* ── 1. Simple text / src / href overrides via data-cms ── */
  document.querySelectorAll('[data-cms]').forEach(el => {
    const val = resolvePath(C, el.dataset.cms);
    if (val == null) return;
    // Skip hero image injection if a video is set — video replaces the img below
    if (el.dataset.cms === 'home.hero.image' && C.home?.hero?.video_url) return;
    if (el.tagName === 'IMG')  { el.src  = val; return; }
    if (el.tagName === 'A')    { el.href = val; return; }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { el.value = val; return; }
    el.textContent = val;
  });

  /* ── 1a. Rich HTML overrides via data-cms-html (supports <span>, <br>, <strong> etc.) ── */
  document.querySelectorAll('[data-cms-html]').forEach(el => {
    const val = resolvePath(C, el.dataset.cmsHtml);
    if (val != null) el.innerHTML = val;
  });

  /* ── 1b. Hero — autoplay video inline when video_url is set ── */
  const heroVideoUrl = C.home?.hero?.video_url;
  const heroWrap     = document.querySelector('.hero-video-wrap');
  const heroImg      = heroWrap?.querySelector('img[data-cms="home.hero.image"]');

  if (heroWrap && heroVideoUrl) {
    const posterSrc = C.home?.hero?.image || (heroImg?.src || '');
    const isYT  = /youtu\.be\/|youtube\.com/.test(heroVideoUrl);
    const isVM  = /vimeo\.com/.test(heroVideoUrl);
    const isDirect = !isYT && !isVM;

    if (isDirect) {
      // ── Direct file: swap img for <video autoplay muted loop> ──
      const vid = document.createElement('video');
      vid.src         = heroVideoUrl;
      vid.autoplay    = true;
      vid.muted       = true;
      vid.loop        = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', '');
      vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;';
      if (posterSrc) vid.poster = posterSrc;
      if (heroImg) heroImg.replaceWith(vid);

    } else {
      // ── YouTube / Vimeo: iframe autoplay muted background ──
      let embedUrl = '';
      if (isYT) {
        const m = heroVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
        if (m) embedUrl = `https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}&controls=0&rel=0&showinfo=0`;
      } else {
        const m = heroVideoUrl.match(/vimeo\.com\/(\d+)/);
        if (m) embedUrl = `https://player.vimeo.com/video/${m[1]}?autoplay=1&muted=1&loop=1&background=1`;
      }
      if (embedUrl) {
        const iframe = document.createElement('iframe');
        iframe.src              = embedUrl;
        iframe.allow            = 'autoplay; fullscreen';
        iframe.allowFullscreen  = true;
        iframe.style.cssText    = 'width:100%;height:100%;border:none;display:block;border-radius:inherit;';
        iframe.setAttribute('frameborder', '0');
        if (heroImg) heroImg.replaceWith(iframe);
      }
    }
  }

  /* ── 1d. Featured work tiles (homepage) — titles, badges, images ── */
  const fw = C.home?.featured_work;
  if (fw) {
    [0,1,2].forEach(i => {
      if (!fw[i]) return;
      const img = document.querySelector(`[data-cms="home.featured_work.${i}.image"]`);
      if (img && fw[i].image) img.src = fw[i].image;

      // Update badge and title text inside the same portfolio-item ancestor
      if (img) {
        const item = img.closest('.portfolio-item');
        if (item) {
          if (fw[i].badge) { const b = item.querySelector('.portfolio-badge'); if (b) b.textContent = fw[i].badge; }
          if (fw[i].title) { const h = item.querySelector('h3'); if (h) h.textContent = fw[i].title; }
        }
      }
    });
  }

  /* ── 2. Portfolio grid ── */
  const portfolioGrid = document.getElementById('cms-portfolio-grid');
  if (portfolioGrid && C.portfolio?.items?.length) {
    const items = C.portfolio.items;
    const videoIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
    const photoIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
    const playIcon  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    portfolioGrid.innerHTML = items.map((item, i) => {
      const delay     = ['','fade-up-delay-1','fade-up-delay-2','fade-up-delay-3','fade-up-delay-4','fade-up-delay-5'][i % 6] || '';
      const icon      = item.type === 'video' ? videoIcon : photoIcon;
      const hasVideo  = item.type === 'video' && item.video_url;
      const clickAttr = hasVideo ? `style="cursor:pointer;" onclick="openVideoModal('${item.video_url.replace(/'/g, '%27')}')"` : '';
      const playBtn   = hasVideo ? `<div class="portfolio-play-btn">${playIcon}</div>` : '';
      return `
        <div class="portfolio-item fade-up ${delay}" data-type="${item.type}" ${clickAttr}>
          <img src="${item.image}" alt="${item.title}" loading="lazy"/>
          <div class="portfolio-overlay"></div>
          <div class="portfolio-type-icon">${icon}</div>
          ${playBtn}
          <div class="portfolio-info">
            <div class="portfolio-badge">${item.category}</div>
            <h3>${item.title}</h3>
          </div>
        </div>`;
    }).join('');

    revealInjected(portfolioGrid);
    const countEl = document.querySelector('.portfolio-item-count');
    if (countEl && items.length) {
      countEl.innerHTML = `<strong>${items.length}</strong> curated projects`;
    }
  }

  /* ── 3. Blog grid ── */
  const blogGrid = document.getElementById('cms-blog-grid');
  if (blogGrid && C.blog?.posts?.length) {
    const calIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const userIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    const arrowIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    blogGrid.innerHTML = C.blog.posts.map((p, i) => {
      const delay = ['','fade-up-delay-1','fade-up-delay-2','fade-up-delay-3','fade-up-delay-4','fade-up-delay-5'][i % 6] || '';
      return `
        <div class="blog-card fade-up ${delay}">
          <div class="blog-card-img">
            <img src="${p.image}" alt="${p.title}" loading="lazy"/>
            <span class="blog-cat-badge">${p.category}</span>
          </div>
          <div class="blog-card-body">
            <div class="blog-meta">
              <span>${calIcon} ${p.date}</span>
              <span>${userIcon} ${p.author}</span>
            </div>
            <h3>${p.title}</h3>
            <p>${p.excerpt}</p>
            <a href="#" class="read-more">Read More ${arrowIcon}</a>
          </div>
        </div>`;
    }).join('');

    revealInjected(blogGrid);
  }

  /* ── 4. Pricing grid ── */
  const pricingGrid = document.getElementById('cms-pricing-grid');
  if (pricingGrid && C.pricing?.packages?.length) {
    const checkIcon = `<svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    const planIconById = {
      starter: `<div class="plan-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg></div>`,
      business: `<div class="plan-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>`,
      premium: `<div class="plan-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>`,
    };
    pricingGrid.innerHTML = C.pricing.packages.map((pkg, i) => {
      const featClass = pkg.featured ? ' featured' : '';
      const delay = ['','fade-up-delay-1','fade-up-delay-2'][i] || '';
      let btnClass = 'btn-outline';
      if (pkg.featured) btnClass = 'btn-teal';
      else if (pkg.id === 'premium') btnClass = 'btn-dark';
      const planIcon = planIconById[pkg.id] || '';
      return `
        <div class="pricing-card${featClass} fade-up ${delay}">
          ${pkg.badge ? `<div class="plan-badge">${pkg.badge}</div>` : ''}
          ${planIcon}
          <h3>${pkg.name}</h3>
          <p class="plan-desc">${pkg.description}</p>
          <div class="plan-price-area">
            <div class="plan-price-label">Pricing</div>
            <div class="plan-price-value">${pkg.price}</div>
            <div class="plan-price-note">${pkg.price_note}</div>
          </div>
          <ul class="plan-features">
            ${pkg.features.map(f => `<li class="plan-feature${pkg.featured ? ' teal-text' : ''}">${checkIcon}${f}</li>`).join('')}
          </ul>
          <a href="contact.html" class="btn ${btnClass} plan-btn">Choose Plan</a>
        </div>`;
    }).join('');

    revealInjected(pricingGrid);
  }

  /* ── 5. Services detail sections ── */
  const serviceItems = C.services?.items || [];
  serviceItems.forEach(svc => {
    const el = document.querySelector(`[data-cms-service="${svc.id}"]`);
    if (!el) return;
    const img = el.querySelector('.service-detail-img img');
    if (img && svc.image) { img.src = svc.image; img.alt = svc.title || img.alt; }
    const h2 = el.querySelector('.service-detail-content h2');
    if (h2 && svc.title) h2.textContent = svc.title;
    const desc = el.querySelector('.service-detail-content > p');
    if (desc && svc.description) desc.textContent = svc.description;
    const metaBoxes = el.querySelectorAll('.meta-box');
    if (metaBoxes[0]) {
      const h5 = metaBoxes[0].querySelector('h5');
      if (h5 && svc.meta1_title) h5.textContent = svc.meta1_title;
      const ul = metaBoxes[0].querySelector('.meta-list');
      if (ul && svc.meta1_items) ul.innerHTML = svc.meta1_items.split('\n').filter(i => i.trim()).map(i => `<li>${i.trim()}</li>`).join('');
    }
    if (metaBoxes[1]) {
      const h5 = metaBoxes[1].querySelector('h5');
      if (h5 && svc.meta2_title) h5.textContent = svc.meta2_title;
      const ul = metaBoxes[1].querySelector('.meta-list');
      if (ul && svc.meta2_items) ul.innerHTML = svc.meta2_items.split('\n').filter(i => i.trim()).map(i => `<li>${i.trim()}</li>`).join('');
    }
    const cta = el.querySelector('.service-detail-content .btn');
    if (cta && svc.cta_text) cta.textContent = svc.cta_text;
  });

  /* ── 6. Contact info & social ── */
  const sitePhone   = C.site?.phone;
  const siteEmail   = C.site?.email;
  const siteAddress = C.site?.address;
  const siteWA      = C.site?.whatsapp;
  if (sitePhone)   document.querySelectorAll('[data-cms="site.phone"]').forEach(el => el.textContent = sitePhone);
  if (siteEmail)   document.querySelectorAll('[data-cms="site.email"]').forEach(el => el.textContent = siteEmail);
  if (siteAddress) document.querySelectorAll('[data-cms="site.address"]').forEach(el => el.textContent = siteAddress);
  if (siteWA)      document.querySelectorAll('[data-cms="site.whatsapp_link"]').forEach(el => el.href = 'https://wa.me/' + siteWA);

  /* Social links */
  const soc = C.site?.social || {};
  if (soc.instagram) document.querySelectorAll('[data-cms="site.social.instagram"]').forEach(el => el.href = soc.instagram);
  if (soc.facebook)  document.querySelectorAll('[data-cms="site.social.facebook"]').forEach(el =>  el.href = soc.facebook);
  if (soc.youtube)   document.querySelectorAll('[data-cms="site.social.youtube"]').forEach(el =>   el.href = soc.youtube);
  if (soc.linkedin)  document.querySelectorAll('[data-cms="site.social.linkedin"]').forEach(el =>  el.href = soc.linkedin);

  /* ── 7. Hero stat counter ── */
  const statNum = C.home?.hero?.stat_number;
  if (statNum) {
    document.querySelectorAll('[data-count]').forEach(el => {
      el.dataset.count = statNum;
      el.textContent = statNum + (el.dataset.suffix || '');
    });
  }

  /* ── Shared video modal helpers (used by portfolio.html & index.html) ── */
  if (!window.openVideoModal) {
    window.openVideoModal = function(url) {
      if (!url) return;
      const overlay = document.getElementById('video-modal');
      if (!overlay) return;
      const inner = document.getElementById('video-modal-inner');
      Array.from(inner.children).forEach(c => { if (!c.classList.contains('video-modal-close')) c.remove(); });
      inner.insertAdjacentHTML('beforeend', window._buildVideoEmbed(url));
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    window._buildVideoEmbed = function(url) {
      const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
      if (yt) return `<iframe src="https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      const vm = url.match(/vimeo\.com\/(\d+)/);
      if (vm) return `<iframe src="https://player.vimeo.com/video/${vm[1]}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      return `<video src="${url}" controls autoplay playsinline></video>`;
    };
  }

  /* ── Helper ── */
  function resolvePath(obj, path) {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj) ?? null;
  }
})();
