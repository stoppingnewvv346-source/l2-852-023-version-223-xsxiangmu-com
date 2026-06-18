import { H as Hls } from './hls-vendor-dru42stk.js';

function setupPlayer(box) {
    const video = box.querySelector('video');
    const startButton = box.querySelector('[data-player-start]');
    const source = box.getAttribute('data-video');
    let initialized = false;
    let hls = null;

    if (!video || !source) {
        return;
    }

    function initSource() {
        if (initialized) {
            return;
        }
        initialized = true;
        if (Hls && Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, function (_event, data) {
                if (!data || !data.fatal) {
                    return;
                }
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    hls.startLoad();
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                } else {
                    hls.destroy();
                    hls = null;
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
        } else {
            video.src = source;
        }
    }

    function play() {
        initSource();
        box.classList.add('is-playing');
        const result = video.play();
        if (result && typeof result.catch === 'function') {
            result.catch(function () {
                box.classList.remove('is-playing');
            });
        }
    }

    if (startButton) {
        startButton.addEventListener('click', play);
    }
    video.addEventListener('play', function () {
        box.classList.add('is-playing');
    });
    video.addEventListener('pause', function () {
        if (!video.currentTime) {
            box.classList.remove('is-playing');
        }
    });
    window.addEventListener('beforeunload', function () {
        if (hls) {
            hls.destroy();
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-player').forEach(setupPlayer);
});
