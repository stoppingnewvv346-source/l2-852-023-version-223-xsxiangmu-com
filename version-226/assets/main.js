(function () {
  var body = document.body;
  var toggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
      body.classList.toggle('menu-open');
    });
  }

  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.classList.add('image-missing');
    }, { once: true });
  });

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var prev = document.querySelector('[data-hero-prev]');
  var next = document.querySelector('[data-hero-next]');
  var current = 0;
  var timer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
    });
  }

  function startHero() {
    if (timer || slides.length < 2) {
      return;
    }
    timer = window.setInterval(function () {
      showSlide(current + 1);
    }, 5000);
  }

  function resetHero() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    startHero();
  }

  if (slides.length) {
    showSlide(0);
    startHero();
  }

  if (prev) {
    prev.addEventListener('click', function () {
      showSlide(current - 1);
      resetHero();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      showSlide(current + 1);
      resetHero();
    });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      showSlide(i);
      resetHero();
    });
  });

  var input = document.querySelector('[data-filter-input]');
  var region = document.querySelector('[data-region-filter]');
  var year = document.querySelector('[data-year-filter]');
  var clear = document.querySelector('[data-clear-filter]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applyFilters() {
    var q = normalize(input && input.value);
    var r = region ? region.value : '';
    var y = year ? year.value : '';

    cards.forEach(function (card) {
      var text = normalize((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-text') || ''));
      var okText = !q || text.indexOf(q) !== -1;
      var okRegion = !r || card.getAttribute('data-region') === r;
      var okYear = !y || card.getAttribute('data-year') === y;
      card.classList.toggle('hidden-by-filter', !(okText && okRegion && okYear));
    });
  }

  [input, region, year].forEach(function (control) {
    if (control) {
      control.addEventListener('input', applyFilters);
      control.addEventListener('change', applyFilters);
    }
  });

  if (clear) {
    clear.addEventListener('click', function () {
      if (input) {
        input.value = '';
      }
      if (region) {
        region.value = '';
      }
      if (year) {
        year.value = '';
      }
      applyFilters();
    });
  }
})();
