document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initSmoothScroll();
  initProjectsSection();
  initContactForm();
});

function initDarkMode() {
  const body = document.body;
  const darkModeToggle = document.getElementById('darkModeToggle');

  if (!darkModeToggle) {
    return;
  }

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

function initSmoothScroll() {
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
}

function initProjectsSection() {
  const projectGrid = document.getElementById('projectGrid');
  const projectFilters = document.getElementById('projectFilters');
  const statusElement = document.getElementById('projectsStatus');

  if (!projectGrid || !projectFilters || !statusElement) {
    return;
  }

  const apiUrl = 'https://api.github.com/users/mmorri/repos?per_page=100&sort=updated';
  const categories = new Set();

  setStatus('Loading repositories...', false);

  fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  })
    .then(async response => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API rate limit reached. Please try again later or open the repositories on GitHub.');
        }
        throw new Error('Unable to load repositories right now.');
      }
      return response.json();
    })
    .then(repositories => {
      const publicRepos = repositories.filter(repo => !repo.archived && !repo.disabled);

      if (!publicRepos.length) {
        setStatus('No public repositories available right now.', false);
        return;
      }

      projectGrid.innerHTML = '';

      publicRepos.forEach(repo => {
        const category = determineCategory(repo);
        categories.add(category);

        const card = buildProjectCard(repo, category);
        projectGrid.appendChild(card);
      });

      renderFilters(Array.from(categories), projectFilters, projectGrid);
      clearStatus();
    })
    .catch(error => {
      setStatus(error.message || 'Failed to load repositories.', true);
    });

  function setStatus(message, isError) {
    statusElement.textContent = message;
    statusElement.classList.add('active');
    statusElement.classList.toggle('error', Boolean(isError));
  }

  function clearStatus() {
    statusElement.textContent = '';
    statusElement.classList.remove('active');
    statusElement.classList.remove('error');
  }
}

// Lightweight keyword classifier to group repositories into filter buckets.
function determineCategory(repo) {
  const keywords = `${(repo.name || '').toLowerCase()} ${(repo.description || '').toLowerCase()}`;
  const language = (repo.language || '').toLowerCase();
  const topics = Array.isArray(repo.topics) ? repo.topics.map(topic => topic.toLowerCase()) : [];

  const match = (...needles) => needles.some(needle => {
    return keywords.includes(needle) || topics.includes(needle) || language === needle;
  });

  if (match('bioinformatics', 'genomics', 'rna', 'proteomics', 'biology')) {
    return 'bioinformatics';
  }
  if (match('machine-learning', 'machine learning', 'deep-learning', 'deep learning', 'ml', 'ai', 'pytorch', 'tensorflow')) {
    return 'ml';
  }
  if (match('automation', 'workflow', 'pipeline', 'devops', 'cli')) {
    return 'automation';
  }
  if (match('web', 'frontend', 'javascript', 'typescript', 'html', 'css')) {
    return 'web';
  }

  return 'general';
}

function buildProjectCard(repo, category) {
  const wrapper = document.createElement('div');
  wrapper.className = 'project-list';
  wrapper.dataset.category = category;

  const listItem = document.createElement('li');

  const link = document.createElement('a');
  link.href = repo.html_url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const header = document.createElement('div');
  header.className = 'project-header';

  const title = document.createElement('strong');
  title.textContent = repo.name;

  header.appendChild(title);

  const badgeText = repo.fork ? 'Fork' : (repo.language || categoryLabel(category));
  if (badgeText) {
    const badge = document.createElement('span');
    badge.className = 'project-badge';
    badge.textContent = badgeText;
    header.appendChild(badge);
  }

  const description = document.createElement('span');
  description.className = 'project-desc';
  description.textContent = repo.description || 'This repository is still waiting for a description.';

  const tech = document.createElement('span');
  tech.className = 'project-tech';
  const techParts = [];
  if (repo.language) {
    techParts.push(`Language: ${repo.language}`);
  }
  if (Array.isArray(repo.topics) && repo.topics.length) {
    techParts.push(`Topics: ${repo.topics.join(', ')}`);
  }
  tech.textContent = techParts.join(' • ');

  const stats = document.createElement('div');
  stats.className = 'project-stats';

  const stars = document.createElement('span');
  stars.textContent = `⭐ ${repo.stargazers_count} stars`;
  stats.appendChild(stars);

  const forks = document.createElement('span');
  forks.textContent = `🔀 ${repo.forks_count} forks`;
  stats.appendChild(forks);

  if (repo.updated_at) {
    const updated = document.createElement('span');
    const updatedDate = new Date(repo.updated_at);
    updated.textContent = `🕒 Updated ${updatedDate.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric'
    })}`;
    stats.appendChild(updated);
  }

  link.appendChild(header);
  link.appendChild(description);
  if (techParts.length) {
    link.appendChild(tech);
  }
  link.appendChild(stats);

  listItem.appendChild(link);
  wrapper.appendChild(listItem);

  return wrapper;
}

function categoryLabel(category) {
  const labels = {
    bioinformatics: 'Bioinformatics',
    ml: 'Machine Learning',
    web: 'Web Development',
    automation: 'Automation',
    general: 'General'
  };

  return labels[category] || category;
}

function renderFilters(categories, container, projectGrid) {
  if (!categories.length) {
    container.style.display = 'none';
    return;
  }

  container.style.removeProperty('display');
  container.innerHTML = '';
  const allButton = createFilterButton('all', 'All', true);
  container.appendChild(allButton);

  categories
    .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)))
    .forEach(category => {
      const button = createFilterButton(category, categoryLabel(category));
      container.appendChild(button);
    });

  const buttons = container.querySelectorAll('.filter-btn');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;

      buttons.forEach(btn => btn.classList.toggle('active', btn === button));

      const projectCards = projectGrid.querySelectorAll('.project-list');
      projectCards.forEach(card => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.style.display = matches ? 'block' : 'none';
      });
    });
  });
}

function createFilterButton(filter, label, isActive) {
  const button = document.createElement('button');
  button.className = 'filter-btn';
  if (isActive) {
    button.classList.add('active');
  }
  button.dataset.filter = filter;
  button.type = 'button';
  button.textContent = label;

  return button;
}

function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) {
    return;
  }

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
