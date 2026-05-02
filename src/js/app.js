/**
 * Main Application Entry Point
 * 432 vs 440 Hz Comparator
 * Orchestrates all modules: audio, visual, UI, i18n
 */

import { initialState, getChordData, NOTES } from './config.js';
import { initAudio, playChord, stopAudio, getIsPlaying, getNotes, setVolume } from './audio.js';
import { drawHarmonicGeometry, drawConsonancePlate } from './visual.js';
import { $, initUI, updateUI, setActiveBase, markChordActive } from './ui.js';
import { initI18n } from './i18n.js';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let state = { ...initialState };
let nodalDirty = true;
let animationStart = performance.now();
let pausedVisualTime = 0;

// ============================================================================
// STATE SETTERS
// ============================================================================

function setState(newState) {
  state = { ...state, ...newState };
}

function setChord(chordKey) {
  state.chord = chordKey;
  markChordActive(chordKey);
  $('mobileChordSelect').value = chordKey;
  updateUI(state);
  markNodalDirty();
  if (getIsPlaying()) playCurrentChord();
}

function setRoot(root) {
  state.root = root;
  $('rootSelect').value = root;
  $('mobileRootSelect').value = root;
  updateUI(state);
  markNodalDirty();
  if (getIsPlaying()) playCurrentChord();
}

function setBase(base) {
  state.base = base;
  setActiveBase(base);
  updateUI(state);
  markNodalDirty();
  if (getIsPlaying()) playCurrentChord();
}

function markNodalDirty() {
  nodalDirty = true;
}

// ============================================================================
// AUDIO PLAYBACK
// ============================================================================

function playCurrentChord() {
  const volume = parseFloat($('volume').value);
  const waveform = $('waveform').value;
  playChord(state.root, state.chord, state.base, state.tuning, waveform, volume);
}

function handlePlayClick() {
  initAudio();
  playCurrentChord();
}

function handleStopClick() {
  stopAudio();
}

// ============================================================================
// VISUALIZATION & ANIMATION LOOP
// ============================================================================

function render(now) {
  let t;
  if (getIsPlaying()) {
    t = (now - animationStart) / 1000;
    pausedVisualTime = t;
  } else {
    t = pausedVisualTime;
  }

  // Draw harmonic geometries
  drawHarmonicGeometry('waveCanvas', 432, true, t, state);
  drawHarmonicGeometry('circleCanvas', 440, false, t, state);

  // Draw consonance plate (only if dirty)
  if (nodalDirty) {
    drawConsonancePlate('consonanceCanvas', state);
  }

  requestAnimationFrame(render);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Chord selection
  $('listen432Visual').onclick = () => setBase(432);
  $('listen440Visual').onclick = () => setBase(440);
  $('listen432Plate').onclick = () => setBase(432);
  $('listen440Plate').onclick = () => setBase(440);

  // Volume control
  $('volume').oninput = () => {
    setVolume(parseFloat($('volume').value));
  };

  // Visual speed control
  $('resetSpeed').onclick = () => {
    $('visualSpeed').value = 1;
  };

  $('waveform').onchange = () => {
    if (getIsPlaying()) playCurrentChord();
  };

  // Random chord
  $('randomChord').onclick = () => {
    const chordKeys = ['major', 'minor', 'maj7', 'min7', 'dom7', 'sus4', 'add9', 'fifth'];
    const randomRoot = NOTES[Math.floor(Math.random() * NOTES.length)];
    const randomChord = chordKeys[Math.floor(Math.random() * chordKeys.length)];

    setState({ root: randomRoot, chord: randomChord });
    updateUI(state);
    markNodalDirty();
    playCurrentChord();
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
  // Initialize i18n system
  initI18n();

  // Initialize UI
  initUI(
    state,
    setRoot,    // onRootChange
    setChord,   // onChordChange
    handlePlayClick, // onPlayClick
    handleStopClick  // onStopClick
  );

  // Initial state display
  updateUI(state);

  // Setup event listeners
  setupEventListeners();

  // Start animation loop
  animationStart = performance.now();
  requestAnimationFrame(render);
}

// ============================================================================
// START APPLICATION
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
window.app = {
  state,
  setState,
  setChord,
  setRoot,
  setBase,
};
