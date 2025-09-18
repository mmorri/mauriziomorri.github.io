document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const darkModeToggle = document.getElementById('darkModeToggle');

  if (darkModeToggle) {
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference === 'enabled') {
      body.classList.add('dark-mode');
      darkModeToggle.textContent = '☀️';
    }

    darkModeToggle.addEventListener('click', () => {
      const isDark = body.classList.toggle('dark-mode');
      darkModeToggle.textContent = isDark ? '☀️' : '🌙';

      if (isDark) {
        localStorage.setItem('darkMode', 'enabled');
      } else {
        localStorage.removeItem('darkMode');
      }
    });
  }

  const navLinks = document.querySelectorAll('nav a, .footer-section a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      link.addEventListener('click', event => {
        const target = document.querySelector(href);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  });

  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectItems = document.querySelectorAll('.project-list');

  if (filterButtons.length) {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));

        projectItems.forEach(item => {
          const matches = filter === 'all' || item.dataset.category === filter;
          item.style.display = matches ? 'block' : 'none';
        });
      });
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const statusElement = contactForm.querySelector('.form-status');

    contactForm.addEventListener('submit', event => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);
      const hasEmptyField = Object.values(data).some(value => !value.trim());

      if (hasEmptyField) {
        if (statusElement) {
          statusElement.textContent = 'Please fill in all fields before sending your message.';
          statusElement.classList.remove('success');
          statusElement.classList.add('error');
        }
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(data.email)) {
        if (statusElement) {
          statusElement.textContent = 'Please enter a valid email address.';
          statusElement.classList.remove('success');
          statusElement.classList.add('error');
        }
        return;
      }

      contactForm.reset();

      if (statusElement) {
        statusElement.textContent = 'Thanks for reaching out. I will get back to you shortly.';
        statusElement.classList.remove('error');
        statusElement.classList.add('success');
      }
    });
  }
});
