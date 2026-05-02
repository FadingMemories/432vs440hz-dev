import { CHORDS, NOTES } from './chords.js';

export function getMidiNote(note, octave = 4) {
  return 12 * (octave + 1) + NOTES.indexOf(note);
}

export function getEqualFrequency(note, octave, base) {
  return base * Math.pow(2, (getMidiNote(note, octave) - 69) / 12);
}

export function calculateFrequency(root, interval, ratio, base, tuning = 'equal') {
  const rootFrequency = getEqualFrequency(root, 4, base);
  return tuning === 'natural'
    ? rootFrequency * ratio
    : rootFrequency * Math.pow(2, interval / 12);
}

export function getNotes(tuning, base, root, chordKey) {
  const chord = CHORDS[chordKey] || CHORDS.maj7;
  const rootIndex = NOTES.indexOf(root);

  return chord.intervals.map((interval, index) => {
    const absoluteIndex = rootIndex + interval;
    const noteIndex = absoluteIndex % 12;
    const octave = 4 + Math.floor(absoluteIndex / 12);
    const freq = calculateFrequency(root, interval, chord.ratios[index], base, tuning);
    const equalFreq = calculateFrequency(root, interval, chord.ratios[index], base, 'equal');

    return {
      note: `${NOTES[noteIndex]}${octave}`,
      freq,
      ratio: chord.ratios[index],
      cents: 1200 * Math.log2(freq / equalFreq),
    };
  });
}

export function getCentsDeviation(freqA, freqB) {
  return 1200 * Math.log2(freqB / freqA);
}

export function formatNumber(value, decimals = 2) {
  return Number(value).toFixed(decimals).replace('.00', '');
}
