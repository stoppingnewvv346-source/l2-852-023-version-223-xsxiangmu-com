(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-nav-links]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }
    var current = 0;
    function show(index) {
      current = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
      });
    });
    setInterval(function () {
      show((current + 1) % slides.length);
    }, 5000);
  }

  function setupLocalFilters() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-local-filter]'));
    boxes.forEach(function (box) {
      var input = box.querySelector('input');
      var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
      if (!input || !cards.length) {
        return;
      }
      input.addEventListener('input', function () {
        var value = input.value.trim().toLowerCase();
        cards.forEach(function (card) {
          var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-keywords') || '')).toLowerCase();
          card.classList.toggle('hidden-by-filter', value && text.indexOf(value) === -1);
        });
      });
    });
  }

  function movieCard(item) {
    var tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '  <a class="movie-cover" href="' + escapeHtml(item.url) + '">',
      '    <img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
      '    <span class="cover-play">▶</span>',
      '  </a>',
      '  <div class="movie-info">',
      '    <a href="' + escapeHtml(item.url) + '"><h3>' + escapeHtml(item.title) + '</h3></a>',
      '    <p>' + escapeHtml(item.summary) + '</p>',
      '    <div class="movie-meta">',
      '      <span>' + escapeHtml(item.year) + '</span>',
      '      <span>' + escapeHtml(item.region) + '</span>',
      '      <span>' + escapeHtml(item.type) + '</span>',
      '    </div>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupSearchPage() {
    if (document.body.getAttribute('data-page') !== 'search') {
      return;
    }
    var input = document.querySelector('[data-search-input]');
    var results = document.querySelector('[data-search-results]');
    var title = document.querySelector('[data-search-title]');
    var intro = document.querySelector('[data-search-intro]');
    var form = document.querySelector('[data-search-form]');
    if (!input || !results || typeof MOVIE_INDEX === 'undefined') {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;

    function render(query) {
      var term = query.trim().toLowerCase();
      if (!term) {
        title.textContent = '热门片单';
        intro.textContent = '也可以直接从下方推荐内容进入详情页。';
        return;
      }
      var matched = MOVIE_INDEX.filter(function (item) {
        return String(item.keywords || '').toLowerCase().indexOf(term) !== -1;
      }).slice(0, 120);
      title.textContent = '搜索结果';
      intro.textContent = matched.length ? '点击结果可进入影片详情页。' : '没有找到匹配内容，可以尝试更换关键词。';
      results.innerHTML = matched.length ? matched.map(movieCard).join('\n') : '<div class="empty-state">暂无匹配影片</div>';
    }

    render(initial);
    input.addEventListener('input', function () {
      render(input.value);
    });
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var query = input.value.trim();
        var nextUrl = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
        history.replaceState(null, '', nextUrl);
        render(query);
      });
    }
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupLocalFilters();
    setupSearchPage();
  });
})();
