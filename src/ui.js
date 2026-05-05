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
  initTutorial();
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
      updatePlayButtonText();
    });
    $('keyboard').appendChild(button);
  });
}

function bindStaticControls(actions) {
  const togglePlayback = () => {
    if (state.isPlaying) actions.stop();
    else actions.play();
    updatePlayButtonText();
  };

  $('playBtn')?.addEventListener('click', togglePlayback);
  $('mobilePlayBtn')?.addEventListener('click', togglePlayback);
  $('randomChord')?.addEventListener('click', () => randomizeChord(actions));
  $('mobileRandomBtn')?.addEventListener('click', () => randomizeChord(actions));

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
  updatePlayButtonText();
  updateKeyboard(chord);
  updateNoteTable();
}

function updatePlayButtonText() {
  const label = state.isPlaying ? 'Stop' : 'Play';
  ['playBtn', 'mobilePlayBtn'].forEach((id) => {
    const button = $(id);
    if (!button) return;
    button.textContent = label;
    button.dataset.actionIcon = state.isPlaying ? 'stop' : 'play';
    button.setAttribute('aria-pressed', String(state.isPlaying));
  });
}

function initTutorial() {
  if (window.matchMedia('(max-width: 720px)').matches) return;

  const overlay = $('tutorialOverlay');
  const coach = document.querySelector('.tutorial-coach');
  const spotlight = $('tutorialSpotlight');
  const eyebrow = $('tutorialEyebrow');
  const title = $('tutorialTitle');
  const text = $('tutorialText');
  const hint = $('tutorialHint');
  if (!overlay || !coach || !spotlight || !eyebrow || !title || !text || !hint) return;

  const storageKey = '432vs440hz:guidedTutorialSeen:v3';
  let requiredBase = 440;
  const steps = [
    {
      title: () => t('tutorialPlayTitle'),
      text: () => t('tutorialPlayText'),
      getTarget: () => getFirstVisibleElement(['#playBtn', '#mobilePlayBtn']),
      isMatch: (target) => Boolean(target.closest?.('#playBtn, #mobilePlayBtn')),
    },
    {
      title: () => t('tutorialCompareTitle'),
      text: () => requiredBase === 440
        ? t('tutorialCompare440Text')
        : t('tutorialCompare432Text'),
      getTarget: () => requiredBase === 440
        ? getFirstVisibleElement(['#listen440Visual', '#listen440Plate'])
        : getFirstVisibleElement(['#listen432Visual', '#listen432Plate']),
      isMatch: (target) => Boolean(target.closest?.(
        requiredBase === 440
          ? '#listen440Visual, #listen440Plate'
          : '#listen432Visual, #listen432Plate'
      )),
      onComplete: () => {
        if (requiredBase === 440) {
          requiredBase = 432;
          renderStep();
          return false;
        }
        return true;
      },
    },
    {
      title: () => t('tutorialRandomTitle'),
      text: () => t('tutorialRandomText'),
      getTarget: () => getFirstVisibleElement(['#randomChord', '#mobileRandomBtn']),
      isMatch: (target) => Boolean(target.closest?.('#randomChord, #mobileRandomBtn')),
    },
    {
      title: () => t('tutorialPlateTitle'),
      text: () => t('tutorialPlateText'),
      getTarget: () => getFirstVisibleElement(['.plate-actions', '#listen432Plate', '#listen440Plate']),
      isMatch: (target) => Boolean(target.closest?.('#listen432Plate, #listen440Plate')),
    },
  ];
  let currentStep = 0;

  const hasSeenTutorial = () => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch (error) {
      return false;
    }
  };

  const markSeen = () => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch (error) {
      // Browsers can disable storage; the tutorial still works for the session.
    }
  };

  const clamp = (value, min, max) => {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  };

  const positionTutorial = () => {
    const target = steps[currentStep]?.getTarget();
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const padding = 8;
    spotlight.style.top = `${rect.top - padding}px`;
    spotlight.style.left = `${rect.left - padding}px`;
    spotlight.style.width = `${rect.width + padding * 2}px`;
    spotlight.style.height = `${rect.height + padding * 2}px`;

    const coachRect = coach.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 14;
    const left = clamp(
      rect.left + rect.width / 2 - coachRect.width / 2,
      12,
      viewportWidth - coachRect.width - 12
    );
    let top = rect.bottom + gap;
    if (top + coachRect.height > viewportHeight - 12) {
      top = rect.top - coachRect.height - gap;
    }
    coach.style.left = `${left}px`;
    coach.style.top = `${Math.max(12, top)}px`;
  };

  function renderStep() {
    const step = steps[currentStep];
    eyebrow.textContent = t('tutorialEyebrow');
    hint.textContent = t('tutorialHint');
    title.textContent = typeof step.title === 'function' ? step.title() : step.title;
    text.textContent = typeof step.text === 'function' ? step.text() : step.text;
    document.querySelectorAll('[data-tutorial-dot]').forEach((dot) => {
      dot.classList.toggle('active', Number(dot.dataset.tutorialDot) === currentStep);
    });
    step.getTarget()?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    positionTutorial();
    window.setTimeout(positionTutorial, 260);
  }

  const closeTutorial = () => {
    markSeen();
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('click', handleTutorialAction, true);
    document.removeEventListener('change', handleTutorialAction, true);
    window.removeEventListener('resize', positionTutorial);
    window.removeEventListener('scroll', positionTutorial, true);
    window.removeEventListener('languagechange', renderStep);
  };

  if (hasSeenTutorial()) return;

  function handleTutorialAction(event) {
    const step = steps[currentStep];
    if (!step?.isMatch(event.target, event.type)) return;

    const shouldAdvance = step.onComplete ? step.onComplete() : true;
    if (!shouldAdvance) return;

    currentStep += 1;
    if (currentStep >= steps.length) {
      closeTutorial();
      return;
    }
    renderStep();
  }

  overlay.classList.add('is-visible');
  overlay.setAttribute('aria-hidden', 'false');
  renderStep();
  document.addEventListener('click', handleTutorialAction, true);
  document.addEventListener('change', handleTutorialAction, true);
  window.addEventListener('resize', positionTutorial);
  window.addEventListener('scroll', positionTutorial, true);
  window.addEventListener('languagechange', renderStep);
}

function getFirstVisibleElement(selectors) {
  for (const selector of selectors) {
    const candidates = document.querySelectorAll(selector);
    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      const style = window.getComputedStyle(candidate);
      if (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
        return candidate;
      }
    }
  }
  return null;
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
    const button = $(id);
    button?.classList.toggle('active', base === 432);
    button?.setAttribute('aria-pressed', String(base === 432));
  });
  ['listen440Visual', 'listen440Plate'].forEach((id) => {
    const button = $(id);
    button?.classList.toggle('active', base === 440);
    button?.setAttribute('aria-pressed', String(base === 440));
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
  updatePlayButtonText();
}
