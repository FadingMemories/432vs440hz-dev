export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORDS = {
  major: { label: 'Major', intervals: [0, 4, 7], ratios: [1, 5 / 4, 3 / 2] },
  minor: { label: 'Minor', intervals: [0, 3, 7], ratios: [1, 6 / 5, 3 / 2] },
  maj7: { label: 'Maj7', intervals: [0, 4, 7, 11], ratios: [1, 5 / 4, 3 / 2, 15 / 8] },
  min7: { label: 'm7', intervals: [0, 3, 7, 10], ratios: [1, 6 / 5, 3 / 2, 9 / 5] },
  dom7: { label: '7', intervals: [0, 4, 7, 10], ratios: [1, 5 / 4, 3 / 2, 7 / 4] },
  sus4: { label: 'Sus4', intervals: [0, 5, 7], ratios: [1, 4 / 3, 3 / 2] },
  add9: { label: 'Add9', intervals: [0, 4, 7, 14], ratios: [1, 5 / 4, 3 / 2, 9 / 4] },
  fifth: { label: 'Fifth', intervals: [0, 7, 12], ratios: [1, 3 / 2, 2] },
};

export const CHORD_KEYS = Object.keys(CHORDS);
