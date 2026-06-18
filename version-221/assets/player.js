(function () {
  function initPlayer(shell) {
    var video = shell.querySelector('video');
    var cover = shell.querySelector('[data-player-cover]');
    if (!video) {
      return;
    }

    var stream = video.getAttribute('data-stream') || '';
    var hlsInstance = null;

    function attachStream() {
      if (!stream || video.getAttribute('data-ready') === 'true') {
        return;
      }
      video.setAttribute('data-ready', 'true');
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        video.src = stream;
      }
    }

    function playVideo() {
      attachStream();
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', playVideo);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });

    video.addEventListener('play', function () {
      if (cover) {
        cover.classList.add('is-hidden');
      }
    });

    video.addEventListener('pause', function () {
      if (cover && video.currentTime === 0) {
        cover.classList.remove('is-hidden');
      }
    });

    video.addEventListener('loadedmetadata', function () {
      if (video.autoplay) {
        playVideo();
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.querySelectorAll('[data-video-shell]').forEach(initPlayer);
})();
