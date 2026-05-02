import { setState, state } from './state.js';
import { getNotes } from './tuning.js';

let audioContext = null;
let masterGain = null;
let voices = [];

export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

export function stopAudio() {
  if (!audioContext) return;

  voices.forEach(({ oscillator, gainNode }) => {
    try {
      gainNode.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.04);
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch (error) {
      console.warn('Unable to stop oscillator cleanly.', error);
    }
  });

  voices = [];
  setState({ isPlaying: false });
}

export function playChord({ waveform = 'sine', volume = 0.32 } = {}) {
  initAudio();
  stopAudio();

  masterGain.gain.value = volume;
  setState({ isPlaying: true });

  const noteList = state.tuning === 'both'
    ? [
        ...getNotes('equal', state.base, state.root, state.chord).map((note) => ({ ...note, pan: -0.35 })),
        ...getNotes('natural', state.base, state.root, state.chord).map((note) => ({ ...note, pan: 0.35 })),
      ]
    : getNotes(state.tuning, state.base, state.root, state.chord).map((note) => ({ ...note, pan: 0 }));

  noteList.forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    const targetGain = (volume * 0.9) / Math.max(2, noteList.length);

    oscillator.type = waveform;
    oscillator.frequency.value = note.freq;
    panner.pan.value = note.pan;
    gainNode.gain.value = 0.0001;

    oscillator.connect(gainNode).connect(panner).connect(masterGain);
    oscillator.start();
    gainNode.gain.setTargetAtTime(targetGain, audioContext.currentTime + 0.01, 0.05);

    voices.push({ oscillator, gainNode });
  });
}

export function setVolume(volume) {
  if (masterGain) {
    masterGain.gain.value = volume;
  }
}
