(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  var slides = selectAll('[data-hero-slide]');
  var dots = selectAll('[data-hero-dot]');
  var activeSlide = 0;

  function setSlide(index) {
    if (!slides.length) {
      return;
    }
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === activeSlide);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === activeSlide);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      setSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      setSlide(activeSlide + 1);
    }, 5600);
  }

  selectAll('[data-search-panel]').forEach(function (panel) {
    var input = panel.querySelector('[data-movie-search]');
    var cards = selectAll('[data-movie-card]');
    var chips = selectAll('[data-filter]', panel);
    var activeFilter = 'all';
    var emptyState = document.querySelector('[data-empty-state]');

    function cardText(card) {
      return [
        card.getAttribute('data-title'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-region'),
        card.getAttribute('data-year'),
        card.getAttribute('data-tags')
      ].join(' ').toLowerCase();
    }

    function applyFilters() {
      var query = input ? input.value.trim().toLowerCase() : '';
      var visible = 0;
      cards.forEach(function (card) {
        var text = cardText(card);
        var matchesQuery = !query || text.indexOf(query) !== -1;
        var matchesFilter = activeFilter === 'all' || text.indexOf(activeFilter.toLowerCase()) !== -1;
        var show = matchesQuery && matchesFilter;
        card.style.display = show ? '' : 'none';
        if (show) {
          visible += 1;
        }
      });
      if (emptyState) {
        emptyState.classList.toggle('is-visible', visible === 0);
      }
    }

    if (input) {
      input.addEventListener('input', applyFilters);
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (item) {
          item.classList.remove('is-active');
        });
        chip.classList.add('is-active');
        activeFilter = chip.getAttribute('data-filter') || 'all';
        applyFilters();
      });
    });
  });
})();
