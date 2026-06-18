(function () {
  function readyPlayer(sourceUrl) {
    var video = document.getElementById('movie-video');
    var startButton = document.getElementById('player-start');
    var message = document.getElementById('player-message');
    var hls = null;
    var attached = false;

    if (!video || !startButton || !sourceUrl) {
      return;
    }

    function showMessage(text) {
      if (message) {
        message.textContent = text;
        message.classList.add('show');
      }
    }

    function attachSource() {
      if (attached) {
        return Promise.resolve();
      }
      attached = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = sourceUrl;
        return Promise.resolve();
      }

      if (window.Hls && window.Hls.isSupported()) {
        return new Promise(function (resolve, reject) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(sourceUrl);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            resolve();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              reject(new Error('播放暂时不可用'));
            }
          });
        });
      }

      return Promise.reject(new Error('播放暂时不可用'));
    }

    function beginPlay() {
      startButton.classList.add('is-hidden');
      attachSource()
        .then(function () {
          return video.play();
        })
        .catch(function () {
          startButton.classList.remove('is-hidden');
          showMessage('播放暂时不可用，请稍后重试');
        });
    }

    startButton.addEventListener('click', beginPlay);

    video.addEventListener('click', function () {
      if (video.paused) {
        beginPlay();
      } else {
        video.pause();
      }
    });

    video.addEventListener('playing', function () {
      startButton.classList.add('is-hidden');
    });

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.initMoviePlayer = readyPlayer;
})();
