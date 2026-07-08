(() => {
    const hour = new Date().getHours();

    function getPeriod(h) {
        if (h >= 5 && h < 12) return 'morning';
        if (h >= 12 && h < 17) return 'afternoon';
        if (h >= 17 && h < 21) return 'evening';
        return 'night';
    }

    const period = getPeriod(hour);
    document.body.classList.add(`time-${period}`);

    const copy = {
        morning: {
            greeting: 'Good Morning',
            ambience: 'Birds are singing as the sun rises',
        },
        afternoon: {
            greeting: 'Good Afternoon',
            ambience: 'A gentle breeze drifts through the clouds',
        },
        evening: {
            greeting: 'Good Evening',
            ambience: 'Crickets begin to hum as the sky glows',
        },
        night: {
            greeting: 'Good Night',
            ambience: 'Night bugs sing under a quiet sky',
        },
    };

    document.getElementById('greeting').textContent = copy[period].greeting;
    document.getElementById('ambience-line').textContent = copy[period].ambience;
    document.getElementById('year').textContent = new Date().getFullYear();

    // Starfield (night only, but harmless to build regardless)
    const starsEl = document.querySelector('.stars');
    const starCount = 90;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('span');
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 70}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        starsEl.appendChild(star);
    }

    /* ---------------- Scroll-linked intro dismissal ---------------- */

    const intro = document.getElementById('intro');
    const fadeDistance = window.innerHeight * 0.9;
    let ticking = false;

    function updateIntro() {
        const y = window.scrollY;
        const progress = Math.min(y / fadeDistance, 1);
        intro.style.opacity = String(1 - progress);
        intro.style.transform = `translateY(${progress * -40}px)`;
        intro.style.pointerEvents = progress >= 1 ? 'none' : 'auto';
        setAmbientVolume(1 - progress);
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateIntro);
            ticking = true;
        }
    });
    updateIntro();

    /* ---------------- Procedural ambient audio ---------------- */

    let audioCtx = null;
    let masterGain = null;
    let ambientGain = null;
    let ambienceStarted = false;
    let muted = false;

    function ensureAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(audioCtx.destination);

        ambientGain = audioCtx.createGain();
        ambientGain.gain.value = 0;
        ambientGain.connect(masterGain);
    }

    function setAmbientVolume(level) {
        if (!ambientGain) return;
        ambientGain.gain.setTargetAtTime(level * 0.8, audioCtx.currentTime, 0.4);
    }

    function createNoiseBuffer(duration = 2) {
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    function playChirp() {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        const base = 2200 + Math.random() * 900;
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.4, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(base * 0.9, now + 0.2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + 0.22);
        osc.connect(gain).connect(ambientGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    function scheduleBirds() {
        if (!ambienceStarted) return;
        playChirp();
        if (Math.random() > 0.5) {
            setTimeout(playChirp, 120 + Math.random() * 100);
        }
        setTimeout(scheduleBirds, 1400 + Math.random() * 2600);
    }

    let windNodes = null;
    function startWind() {
        const noise = audioCtx.createBufferSource();
        noise.buffer = createNoiseBuffer(4);
        noise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;

        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 150;
        lfo.connect(lfoGain).connect(filter.frequency);

        const gain = audioCtx.createGain();
        gain.gain.value = 0.18;

        noise.connect(filter).connect(gain).connect(ambientGain);
        noise.start();
        lfo.start();
        windNodes = { noise, lfo };
    }

    function playCricketPulse(volume = 0.18) {
        const now = audioCtx.currentTime;
        for (let i = 0; i < 3; i++) {
            const t = now + i * 0.045;
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 4200 + Math.random() * 300;
            filter.type = 'bandpass';
            filter.frequency.value = 4200;
            filter.Q.value = 8;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(volume, t + 0.008);
            gain.gain.linearRampToValueAtTime(0, t + 0.03);
            osc.connect(filter).connect(gain).connect(ambientGain);
            osc.start(t);
            osc.stop(t + 0.04);
        }
    }

    function playOwlHoot() {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.6);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.connect(gain).connect(ambientGain);
        osc.start(now);
        osc.stop(now + 0.9);
    }

    function scheduleCrickets(dense) {
        if (!ambienceStarted) return;
        playCricketPulse(dense ? 0.16 : 0.12);
        const next = dense ? 500 + Math.random() * 500 : 1300 + Math.random() * 1600;
        setTimeout(() => scheduleCrickets(dense), next);
    }

    function scheduleOwl() {
        if (!ambienceStarted) return;
        setTimeout(() => {
            playOwlHoot();
            scheduleOwl();
        }, 9000 + Math.random() * 8000);
    }

    function startAmbience() {
        if (ambienceStarted) return;
        ensureAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        ambienceStarted = true;
        setAmbientVolume(1 - Math.min(window.scrollY / fadeDistance, 1));

        if (period === 'morning') {
            startWind();
            scheduleBirds();
        } else if (period === 'afternoon') {
            startWind();
        } else if (period === 'evening') {
            startWind();
            scheduleCrickets(false);
        } else {
            scheduleCrickets(true);
            scheduleOwl();
        }
    }

    ['click', 'touchstart', 'keydown', 'wheel'].forEach((evt) => {
        window.addEventListener(evt, startAmbience, { once: true, passive: true });
    });

    const muteBtn = document.getElementById('mute-toggle');
    muteBtn.addEventListener('click', () => {
        startAmbience();
        muted = !muted;
        muteBtn.textContent = muted ? '🔇' : '🔊';
        if (masterGain) {
            masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, audioCtx.currentTime, 0.1);
        }
    });
})();
