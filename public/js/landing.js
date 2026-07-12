// ProjectPilot — landing.js
// Scroll-driven reveal animations, navbar blur state, hero parallax tilt.

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.landing-nav');

  /* ---------- Theme Engine ---------- */
  const THEME_KEY = 'projectpilot_theme';
  const themeToggle = document.getElementById('themeToggle');

  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    } else {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    }
  };

  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  };

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode', !isLight);
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  };

  initTheme();
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  /* Navbar blur-on-scroll */
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Dynamic sticky top and wrapper height for Features section to ensure complete view on scroll */
  const adjustFeatureSticky = () => {
    const featureSection = document.querySelector('.feature-section');
    const wrapper = document.querySelector('.feature-sticky-wrapper');
    if (!featureSection || !wrapper) return;
    
    // Disable sticky behavior on tablets/mobiles where grid items stack vertically
    if (window.innerWidth <= 900) {
      wrapper.style.height = 'auto';
      featureSection.style.removeProperty('--feature-sticky-top');
      return;
    }
    
    const H = window.innerHeight;
    const navbarHeight = 80;
    const paddingBuffer = 24; // safety margin
    
    // Clear wrapper height temporarily to get the natural height of features section
    wrapper.style.height = 'auto';
    const E_H = featureSection.getBoundingClientRect().height;
    
    // Set a scroll reading window of 350px so it remains stuck in view before design section overlaps
    const scrollSpace = 350;
    wrapper.style.height = `${E_H + scrollSpace}px`;
    
    if (E_H > H - navbarHeight) {
      // Taller than viewport - stick so that the bottom is fully visible when scrolled
      const stickyTop = H - E_H - paddingBuffer;
      featureSection.style.setProperty('--feature-sticky-top', `${stickyTop}px`);
    } else {
      // Shorter than viewport - stick normally at navbar height
      featureSection.style.setProperty('--feature-sticky-top', `${navbarHeight}px`);
    }
  };
  
  adjustFeatureSticky();
  window.addEventListener('resize', adjustFeatureSticky);
  window.addEventListener('load', adjustFeatureSticky);

  /* Intersection Observer scroll reveal */
  const revealEls = document.querySelectorAll('.reveal, .section-reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    io.observe(el);
  });

  /* ---------- Word-by-word heading reveal ---------- */
  document.querySelectorAll('.word-reveal-heading').forEach((heading) => {
    const text = heading.textContent.trim();
    const words = text.split(' ');
    heading.textContent = '';
    heading.setAttribute('aria-label', text);
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.classList.add('word-token');
      span.textContent = word + (i < words.length - 1 ? '\u00a0' : '');
      span.style.transitionDelay = `${0.1 + i * 0.07}s`;
      heading.appendChild(span);
    });

    const wordIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('words-in-view');
          wordIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });
    wordIo.observe(heading);
  });

  /* ---------- Slide-up reveal ---------- */
  const slideEls = document.querySelectorAll('.reveal-slide-up');
  const slideIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('slide-in-view');
        slideIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  slideEls.forEach((el) => slideIo.observe(el));

  /* Safety net: if for any reason an element never intersects
     (fast scroll, restored scroll position, IO quirks), force it
     visible after a short delay so content is never stuck hidden. */
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in-view), .section-reveal:not(.in-view)').forEach((el) => {
      el.classList.add('in-view');
    });
    document.querySelectorAll('.word-reveal-heading:not(.words-in-view)').forEach((el) => {
      el.classList.add('words-in-view');
    });
    document.querySelectorAll('.reveal-slide-up:not(.slide-in-view)').forEach((el) => {
      el.classList.add('slide-in-view');
    });
  }, 2500);

  /* Smooth anchor scroll for nav links */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* Hero device frame parallax tilt on mouse move (desktop only) */
  const heroVisual = document.querySelector('.hero-visual');
  const deviceFrame = document.querySelector('.device-frame');
  if (heroVisual && deviceFrame && window.matchMedia('(hover: hover)').matches) {
    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      deviceFrame.style.transform =
        `perspective(1200px) rotateY(${-8 + x * 10}deg) rotateX(${4 - y * 8}deg)`;
    });
    heroVisual.addEventListener('mouseleave', () => {
      deviceFrame.style.transform = 'perspective(1200px) rotateY(-8deg) rotateX(4deg)';
    });
  }

  /* Liquid glass navbar: cursor-tracked shine/glow */
  const navGlass = document.querySelector('.landing-nav .nav-inner.liquid-glass');
  if (navGlass && window.matchMedia('(hover: hover)').matches) {
    navGlass.addEventListener('mousemove', (e) => {
      const rect = navGlass.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      navGlass.style.setProperty('--mx', `${x}%`);
      navGlass.style.setProperty('--my', `${y}%`);
    });
    navGlass.addEventListener('mouseleave', () => {
      navGlass.style.setProperty('--mx', '50%');
      navGlass.style.setProperty('--my', '50%');
    });
  }

  /* CTA card: bypass any scroll transforms on hover, peeking characters stay stable */
  const ctaPanel = document.querySelector('.cta-panel');
  if (ctaPanel) {
    ctaPanel.addEventListener('mouseenter', () => ctaPanel.classList.add('is-hovering'));
    ctaPanel.addEventListener('mouseleave', () => ctaPanel.classList.remove('is-hovering'));
  }
});
