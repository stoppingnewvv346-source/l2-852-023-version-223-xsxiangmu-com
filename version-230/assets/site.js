(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function setupMenu() {
    var header = document.querySelector('.site-header');
    var button = document.querySelector('.menu-toggle');
    if (!header || !button) {
      return;
    }
    button.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    if (!slides.length) {
      return;
    }
    var index = Math.max(0, slides.findIndex(function (slide) {
      return slide.classList.contains('active');
    }));
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      if (slides.length < 2) {
        return;
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        window.clearInterval(timer);
        show(i);
        start();
      });
    });

    show(index);
    start();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach(function (panel) {
      var scope = document.querySelector(panel.getAttribute('data-filter-panel')) || document;
      var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
      var input = panel.querySelector('[data-filter-text]');
      var region = panel.querySelector('[data-filter-region]');
      var genre = panel.querySelector('[data-filter-genre]');
      var year = panel.querySelector('[data-filter-year]');
      var empty = document.querySelector(panel.getAttribute('data-empty-target'));

      function valueOf(select) {
        return select ? select.value.trim().toLowerCase() : '';
      }

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : '';
        var selectedRegion = valueOf(region);
        var selectedGenre = valueOf(genre);
        var selectedYear = valueOf(year);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-year'),
            card.getAttribute('data-type'),
            card.getAttribute('data-tags')
          ].join(' ').toLowerCase();
          var ok = true;
          if (keyword && haystack.indexOf(keyword) === -1) {
            ok = false;
          }
          if (selectedRegion && (card.getAttribute('data-region') || '').toLowerCase().indexOf(selectedRegion) === -1) {
            ok = false;
          }
          if (selectedGenre && (card.getAttribute('data-genre') || '').toLowerCase().indexOf(selectedGenre) === -1 && (card.getAttribute('data-tags') || '').toLowerCase().indexOf(selectedGenre) === -1) {
            ok = false;
          }
          if (selectedYear && (card.getAttribute('data-year') || '').toLowerCase() !== selectedYear) {
            ok = false;
          }
          card.style.display = ok ? '' : 'none';
          if (ok) {
            visible += 1;
          }
        });

        if (empty) {
          empty.style.display = visible ? 'none' : 'block';
        }
      }

      [input, region, genre, year].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
      apply();
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('.player-shell'));
    players.forEach(function (shell) {
      var video = shell.querySelector('video');
      var button = shell.querySelector('.player-start');
      var stream = shell.getAttribute('data-stream');
      var loaded = false;
      var hls = null;
      if (!video || !stream) {
        return;
      }

      function prepare() {
        if (loaded) {
          return;
        }
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else {
          video.src = stream;
          video.load();
        }
      }

      function play() {
        prepare();
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      }

      if (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          play();
        });
      }

      shell.addEventListener('click', function (event) {
        if (event.target === video) {
          return;
        }
        play();
      });

      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (!video.currentTime) {
          shell.classList.remove('is-playing');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls && typeof hls.destroy === 'function') {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
