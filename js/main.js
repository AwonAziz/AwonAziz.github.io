/* file: js/main.js */
  document.addEventListener('DOMContentLoaded', () => {
    // ---- NAV mobile toggle (optional) ----
    const navToggle = document.createElement('button');
    navToggle.className = 'Nav__mobile-toggle';
    navToggle.textContent = '☰';
    document.querySelector('.Nav').appendChild(navToggle);
    navToggle.addEventListener('click', () => {
      document.querySelector('.Nav__links').classList.toggle('show');
    });

    // ---- Fade‑in animations on scroll ----
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 }); // 15% of element visible

    // Observe all sections that should animate
    document.querySelectorAll('.Section, .Card, .Blog-Post, .Timeline__item, .Timeline__item,
  .Hero__content').forEach(section => observer.observe(section));

    // ---- Footer year ----
    document.getElementById('year').textContent = new Date().getFullYear();

    // ---- Smooth scroll for internal links (already in CSS) ----
  });
