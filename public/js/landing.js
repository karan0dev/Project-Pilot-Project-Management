document.addEventListener("DOMContentLoaded", () => {
  const meterFill = document.getElementById("scroll-meter-fill");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const tiltTargets = Array.from(document.querySelectorAll("[data-tilt]"));
  const authLinks = document.getElementById("landing-auth-links");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("landing-nav");

  if (authLinks && typeof API !== "undefined" && API.isAuthenticated()) {
    authLinks.innerHTML = '<a class="primary-action compact" href="/dashboard">Go to Dashboard</a>';
  }

  const updateScrollMeter = () => {
    if (!meterFill) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    meterFill.style.width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
  };

  const updateActiveNav = () => {
    const anchorPoint = window.scrollY + window.innerHeight * 0.32;
    let activeId = sections[0] ? sections[0].id : "";

    sections.forEach((section) => {
      if (section.offsetTop <= anchorPoint) {
        activeId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("active", href === `#${activeId}`);
    });
  };

  const header = document.getElementById("site-header");

  const handleHeaderScroll = () => {
    if (!header) return;
    header.classList.remove("scrolled");
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation");
      });
    });
  }
  
  const ctaSection = document.getElementById("cta");
  const peekingLeft = document.querySelector(".peeking-left");
  const peekingRight = document.querySelector(".peeking-right");

  const handleCtaScroll = () => {
    if (!ctaSection || !peekingLeft || !peekingRight) return;
    peekingLeft.style.transform = "";
    peekingRight.style.transform = "";
  };

  const onScroll = () => {
    updateScrollMeter();
    updateActiveNav();
    handleHeaderScroll();
    handleCtaScroll();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  tiltTargets.forEach((target) => {
    target.addEventListener("mousemove", (event) => {
      if (window.matchMedia("(max-width: 720px)").matches) return;

      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      target.style.setProperty("--tilt-x", `${x * 7}deg`);
      target.style.setProperty("--tilt-y", `${y * -7}deg`);
    });

    target.addEventListener("mouseleave", () => {
      target.style.setProperty("--tilt-x", "0deg");
      target.style.setProperty("--tilt-y", "0deg");
    });
  });
});
