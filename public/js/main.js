// ===================================
// OBD Kodları - Client-Side JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initParticles();
  initCounters();
  initSearch();
  initAnimations();
});

// =========== NAVBAR ===========
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }
}

// =========== BACKGROUND PARTICLES ===========
function initParticles() {
  const container = document.getElementById('bgParticles');
  if (!container) return;

  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#a855f7'];
  const particleCount = 6;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'bg-particle';
    const size = Math.random() * 300 + 200;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = `radial-gradient(circle, ${color}20 0%, transparent 70%)`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * -20}s`;
    particle.style.animationDuration = `${15 + Math.random() * 15}s`;
    
    container.appendChild(particle);
  }
}

// =========== COUNTER ANIMATION ===========
function initCounters() {
  const statValues = document.querySelectorAll('.stat-value[data-target]');
  if (!statValues.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statValues.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 1500;
  const start = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(eased * target);
    
    el.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

// =========== LIVE SEARCH ===========
function initSearch() {
  const heroInput = document.getElementById('heroSearchInput');
  const pageInput = document.getElementById('pageSearchInput');
  const suggestionsBox = document.getElementById('searchSuggestions');

  const inputs = [heroInput, pageInput].filter(Boolean);

  inputs.forEach(input => {
    let debounceTimer;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = input.value.trim();
        if (query.length >= 2) {
          fetchSuggestions(query, input);
        } else {
          hideSuggestions(input);
        }
      }, 200);
    });

    input.addEventListener('focus', () => {
      const query = input.value.trim();
      if (query.length >= 2) {
        fetchSuggestions(query, input);
      }
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hero-search') && !e.target.closest('.page-search')) {
        hideSuggestions(input);
      }
    });
  });
}

function fetchSuggestions(query, input) {
  fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`)
    .then(res => res.json())
    .then(data => {
      showSuggestions(data, input);
    })
    .catch(() => {});
}

function showSuggestions(results, input) {
  const form = input.closest('form');
  let box = form.querySelector('.search-suggestions');
  
  if (!box) return;
  if (!results.length) {
    box.classList.remove('active');
    return;
  }

  box.innerHTML = results.map(item => `
    <a href="/kod/${item.code}" class="suggestion-item">
      <span class="code-badge category-${item.category}">${item.category}</span>
      <span class="suggestion-code">${item.code}</span>
      <span class="suggestion-name">${item.name}</span>
    </a>
  `).join('');

  box.classList.add('active');
}

function hideSuggestions(input) {
  const form = input.closest('form');
  if (!form) return;
  const box = form.querySelector('.search-suggestions');
  if (box) box.classList.remove('active');
}

// =========== SCROLL ANIMATIONS ===========
function initAnimations() {
  const animateElements = document.querySelectorAll(
    '.stat-card, .code-card, .category-card, .result-card, .detail-card, .about-card, .related-card'
  );

  if (!animateElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${index * 0.05}s`;
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  animateElements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// =========== COMMENTS FORM ===========
document.addEventListener('DOMContentLoaded', () => {
  const commentForm = document.getElementById('commentForm');
  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const codeId = document.getElementById('codeId').value;
      const website = document.getElementById('website').value;
      const name = document.getElementById('commentName').value.trim();
      const comment = document.getElementById('commentText').value.trim();
      const statusDiv = document.getElementById('commentStatus');
      const submitBtn = document.getElementById('submitCommentBtn');
      
      if (!name || !comment) {
        statusDiv.textContent = 'Lütfen adınızı ve yorumunuzu girin.';
        statusDiv.style.color = '#ef4444';
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Gönderiliyor...';
      statusDiv.textContent = '';
      
      fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeId, name, comment, website })
      })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(res => {
        if (res.status === 200) {
          statusDiv.textContent = 'Yorumunuz başarıyla gönderildi!';
          statusDiv.style.color = '#10b981';
          commentForm.reset();
          // Optional: Reload the page to show the new comment
          setTimeout(() => window.location.reload(), 1500);
        } else {
          statusDiv.textContent = res.body.error || 'Bir hata oluştu.';
          statusDiv.style.color = '#ef4444';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Yorumu Gönder';
        }
      })
      .catch(() => {
        statusDiv.textContent = 'Bağlantı hatası oluştu.';
        statusDiv.style.color = '#ef4444';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Yorumu Gönder';
      });
    });
  }
});

