import { CHORD_KEYS, CHORDS, NOTES } from './chords.js';
import { markNodalDirty, setState, state } from './state.js';
import { formatNumber, getCentsDeviation, getNotes } from './tuning.js';
import { t } from './i18n.js';

export function $(id) {
  return document.getElementById(id);
}

export function initUI(actions) {
  populateRootSelects(actions);
  populateChordControls(actions);
  populateKeyboard(actions);
  bindStaticControls(actions);
  updateUI();
}

function populateRootSelects(actions) {
  NOTES.forEach((note) => {
    ['rootSelect', 'mobileRootSelect'].forEach((id) => {
      const select = $(id);
      if (!select) return;
      const option = document.createElement('option');
      option.value = note;
      option.textContent = note;
      select.appendChild(option);
    });
  });

  if ($('rootSelect')) $('rootSelect').value = state.root;
  if ($('mobileRootSelect')) $('mobileRootSelect').value = state.root;

  ['rootSelect', 'mobileRootSelect'].forEach((id) => {
    const select = $(id);
    if (!select) return;
    select.addEventListener('change', (event) => {
      setState({ root: event.target.value });
      markNodalDirty();
      syncControls();
      updateUI();
      actions.replayIfNeeded();
    });
  });
}

function populateChordControls(actions) {
  CHORD_KEYS.forEach((key) => {
    const chord = CHORDS[key];
    const option = document.createElement('option');
    option.value = key;
    option.textContent = chord.label;
    $('mobileChordSelect')?.appendChild(option);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chord-btn ghost ${key === state.chord ? 'active' : ''}`;
    button.textContent = chord.label;
    button.dataset.chord = key;
    button.addEventListener('click', () => {
      setState({ chord: key });
      markNodalDirty();
      syncControls();
      updateUI();
      actions.replayIfNeeded();
    });
    $('chordButtons').appendChild(button);
  });

  if ($('mobileChordSelect')) $('mobileChordSelect').value = state.chord;
  $('mobileChordSelect')?.addEventListener('change', (event) => {
    setState({ chord: event.target.value });
    markNodalDirty();
    syncControls();
    updateUI();
    actions.replayIfNeeded();
  });
}

function populateKeyboard(actions) {
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'D'].forEach((note) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `key ${note.includes('#') ? 'black' : ''}`;
    button.textContent = note;
    button.addEventListener('click', () => {
      setState({ root: note });
      markNodalDirty();
      syncControls();
      updateUI();
      actions.play();
    });
    $('keyboard').appendChild(button);
  });
}

function bindStaticControls(actions) {
  $('playBtn').addEventListener('click', actions.play);
  $('mobilePlayBtn').addEventListener('click', actions.play);
  $('stopBtn').addEventListener('click', actions.stop);
  $('mobileStopBtn').addEventListener('click', actions.stop);
  $('mobileRandomBtn').addEventListener('click', () => randomizeChord(actions));

  $('listen432Visual').addEventListener('click', () => actions.setBase(432));
  $('listen440Visual').addEventListener('click', () => actions.setBase(440));
  $('listen432Plate').addEventListener('click', () => actions.setBase(432));
  $('listen440Plate').addEventListener('click', () => actions.setBase(440));

  const volumeSlider = $('volume');
  const mobileVolumeSlider = $('mobileVolume');

  function syncVolume(value) {
    if (volumeSlider) volumeSlider.value = value;
    if (mobileVolumeSlider) mobileVolumeSlider.value = value;
    actions.setVolume(value);
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (event) => {
      syncVolume(parseFloat(event.target.value));
    });
  }

  if (mobileVolumeSlider) {
    mobileVolumeSlider.addEventListener('input', (event) => {
      syncVolume(parseFloat(event.target.value));
    });
  }

  $('waveform').addEventListener('change', actions.replayIfNeeded);
  $('visualSpeed').addEventListener('input', markNodalDirty);
  $('resetSpeed').addEventListener('click', () => {
    $('visualSpeed').value = 1;
    markNodalDirty();
  });
  $('randomChord').addEventListener('click', () => randomizeChord(actions));
}

export function getPlaybackSettings() {
  return {
    waveform: $('waveform')?.value || 'sine',
    volume: parseFloat($('volume')?.value || 0.32),
  };
}

export function syncControls() {
  if ($('rootSelect')) $('rootSelect').value = state.root;
  if ($('mobileRootSelect')) $('mobileRootSelect').value = state.root;
  if ($('mobileChordSelect')) $('mobileChordSelect').value = state.chord;

  document.querySelectorAll('.chord-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.chord === state.chord);
  });
}

export function updateUI() {
  const chord = CHORDS[state.chord] || CHORDS.maj7;
  const notes432 = getNotes('equal', 432, state.root, state.chord);
  const notes440 = getNotes('equal', 440, state.root, state.chord);
  const cents = getCentsDeviation(notes432[0].freq, notes440[0].freq);

  const activeChordLabel = `${state.root} ${chord.label}`;
  $('chordName').textContent = activeChordLabel;
  $('baseReadout').textContent = state.base;
  $('systemReadout').textContent = state.tuning === 'equal' ? 'Equal' : state.tuning;
  $('spreadReadout').textContent = `+${formatNumber(cents, 1)} cents`;

  setActiveBase(state.base);
  updateKeyboard(chord);
  updateNoteTable();
}

function updateKeyboard(chord) {
  const activeNotes = new Set(
    chord.intervals.map((interval) => NOTES[(NOTES.indexOf(state.root) + interval) % 12])
  );

  document.querySelectorAll('.key').forEach((button) => {
    button.classList.toggle('on', activeNotes.has(button.textContent));
  });
}

function updateNoteTable() {
  const table = $('noteTable');
  const notes432 = getNotes('equal', 432, state.root, state.chord);
  const notes440 = getNotes('equal', 440, state.root, state.chord);
  const natural = getNotes('natural', 432, state.root, state.chord);
  const rows = [
    '<div class="row"><strong>Note</strong><strong>432 Hz</strong><strong>440 Hz</strong><strong>Natural</strong></div>',
    ...notes432.map((note, index) => `<div class="row">
      <strong>${note.note}</strong>
      <span>${formatNumber(notes432[index].freq)} Hz</span>
      <span>${formatNumber(notes440[index].freq)} Hz</span>
      <span>${formatNumber(natural[index].cents, 1)} cents</span>
    </div>`),
  ];

  table.innerHTML = rows.join('');
  table.setAttribute('aria-label', `${t('notesAndProportions')}: ${state.root} ${CHORDS[state.chord].label}`);
}

function setActiveBase(base) {
  ['listen432Visual', 'listen432Plate'].forEach((id) => {
    $(id)?.classList.toggle('active', base === 432);
  });
  ['listen440Visual', 'listen440Plate'].forEach((id) => {
    $(id)?.classList.toggle('active', base === 440);
  });

  document.querySelectorAll('[data-tuning-card]').forEach((card) => {
    const cardBase = Number(card.dataset.tuningCard);
    card.classList.toggle('is-muted', cardBase !== base);
    card.classList.toggle('is-listening', cardBase === base);
  });
}

function randomizeChord(actions) {
  const randomRoot = NOTES[Math.floor(Math.random() * NOTES.length)];
  const randomChord = CHORD_KEYS[Math.floor(Math.random() * CHORD_KEYS.length)];
  setState({ root: randomRoot, chord: randomChord });
  markNodalDirty();
  syncControls();
  updateUI();
  actions.play();
}
