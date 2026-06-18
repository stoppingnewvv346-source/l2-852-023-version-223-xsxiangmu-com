(function () {
    function query(selector, root) {
        return (root || document).querySelector(selector);
    }

    function queryAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function getBase() {
        var base = document.body.getAttribute('data-base') || '.';
        return base === '.' ? '' : base + '/';
    }

    function initMobileMenu() {
        var toggle = query('[data-mobile-toggle]');
        var menu = query('[data-mobile-menu]');
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function initHero() {
        var hero = query('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = queryAll('[data-hero-slide]', hero);
        var dots = queryAll('[data-hero-dot]', hero);
        var prev = query('[data-hero-prev]', hero);
        var next = query('[data-hero-next]', hero);
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function play() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5500);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                play();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                play();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot') || 0));
                play();
            });
        });
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', play);
        show(0);
        play();
    }

    function normalizeText(value) {
        return String(value || '').toLowerCase().trim();
    }

    function initCardFilter() {
        var input = query('[data-card-filter]');
        var sort = query('[data-card-sort]');
        var grid = query('[data-card-grid]');
        if (!grid) {
            return;
        }
        var cards = queryAll('.movie-card', grid);

        function applyFilter() {
            var keyword = normalizeText(input ? input.value : '');
            cards.forEach(function (card) {
                var haystack = normalizeText([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year')
                ].join(' '));
                card.classList.toggle('is-hidden', keyword && haystack.indexOf(keyword) === -1);
            });
        }

        function applySort() {
            var mode = sort ? sort.value : 'default';
            var sorted = cards.slice();
            if (mode === 'rating') {
                sorted.sort(function (a, b) {
                    return Number(b.getAttribute('data-rating')) - Number(a.getAttribute('data-rating'));
                });
            } else if (mode === 'views') {
                sorted.sort(function (a, b) {
                    return Number(b.getAttribute('data-views')) - Number(a.getAttribute('data-views'));
                });
            } else if (mode === 'year') {
                sorted.sort(function (a, b) {
                    return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
                });
            } else if (mode === 'title') {
                sorted.sort(function (a, b) {
                    return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-Hans-CN');
                });
            } else {
                sorted.sort(function (a, b) {
                    return cards.indexOf(a) - cards.indexOf(b);
                });
            }
            sorted.forEach(function (card) {
                grid.appendChild(card);
            });
        }

        if (input) {
            input.addEventListener('input', applyFilter);
        }
        if (sort) {
            sort.addEventListener('change', applySort);
        }
    }

    function createCard(movie) {
        var base = getBase();
        var article = document.createElement('article');
        article.className = 'movie-card grid-card';
        article.setAttribute('data-title', movie.title || '');
        article.setAttribute('data-region', movie.region || '');
        article.setAttribute('data-genre', movie.genre || '');
        article.setAttribute('data-type', movie.type || '');
        article.setAttribute('data-year', movie.year || '');
        article.setAttribute('data-views', movie.views || 0);
        article.setAttribute('data-rating', movie.rating || 0);
        article.innerHTML = [
            '<a class="poster" href="' + base + 'video/' + movie.detail_file + '">',
            '<img src="' + base + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '<span class="play-chip">▶</span>',
            '<span class="duration">' + escapeHtml(movie.duration || '') + '</span>',
            '</a>',
            '<div class="card-body">',
            '<h3><a href="' + base + 'video/' + movie.detail_file + '">' + escapeHtml(movie.title) + '</a></h3>',
            '<p>' + escapeHtml(movie.one_line || '') + '</p>',
            '<div class="meta-row"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>⭐ ' + escapeHtml(movie.rating) + '</span></div>',
            '<div class="tag-row"><span>' + escapeHtml(movie.category_name) + '</span><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.genre) + '</span></div>',
            '</div>'
        ].join('');
        return article;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initSearchPage() {
        var results = query('[data-search-results]');
        if (!results || !window.MOVIE_SEARCH_INDEX) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var keyword = normalizeText(params.get('q') || '');
        var input = query('[data-search-input]');
        var title = query('[data-search-title]');
        var count = query('[data-search-count]');
        if (input && keyword) {
            input.value = params.get('q') || '';
        }
        if (!keyword) {
            return;
        }
        var matches = window.MOVIE_SEARCH_INDEX.filter(function (movie) {
            var haystack = normalizeText([
                movie.title,
                movie.region,
                movie.type,
                movie.year,
                movie.genre,
                movie.category_name,
                movie.tags,
                movie.one_line
            ].join(' '));
            return haystack.indexOf(keyword) !== -1;
        });
        if (title) {
            title.textContent = '“' + (params.get('q') || '') + '” 的搜索结果';
        }
        if (count) {
            count.textContent = '共找到 ' + matches.length + ' 个结果。';
        }
        results.innerHTML = '';
        matches.slice(0, 240).forEach(function (movie) {
            results.appendChild(createCard(movie));
        });
        if (!matches.length) {
            results.innerHTML = '<div class="content-panel"><h2>没有找到相关内容</h2><p>可以尝试更换影片名、地区、类型或年份关键词。</p></div>';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initHero();
        initCardFilter();
        initSearchPage();
    });
})();
