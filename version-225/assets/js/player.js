function initMoviePlayer(config) {
  var container = document.querySelector(config.selector);
  if (!container) {
    return;
  }
  var video = container.querySelector('video');
  var overlay = container.querySelector('.player-overlay');
  var playButton = container.querySelector('[data-player-play]');
  var muteButton = container.querySelector('[data-player-mute]');
  var fullscreenButton = container.querySelector('[data-player-fullscreen]');
  var hls = null;
  var sourceReady = false;
  var waitingForPlay = false;

  function updateState() {
    var playing = !video.paused && !video.ended;
    container.classList.toggle('is-playing', playing);
    if (playButton) {
      playButton.textContent = playing ? '暂停' : '播放';
    }
    if (muteButton) {
      muteButton.textContent = video.muted ? '取消静音' : '静音';
    }
  }

  function attachSource() {
    if (sourceReady) {
      return;
    }
    sourceReady = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = config.src;
      return;
    }
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(config.src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        if (waitingForPlay) {
          video.play().catch(function () {});
        }
      });
      hls.on(Hls.Events.ERROR, function (eventName, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          destroyHls();
        }
      });
      return;
    }
    video.src = config.src;
  }

  function destroyHls() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  }

  function playVideo() {
    attachSource();
    waitingForPlay = true;
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  function togglePlay() {
    if (video.paused || video.ended) {
      playVideo();
    } else {
      video.pause();
    }
  }

  if (config.poster) {
    video.poster = config.poster;
  }
  if (overlay) {
    overlay.addEventListener('click', playVideo);
  }
  if (playButton) {
    playButton.addEventListener('click', togglePlay);
  }
  if (muteButton) {
    muteButton.addEventListener('click', function () {
      video.muted = !video.muted;
      updateState();
    });
  }
  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    });
  }
  video.addEventListener('click', togglePlay);
  video.addEventListener('play', updateState);
  video.addEventListener('pause', updateState);
  video.addEventListener('ended', updateState);
  video.addEventListener('volumechange', updateState);
  window.addEventListener('beforeunload', destroyHls);
  updateState();
}
