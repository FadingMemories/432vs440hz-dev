import { initAudio, playChord, setVolume, stopAudio } from './audioEngine.js';
import { initI18n } from './i18n.js';
import { initSeo } from './seo.js';
import { markNodalDirty, setState, state } from './state.js';
import { drawConsonancePlate, drawHarmonicGeometry } from './visualEngine.js';
import { getPlaybackSettings, initUI, updateUI } from './ui.js';

let animationStart = performance.now();
let pausedVisualTime = 0;

function play() {
  initAudio();
  playChord(getPlaybackSettings());
}

function stop() {
  stopAudio();
}

function replayIfNeeded() {
  if (state.isPlaying) {
    playChord(getPlaybackSettings());
  }
}

function setBase(base) {
  setState({ base });
  markNodalDirty();
  updateUI();
  replayIfNeeded();
}

function render(now) {
  let time = pausedVisualTime;

  if (state.isPlaying) {
    time = (now - animationStart) / 1000;
    pausedVisualTime = time;
  }

  drawHarmonicGeometry('waveCanvas', 432, true, time);
  drawHarmonicGeometry('circleCanvas', 440, false, time);

  if (state.nodalDirty) {
    drawConsonancePlate('consonanceCanvas');
    state.nodalDirty = false;
  }

  requestAnimationFrame(render);
}

function init() {
  initSeo();
  initI18n();
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  const advancedControls = document.querySelector('.advanced');
  if (mobileQuery.matches) advancedControls?.removeAttribute('open');
  const handleViewportChange = (event) => {
    if (event.matches) advancedControls?.removeAttribute('open');
    else advancedControls?.setAttribute('open', '');
  };
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', handleViewportChange);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(handleViewportChange);
  }
  initUI({
    play,
    stop,
    replayIfNeeded,
    setBase,
    setVolume,
  });

  animationStart = performance.now();
  requestAnimationFrame(render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
