(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function text(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-nav-menu]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initSearchForms() {
    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        var suffix = query ? "?q=" + encodeURIComponent(query) : "";
        window.location.href = "./search.html" + suffix;
      });
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    if (!slides.length) {
      return;
    }
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });
    show(0);
    start();
  }

  function initFilters() {
    var list = document.querySelector("[data-filter-list]");
    if (!list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
    var queryInput = document.querySelector("[data-filter-query]");
    var yearSelect = document.querySelector("[data-filter-year]");
    var typeSelect = document.querySelector("[data-filter-type]");
    var regionSelect = document.querySelector("[data-filter-region]");

    function apply() {
      var query = queryInput ? queryInput.value.trim().toLowerCase() : "";
      var year = yearSelect ? yearSelect.value : "";
      var type = typeSelect ? typeSelect.value : "";
      var region = regionSelect ? regionSelect.value : "";
      cards.forEach(function (card) {
        var haystack = [card.dataset.title, card.dataset.genre, card.dataset.tags, card.dataset.region, card.dataset.type].join(" ").toLowerCase();
        var ok = true;
        if (query && haystack.indexOf(query) === -1) {
          ok = false;
        }
        if (year && card.dataset.year !== year) {
          ok = false;
        }
        if (type && card.dataset.type !== type) {
          ok = false;
        }
        if (region && card.dataset.region.indexOf(region) === -1) {
          ok = false;
        }
        card.classList.toggle("hidden-by-filter", !ok);
      });
    }

    [queryInput, yearSelect, typeSelect, regionSelect].forEach(function (control) {
      if (!control) {
        return;
      }
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    });
  }

  function initSearchPage() {
    var root = document.querySelector("[data-search-results]");
    if (!root) {
      return;
    }
    var input = document.querySelector("[data-search-page-input]");
    var form = document.querySelector("[data-search-page-form]");
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    if (input) {
      input.value = query;
    }

    function render() {
      var q = input ? input.value.trim().toLowerCase() : query.toLowerCase();
      var movies = Array.isArray(window.SEARCH_MOVIES) ? window.SEARCH_MOVIES : [];
      var result = movies.filter(function (movie) {
        if (!q) {
          return true;
        }
        return [movie.title, movie.genre, movie.tags, movie.region, movie.type, movie.oneLine]
          .join(" ")
          .toLowerCase()
          .indexOf(q) !== -1;
      }).slice(0, 160);
      if (!result.length) {
        root.innerHTML = '<div class="content-card"><h2>暂无匹配影片</h2><p>可以尝试更换片名、类型、地区或标签继续搜索。</p></div>';
        return;
      }
      root.innerHTML = result.map(function (movie) {
        return '<article class="movie-card">' +
          '<a class="poster-link" href="' + text(movie.url) + '" aria-label="' + text(movie.title) + '">' +
          '<img src="' + text(movie.cover) + '" alt="' + text(movie.title) + ' 在线观看" loading="lazy">' +
          '<span class="card-badge">' + text(movie.year) + '</span>' +
          '<span class="play-chip">播放</span>' +
          '</a>' +
          '<div class="card-body">' +
          '<a class="card-title" href="' + text(movie.url) + '">' + text(movie.title) + '</a>' +
          '<p class="card-meta">' + text(movie.region) + ' · ' + text(movie.type) + ' · ' + text(movie.genre) + '</p>' +
          '<p class="card-desc">' + text(movie.oneLine) + '</p>' +
          '<div class="tag-row">' + String(movie.tags || "").split(",").filter(Boolean).slice(0, 3).map(function (tag) {
            return '<span>' + text(tag) + '</span>';
          }).join("") + '</div>' +
          '</div>' +
          '</article>';
      }).join("");
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        render();
        var next = input && input.value.trim() ? "?q=" + encodeURIComponent(input.value.trim()) : "./search.html";
        history.replaceState(null, "", next);
      });
    }
    render();
  }

  function initPlayers() {
    document.querySelectorAll(".player[data-hls]").forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector(".play-layer");
      var source = player.getAttribute("data-hls");
      var requested = false;
      if (!video || !source) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      }

      function play() {
        requested = true;
        var attempt = video.play();
        if (attempt && typeof attempt.catch === "function") {
          attempt.catch(function () {
            window.setTimeout(function () {
              if (requested) {
                video.play().catch(function () {});
              }
            }, 300);
          });
        }
      }

      if (button) {
        button.addEventListener("click", play);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener("playing", function () {
        player.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        if (video.currentTime <= 0.1) {
          player.classList.remove("is-playing");
        }
      });
      video.addEventListener("canplay", function () {
        if (requested && video.paused) {
          video.play().catch(function () {});
        }
      });
    });
  }

  ready(function () {
    initNavigation();
    initSearchForms();
    initHero();
    initFilters();
    initSearchPage();
    initPlayers();
  });
})();
