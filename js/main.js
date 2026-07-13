/* file: js/main.js */
  document.addEventListener('DOMContentLoaded', () => {
    // ---- NAV toggle for mobile ----
    const navToggle = document.createElement('button');
    navToggle.className = 'Nav__mobile-toggle';
    navToggle.innerHTML = '☰';
    document.querySelector('.Nav').appendChild(navToggle);
    navToggle.addEventListener('click', () => {
      document.querySelector('.Nav__links').classList.toggle('show');
    });

    // ---- Animate skill chips on scroll (optional) ----
    const chips = document.querySelectorAll('.Skill-Chip');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.style.opacity = 1;
      });
    }, {threshold: 0.5});
    chips.forEach(c => { c.style.opacity = 0; observer.observe(c); });

    // ---- Current year in footer ----
    document.getElementById('year').textContent = new Date().getFullYear();
  })
