/**
 * Audio Synthesis & Playback
 * 432 vs 440 Hz Comparator
 */

import { NOTES, CHORDS, getEqualFrequency, getMidiNote } from './config.js';

let audioContext = null;
let masterGain = null;
let oscillators = [];
let isPlaying = false;

/**
 * Initialize Web Audio API context
 */
export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

/**
 * Get current playback state
 */
export function getIsPlaying() {
  return isPlaying;
}

/**
 * Calculate frequency from note, interval, ratio, base and tuning system
 */
function calculateFrequency(root, interval, ratio, base, tuning) {
  const rootFreq = getEqualFrequency(root, 4, base);

  if (tuning === 'natural') {
    return rootFreq * ratio;
  }
  // equal tuning
  return rootFreq * Math.pow(2, interval / 12);
}

/**
 * Get all notes for current chord state
 */
export function getNotes(tuning, base, root, chordKey) {
  const chordData = CHORDS[chordKey];
  if (!chordData) return [];

  return chordData.intervals.map((interval, i) => {
    const noteIndex = (NOTES.indexOf(root) + interval) % 12;
    const octave = 4 + Math.floor((NOTES.indexOf(root) + interval) / 12);
    const freq = calculateFrequency(root, interval, chordData.ratios[i], base, tuning);
    const equalFreq = calculateFrequency(root, interval, chordData.ratios[i], base, 'equal');

    return {
      note: NOTES[noteIndex] + octave,
      freq,
      ratio: chordData.ratios[i],
      cents: 1200 * Math.log2(freq / equalFreq),
    };
  });
}

/**
 * Stop all currently playing oscillators
 */
export function stopAudio() {
  if (!audioContext) return;

  oscillators.forEach((osc) => {
    try {
      osc.gainNode.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.04);
      osc.oscillator.stop(audioContext.currentTime + 0.12);
    } catch (e) {
      console.warn('Error stopping oscillator:', e);
    }
  });

  oscillators = [];
  isPlaying = false;
}

/**
 * Play chord with given parameters
 */
export function playChord(root, chordKey, base, tuning, waveform, volume) {
  initAudio();
  stopAudio();

  masterGain.gain.value = volume;
  isPlaying = true;

  let noteList =
    tuning === 'both'
      ? [
          ...getNotes('equal', base, root, chordKey).map((n) => ({ ...n, pan: -0.35 })),
          ...getNotes('natural', base, root, chordKey).map((n) => ({ ...n, pan: 0.35 })),
        ]
      : getNotes(tuning, base, root, chordKey).map((n) => ({ ...n, pan: 0 }));

  noteList.forEach((note) => {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    osc.type = waveform;
    osc.frequency.value = note.freq;
    panner.pan.value = note.pan;
    gainNode.gain.value = 0.0001;

    osc.connect(gainNode).connect(panner).connect(masterGain);
    osc.start();

    const targetGain = (volume * 0.9) / Math.max(2, noteList.length);
    gainNode.gain.setTargetAtTime(targetGain, audioContext.currentTime + 0.01, 0.05);

    oscillators.push({ oscillator: osc, gainNode });
  });
}

/**
 * Update master volume
 */
export function setVolume(volume) {
  if (!masterGain) return;
  masterGain.gain.value = volume;
}
