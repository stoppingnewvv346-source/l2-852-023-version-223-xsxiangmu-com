(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMobileMenu() {
        var button = qs('.mobile-menu-button');
        var panel = qs('.mobile-panel');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function initHero() {
        var slides = qsa('[data-hero-slide]');
        var dots = qsa('[data-hero-dot]');
        if (!slides.length || !dots.length) {
            return;
        }
        var active = 0;
        var timer = null;
        function show(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === active);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === active);
            });
        }
        function start() {
            timer = window.setInterval(function () {
                show(active + 1);
            }, 5200);
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                if (timer) {
                    window.clearInterval(timer);
                    start();
                }
            });
        });
        start();
    }

    function initLocalFilter() {
        var input = qs('.local-filter');
        var year = qs('.year-filter');
        var cards = qsa('.filterable-grid .movie-card');
        if (!cards.length) {
            return;
        }
        function filter() {
            var keyword = input ? input.value.trim().toLowerCase() : '';
            var selectedYear = year ? year.value : '';
            cards.forEach(function (card) {
                var haystack = [
                    card.dataset.title,
                    card.dataset.region,
                    card.dataset.genre,
                    card.dataset.type,
                    card.dataset.year
                ].join(' ').toLowerCase();
                var matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var matchedYear = !selectedYear || card.dataset.year === selectedYear;
                card.style.display = matchedKeyword && matchedYear ? '' : 'none';
            });
        }
        if (input) {
            input.addEventListener('input', filter);
        }
        if (year) {
            year.addEventListener('change', filter);
        }
    }

    function movieCard(movie) {
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');
        return [
            '<article class="movie-card">',
            '<a href="' + escapeHtml(movie.url) + '" class="movie-card-link">',
            '<div class="poster-wrap">',
            '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '<span class="play-chip">播放</span>',
            '</div>',
            '<div class="movie-card-body">',
            '<h3>' + escapeHtml(movie.title) + '</h3>',
            '<div class="movie-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
            '<p>' + escapeHtml(movie.oneLine || movie.genre || '') + '</p>',
            '<div class="tag-row">' + tags + '</div>',
            '</div>',
            '</a>',
            '</article>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initSearchPage() {
        var input = qs('#searchInput');
        var form = qs('.search-page-form');
        var results = qs('#searchResults');
        var title = qs('#searchTitle');
        var hint = qs('#searchHint');
        if (!input || !form || !results || typeof MOVIE_SEARCH_INDEX === 'undefined') {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        input.value = initial;
        function render(query) {
            var keyword = query.trim().toLowerCase();
            var list = MOVIE_SEARCH_INDEX;
            if (keyword) {
                list = MOVIE_SEARCH_INDEX.filter(function (movie) {
                    var haystack = [
                        movie.title,
                        movie.region,
                        movie.type,
                        movie.year,
                        movie.genre,
                        movie.category,
                        (movie.tags || []).join(' '),
                        movie.oneLine
                    ].join(' ').toLowerCase();
                    return haystack.indexOf(keyword) !== -1;
                });
            } else {
                list = MOVIE_SEARCH_INDEX.slice(0, 24);
            }
            results.innerHTML = list.slice(0, 120).map(movieCard).join('');
            title.textContent = keyword ? '搜索结果' : '热门推荐';
            hint.textContent = keyword ? '已按关键词筛选片库内容。' : '输入关键词后即可筛选片库内容。';
        }
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            render(input.value);
            var nextUrl = input.value.trim() ? './search.html?q=' + encodeURIComponent(input.value.trim()) : './search.html';
            window.history.replaceState({}, '', nextUrl);
        });
        input.addEventListener('input', function () {
            render(input.value);
        });
        render(initial);
    }

    window.initMoviePlayer = function (url) {
        var video = qs('[data-player]');
        var cover = qs('.player-cover');
        if (!video || !url) {
            return;
        }
        var ready = false;
        function prepare() {
            if (ready) {
                return;
            }
            ready = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }
        }
        function play() {
            prepare();
            if (cover) {
                cover.classList.add('hidden');
            }
            video.controls = true;
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        }
        if (cover) {
            cover.addEventListener('click', play);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener('play', function () {
            if (cover) {
                cover.classList.add('hidden');
            }
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initHero();
        initLocalFilter();
        initSearchPage();
    });
})();
