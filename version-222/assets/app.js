
(function () {
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function initMenu() {
    const header = $('.site-header');
    const btn = $('[data-menu-toggle]');
    if (!header || !btn) return;
    btn.addEventListener('click', () => header.classList.toggle('is-open'));
  }

  function initHeroCarousel() {
    const hero = $('[data-hero-carousel]');
    if (!hero) return;
    const slides = $all('[data-hero-slide]', hero);
    const dots = $all('[data-hero-dot]', hero);
    if (!slides.length) return;
    let idx = 0;
    const setActive = (n) => {
      idx = n % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === idx));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => setActive(i)));
    setActive(0);
    window.setInterval(() => setActive(idx + 1), 5000);
  }

  function initSearchFilter() {
    const forms = $all('[data-search-form]');
    forms.forEach((form) => {
      form.addEventListener('submit', (ev) => {
        const input = $('input[type="search"]', form);
        if (!input) return;
        const q = input.value.trim();
        if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('categories.html') || location.pathname.endsWith('ranking.html')) {
          ev.preventDefault();
          const target = $('[data-filter-input]');
          if (target) {
            target.value = q;
            target.dispatchEvent(new Event('input', { bubbles: true }));
            target.focus();
            history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
          } else {
            location.href = `index.html?q=${encodeURIComponent(q)}`;
          }
        }
      });
    });

    const filterInput = $('[data-filter-input]');
    if (!filterInput) return;
    const filterType = $('[data-filter-type]');
    const cards = $all('[data-movie-card]');
    const counter = $('[data-filter-count]');

    function apply() {
      const q = (filterInput.value || '').trim().toLowerCase();
      const type = (filterType && filterType.value) || '';
      let visible = 0;
      cards.forEach((card) => {
        const text = `${card.dataset.title || ''} ${card.dataset.region || ''} ${card.dataset.type || ''} ${card.dataset.genre || ''} ${card.dataset.tags || ''} ${card.dataset.bucket || ''}`.toLowerCase();
        const matchText = !q || text.includes(q);
        const matchType = !type || card.dataset.type === type || card.dataset.bucket === type;
        const show = matchText && matchType;
        card.classList.toggle('hide', !show);
        if (show) visible += 1;
      });
      if (counter) counter.textContent = String(visible);
    }

    filterInput.addEventListener('input', apply);
    if (filterType) filterType.addEventListener('change', apply);
    apply();
  }

  function initVideoPlayer() {
    const player = $('[data-video-player]');
    if (!player) return;
    const sourceUrl = player.dataset.videoUrl || '';
    const poster = player.dataset.poster || '';
    if (poster) player.poster = poster;

    if (/\.m3u8(\?|$)/i.test(sourceUrl) && window.Hls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(sourceUrl);
      hls.attachMedia(player);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        const mark = $('[data-player-mark]');
        if (mark) mark.style.display = 'none';
      });
      hls.on(Hls.Events.ERROR, function (_, data) {
        console.warn('HLS error', data);
      });
    } else {
      player.src = sourceUrl;
      player.addEventListener('loadeddata', function () {
        const mark = $('[data-player-mark]');
        if (mark) mark.style.display = 'none';
      });
    }

    player.addEventListener('play', () => {
      const mark = $('[data-player-mark]');
      if (mark) mark.style.display = 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initHeroCarousel();
    initSearchFilter();
    initVideoPlayer();
  });
})();
