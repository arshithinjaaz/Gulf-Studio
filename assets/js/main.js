/* ============================================================
   GULF STUDIO FZE LLC — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Navbar: scroll shadow + hide on scroll down / show on scroll up ── */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  if (navbar) {
    window.addEventListener('scroll', () => {
      const current = window.scrollY;
      navbar.classList.toggle('scrolled', current > 20);

      // Don't hide while mobile menu is open
      if (!document.getElementById('navLinks')?.classList.contains('open')) {
        if (current > lastScroll && current > 120) {
          navbar.classList.add('nav-hidden');
        } else {
          navbar.classList.remove('nav-hidden');
        }
      }
      lastScroll = current <= 0 ? 0 : current;
    }, { passive: true });
  }

  /* ── Active nav link ── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Mobile hamburger ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const overlay   = document.getElementById('navOverlay');

  function closeMenu() {
    hamburger?.classList.remove('open');
    navLinks?.classList.remove('open');
    overlay?.classList.remove('show');
    document.body.style.overflow = '';
    navbar?.classList.remove('nav-hidden');
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks?.classList.toggle('open');
    overlay?.classList.toggle('show');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  overlay?.addEventListener('click', closeMenu);
  navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  /* ── Scroll reveal (fade-up) ── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));

  /* ── Counter animation ── */
  function animateCounter(el) {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const suffix   = el.dataset.suffix || '';
    const start    = performance.now();
    const tick = ts => {
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

  /* ── Founder flip cards: tap to flip on touch devices ── */
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => {
      // Only intercept on touch-primary devices
      if (window.matchMedia('(hover: none)').matches) {
        card.classList.toggle('is-flipped');
      }
    });
  });

  /* ── FAQ accordion — smooth max-height ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all open items
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

      // Open clicked if it was closed
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Portfolio filter — delegation so CMS-replaced grid still works ── */
  const portfolioFilterRoot = document.querySelector('.portfolio-filters');
  if (portfolioFilterRoot) {
    portfolioFilterRoot.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      portfolioFilterRoot.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.portfolio-item[data-type]').forEach(item => {
        const show = filter === 'all' || item.dataset.type === filter;
        if (show) {
          item.classList.remove('hidden');
          item.style.display = 'block';
        } else {
          item.classList.add('hidden');
          setTimeout(() => {
            if (item.classList.contains('hidden')) item.style.display = 'none';
          }, 380);
        }
      });
    });
  }

  /* ── Contact form ── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn        = contactForm.querySelector('.form-submit');
      const successMsg = document.getElementById('formSuccess');

      btn.disabled     = true;
      btn.innerHTML    = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Sending…';

      setTimeout(() => {
        btn.disabled  = false;
        btn.innerHTML = 'Send Message <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        contactForm.reset();
        if (successMsg) {
          successMsg.classList.add('show');
          setTimeout(() => successMsg.classList.remove('show'), 5000);
        }
      }, 1600);
    });
  }

  /* ── Newsletter form ── */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = newsletterForm.querySelector('button[type="submit"]');
      btn.textContent = '✓ Subscribed!';
      btn.disabled    = true;
      setTimeout(() => {
        btn.textContent = 'Subscribe';
        btn.disabled    = false;
        newsletterForm.reset();
      }, 3000);
    });
  }

  /* ── Blog search ── */
  const blogSearch = document.getElementById('blogSearch');
  if (blogSearch) {
    blogSearch.addEventListener('input', () => {
      const q = blogSearch.value.toLowerCase();
      document.querySelectorAll('.blog-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = title.includes(q) ? 'block' : 'none';
      });
    });
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
        const top  = el.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Scroll-to-top button ── */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Add scroll-to-top button to DOM if not present ── */
  if (!document.getElementById('scrollTop')) {
    const btn = document.createElement('button');
    btn.id        = 'scrollTop';
    btn.className = 'scroll-top';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Stagger fade-up on service / blog cards ── */
  document.querySelectorAll('.services-grid .service-card, .blog-grid .blog-card, .pricing-grid .pricing-card').forEach((el, i) => {
    if (!el.classList.contains('fade-up')) {
      el.classList.add('fade-up');
      el.style.transitionDelay = `${i * 0.07}s`;
      revealObserver.observe(el);
    }
  });

})();
