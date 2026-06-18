(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupCarousel() {
    var carousel = document.querySelector('[data-carousel]');
    if (!carousel) return;
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dotsBox = carousel.querySelector('[data-carousel-dots]');
    var prev = carousel.querySelector('[data-carousel-prev]');
    var next = carousel.querySelector('[data-carousel-next]');
    if (!slides.length) return;
    var index = 0;
    var dots = [];

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    if (dotsBox) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-dot';
        dot.setAttribute('aria-label', '切换到第' + (i + 1) + '屏');
        dot.addEventListener('click', function () {
          show(i);
        });
        dotsBox.appendChild(dot);
        dots.push(dot);
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
      });
    }

    show(0);
    window.setInterval(function () {
      show(index + 1);
    }, 6500);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupFilters() {
    var zones = Array.prototype.slice.call(document.querySelectorAll('[data-filter-zone]'));
    zones.forEach(function (zone) {
      var input = zone.querySelector('[data-card-search]');
      var selects = Array.prototype.slice.call(zone.querySelectorAll('[data-card-select]'));
      var cards = Array.prototype.slice.call(zone.querySelectorAll('[data-movie-card]'));
      var empty = zone.querySelector('[data-empty-state]');
      if (!cards.length) return;

      var params = new URLSearchParams(window.location.search);
      var query = params.get('q') || '';
      if (input && query) {
        input.value = query;
      }

      function apply() {
        var term = normalize(input ? input.value : '');
        var active = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.dataset.title,
            card.dataset.year,
            card.dataset.region,
            card.dataset.genre,
            card.dataset.tags
          ].join(' '));
          var matchText = !term || haystack.indexOf(term) !== -1;
          var matchSelects = selects.every(function (select) {
            var key = select.getAttribute('data-card-select');
            return !select.value || normalize(card.dataset[key]) === normalize(select.value);
          });
          var visible = matchText && matchSelects;
          card.classList.toggle('is-hidden', !visible);
          if (visible) active += 1;
        });
        if (empty) {
          empty.classList.toggle('is-visible', active === 0);
        }
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      apply();
    });
  }

  window.initMoviePlayer = function (videoId, streamUrl) {
    var video = document.getElementById(videoId);
    if (!video) return;
    var start = document.querySelector('[data-player-start="' + videoId + '"]');
    var hlsInstance = null;
    var attached = false;

    function attach() {
      if (attached) return;
      attached = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      attach();
      if (start) {
        start.classList.add('is-hidden');
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    if (start) {
      start.addEventListener('click', play);
    }
    video.addEventListener('play', function () {
      if (start) {
        start.classList.add('is-hidden');
      }
    });
    video.addEventListener('click', function () {
      if (!attached) {
        play();
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupCarousel();
    setupFilters();
  });
})();
