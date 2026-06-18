
(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existed = Array.from(document.scripts).some(function (s) { return s.src === src; });
      if (existed) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(script);
    });
  }

  function initMobileMenu() {
    var toggle = qs('[data-menu-toggle]');
    var panel = qs('[data-menu-panel]');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initVideoPlayers() {
    var videos = qsa('video[data-hls-src]');
    if (!videos.length) return;

    videos.forEach(function (video) {
      if (video.dataset.loaded === '1') return;
      video.dataset.loaded = '1';
      var src = video.dataset.hlsSrc;
      if (!src) return;

      function attachNative() {
        video.src = src;
      }

      function attachHls(Hls) {
        try {
          var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.setAttribute('data-player-ready', '1');
          });
          hls.on(Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                hls.destroy();
              }
            }
          });
        } catch (err) {
          console.error(err);
          attachNative();
        }
      }

      if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
        attachNative();
        return;
      }

      if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
        attachHls(window.Hls);
        return;
      }

      loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js')
        .then(function () {
          if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
            attachHls(window.Hls);
          } else {
            attachNative();
          }
        })
        .catch(function () {
          attachNative();
        });
    });
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function movieCardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (t) {
      return '<span class="chip">' + escapeHtml(t) + '</span>';
    }).join('');
    return '' +
      '<article class="movie-card">' +
      '<a class="poster" href="movie-' + movie.id + '.html" aria-label="' + escapeAttr(movie.title) + '">' +
      '<img loading="lazy" src="' + escapeAttr(movie.poster) + '" alt="' + escapeAttr(movie.title) + '">' +
      '<div class="overlay"></div>' +
      '<div class="meta-top"><span class="badge">' + escapeHtml(movie.region) + '</span><span class="badge">' + escapeHtml(movie.year) + '</span></div>' +
      '<div class="meta-bottom">' +
      '<p class="title clamp-2">' + escapeHtml(movie.title) + '</p>' +
      '<p class="subtitle clamp-2">' + escapeHtml(movie.oneLine) + '</p>' +
      '</div>' +
      '</a>' +
      '<div>' +
      '<h3 class="card-title clamp-2"><a href="movie-' + movie.id + '.html">' + escapeHtml(movie.title) + '</a></h3>' +
      '<p class="card-desc clamp-2">' + escapeHtml(movie.summary) + '</p>' +
      '<div class="card-row">' + tags + '</div>' +
      '</div>' +
      '</article>';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/`/g, '&#96;');
  }

  function initSearchPage() {
    var app = qs('#searchApp');
    if (!app) return;

    var dataNode = qs('#movieData');
    if (!dataNode) return;

    var movies = [];
    try {
      movies = JSON.parse(dataNode.textContent || '[]');
    } catch (err) {
      console.error(err);
      return;
    }

    var regionSel = qs('[data-region-select]', app);
    var queryInput = qs('[data-query-input]', app);
    var results = qs('[data-results]', app);
    var count = qs('[data-count]', app);
    var sortSel = qs('[data-sort-select]', app);

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    var initialRegion = params.get('region') || '全部';

    if (queryInput) queryInput.value = initialQuery;
    if (regionSel) regionSel.value = initialRegion;

    function normalize(value) {
      return String(value || '').toLowerCase();
    }

    function scoreMovie(movie) {
      return (movie.year || 0) * 1000 + (movie.tags ? movie.tags.length * 20 : 0) + String(movie.summary || '').length;
    }

    function filterMovies() {
      var q = normalize(queryInput ? queryInput.value : '');
      var region = regionSel ? regionSel.value : '全部';
      var sort = sortSel ? sortSel.value : 'smart';

      var filtered = movies.filter(function (m) {
        var okRegion = region === '全部' || m.group === region || m.region === region;
        if (!okRegion) return false;
        if (!q) return true;
        var blob = [
          m.title, m.region, m.group, m.type, m.genre,
          (m.tags || []).join(' '), m.oneLine, m.summary, m.review
        ].join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });

      filtered.sort(function (a, b) {
        if (sort === 'year') {
          return (b.year || 0) - (a.year || 0);
        }
        if (sort === 'title') {
          return String(a.title).localeCompare(String(b.title), 'zh-Hans-CN');
        }
        return scoreMovie(b) - scoreMovie(a);
      });

      render(filtered);
    }

    function render(list) {
      if (count) count.textContent = list.length + ' 部作品';
      if (!results) return;
      if (!list.length) {
        results.innerHTML = '<div class="panel" style="padding:24px;grid-column:1/-1"><div class="notice">没有找到匹配的影片，试试更换关键词或分类。</div></div>';
        return;
      }

      var html = '';
      var max = Math.min(list.length, 60);
      for (var i = 0; i < max; i++) {
        html += movieCardTemplate(list[i]);
      }
      results.innerHTML = html;
    }

    var run = debounce(filterMovies, 160);
    if (queryInput) queryInput.addEventListener('input', run);
    if (regionSel) regionSel.addEventListener('change', filterMovies);
    if (sortSel) sortSel.addEventListener('change', filterMovies);

    filterMovies();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initVideoPlayers();
    initSearchPage();
  });
})();
