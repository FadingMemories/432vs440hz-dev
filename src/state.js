export const state = {
  root: 'C',
  chord: 'maj7',
  base: 432,
  tuning: 'equal',
  isPlaying: false,
  nodalDirty: true,
};

export function setState(patch) {
  Object.assign(state, patch);
}

export function markNodalDirty() {
  state.nodalDirty = true;
}
