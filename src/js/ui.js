/**
 * UI Management & DOM Manipulation
 * 432 vs 440 Hz Comparator
 */

import { NOTES, CHORDS, formatNumber, getCentsDeviation, getEqualFrequency } from './config.js';
import { getNotes } from './audio.js';
import { t } from './i18n.js';

/**
 * Query selector helper
 */
export function $(id) {
  return document.getElementById(id);
}

/**
 * Initialize UI elements
 */
export function initUI(state, onRootChange, onChordChange, onPlayClick, onStopClick) {
  // Populate root note select
  NOTES.forEach((note) => {
    const opt = document.createElement('option');
    opt.value = note;
    opt.textContent = note;
    $('rootSelect')?.appendChild(opt);

    const mobileOpt = document.createElement('option');
    mobileOpt.value = note;
    mobileOpt.textContent = note;
    $('mobileRootSelect')?.appendChild(mobileOpt);
  });

  // Set initial root
  $('rootSelect').value = state.root;
  $('mobileRootSelect').value = state.root;

  // Populate chord buttons and select
  Object.entries(CHORDS).forEach(([key, chordData]) => {
    // Chord select (mobile)
    const selectOpt = document.createElement('option');
    selectOpt.value = key;
    selectOpt.textContent = chordData.label;
    $('mobileChordSelect')?.appendChild(selectOpt);

    // Chord buttons (desktop)
    const btn = document.createElement('button');
    btn.className = `chord-btn ghost ${key === state.chord ? 'active' : ''}`;
    btn.textContent = chordData.label;
    btn.onclick = () => onChordChange(key, btn);
    $('chordButtons')?.appendChild(btn);
  });

  $('mobileChordSelect').value = state.chord;

  // Populate keyboard
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'D'].forEach((note) => {
    const btn = document.createElement('button');
    btn.className = `key ${note.includes('#') ? 'black' : ''}`;
    btn.textContent = note;
    btn.onclick = () => {
      state.root = note;
      $('rootSelect').value = note;
      updateUI(state);
      onPlayClick();
    };
    $('keyboard')?.appendChild(btn);
  });

  // Event listeners
  $('rootSelect').onchange = (e) => {
    state.root = e.target.value;
    onRootChange(state.root);
    updateUI(state);
  };

  $('mobileRootSelect').onchange = (e) => {
    state.root = e.target.value;
    onRootChange(state.root);
    updateUI(state);
  };

  $('mobileChordSelect').onchange = (e) => {
    onChordChange(e.target.value);
  };

  $('playBtn').onclick = onPlayClick;
  $('mobilePlayBtn').onclick = onPlayClick;
  $('stopBtn').onclick = onStopClick;
  $('mobileStopBtn').onclick = onStopClick;
  $('mobileRandomBtn').onclick = () => $('randomChord')?.click();
}

/**
 * Update UI with current state
 */
export function updateUI(state) {
  const chordData = CHORDS[state.chord];

  // Chord name
  const chordName = $('chordName');
  if (chordName) {
    chordName.textContent = state.root + ' ' + chordData.label;
  }

  // Readout values
  const baseReadout = $('baseReadout');
  if (baseReadout) baseReadout.textContent = state.base;

  const systemReadout = $('systemReadout');
  if (systemReadout) {
    if (state.tuning === 'equal') systemReadout.textContent = 'Equal';
    else if (state.tuning === 'natural') systemReadout.textContent = 'Natural';
    else systemReadout.textContent = 'Both';
  }

  const spreadReadout = $('spreadReadout');
  if (spreadReadout) {
    const notes432 = getNotes('equal', 432, state.root, state.chord);
    const notes440 = getNotes('equal', 440, state.root, state.chord);
    const cents = getCentsDeviation(notes432[0].freq, notes440[0].freq);
    spreadReadout.textContent = '+' + formatNumber(cents, 1) + '¢';
  }

  // Mark active keys on keyboard
  const active = new Set(
    chordData.intervals.map((interval) => NOTES[(NOTES.indexOf(state.root) + interval) % 12])
  );
  document.querySelectorAll('.key').forEach((key) => {
    key.classList.toggle('on', active.has(key.textContent));
  });

  // Update frequency table
  updateNoteTable(state);
}

/**
 * Update note frequency table
 */
function updateNoteTable(state) {
  const tableContainer = $('noteTable');
  if (!tableContainer) return;

  const notes432 = getNotes('equal', 432, state.root, state.chord);
  const notes440 = getNotes('equal', 440, state.root, state.chord);
  const notesNatural = getNotes('natural', 432, state.root, state.chord);

  let html = '<div class="row"><strong>Note</strong><strong>432 Hz</strong><strong>440 Hz</strong><strong>Natural</strong></div>';

  notes432.forEach((n, i) => {
    html += `<div class="row">
      <strong>${n.note}</strong>
      <span>${formatNumber(notes432[i].freq)} Hz</span>
      <span>${formatNumber(notes440[i].freq)} Hz</span>
      <span>${formatNumber(notesNatural[i].cents, 1)}¢</span>
    </div>`;
  });

  tableContainer.innerHTML = html;
}

/**
 * Toggle active state on frequency buttons (432/440)
 */
export function setActiveBase(base) {
  const btn432Visual = $('listen432Visual');
  const btn440Visual = $('listen440Visual');
  if (btn432Visual) btn432Visual.classList.toggle('active', base === 432);
  if (btn440Visual) btn440Visual.classList.toggle('active', base === 440);

  const plate432 = $('listen432Plate');
  const plate440 = $('listen440Plate');
  if (plate432) plate432.classList.toggle('active', base === 432);
  if (plate440) plate440.classList.toggle('active', base === 440);
}

/**
 * Mark active chord button
 */
export function markChordActive(chordKey) {
  document.querySelectorAll('.chord-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  const chordIndex = Object.keys(CHORDS).indexOf(chordKey);
  if (chordIndex >= 0) {
    const buttons = document.querySelectorAll('.chord-btn');
    if (buttons[chordIndex]) {
      buttons[chordIndex].classList.add('active');
    }
  }
}
