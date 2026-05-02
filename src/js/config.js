/**
 * Configuration & Constants
 * 432 vs 440 Hz Comparator
 */

// Musical Constants
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORDS = {
  major: {
    label: 'Major',
    labelES: 'Mayor',
    intervals: [0, 4, 7],
    ratios: [1, 5 / 4, 3 / 2],
  },
  minor: {
    label: 'Minor',
    labelES: 'Menor',
    intervals: [0, 3, 7],
    ratios: [1, 6 / 5, 3 / 2],
  },
  maj7: {
    label: 'Maj7',
    labelES: 'Maj7',
    intervals: [0, 4, 7, 11],
    ratios: [1, 5 / 4, 3 / 2, 15 / 8],
  },
  min7: {
    label: 'm7',
    labelES: 'm7',
    intervals: [0, 3, 7, 10],
    ratios: [1, 6 / 5, 3 / 2, 9 / 5],
  },
  dom7: {
    label: '7',
    labelES: '7',
    intervals: [0, 4, 7, 10],
    ratios: [1, 5 / 4, 3 / 2, 7 / 4],
  },
  sus4: {
    label: 'Sus4',
    labelES: 'Sus4',
    intervals: [0, 5, 7],
    ratios: [1, 4 / 3, 3 / 2],
  },
  add9: {
    label: 'Add9',
    labelES: 'Add9',
    intervals: [0, 4, 7, 14],
    ratios: [1, 5 / 4, 3 / 2, 9 / 4],
  },
  fifth: {
    label: 'Fifth',
    labelES: 'Quinta',
    intervals: [0, 7, 12],
    ratios: [1, 3 / 2, 2],
  },
};

// Application State
export const initialState = {
  root: 'C',
  chord: 'maj7',
  base: 432,
  tuning: 'equal', // 'equal', 'natural', 'both'
  language: 'en',
};

// Audio Config
export const AUDIO_CONFIG = {
  minVolume: 0,
  maxVolume: 0.4,
  defaultVolume: 0.4,
  minVisualSpeed: 0.25,
  maxVisualSpeed: 3,
  defaultVisualSpeed: 1,
  waveforms: ['sine', 'triangle', 'sawtooth'],
  defaultWaveform: 'sine',
};

// Visual Config
export const VISUAL_CONFIG = {
  canvasScale: 0.42,
  minCanvasWidth: 220,
  minCanvasHeight: 160,
  canvasHeight: 300,
  canvasTallHeight: 430,
};

// Utility Functions
export function getMidiNote(note, octave = 4) {
  return 12 * (octave + 1) + NOTES.indexOf(note);
}

export function getEqualFrequency(note, octave, base) {
  return base * Math.pow(2, (getMidiNote(note, octave) - 69) / 12);
}

export function getChordData(chordKey) {
  return CHORDS[chordKey] || CHORDS.maj7;
}

export function formatNumber(value, decimals = 2) {
  return Number(value)
    .toFixed(decimals)
    .replace('.00', '');
}

export function getCentsDeviation(freqA, freqB) {
  return 1200 * Math.log2(freqB / freqA);
}
