import { initI18n } from './i18n.js';

const $ = (id) => document.getElementById(id);

const canvases = {
  waves: $('waves'),
};

const ctx = {
  waves: canvases.waves.getContext('2d'),
};

const bands = {
  delta: {
    title: 'Delta - deep rest',
    desc: 'Fundamental-adjacent carriers near 90 / 120 / 150 optimized for smoother harmonic relationships and reduced fatigue.',
    presets: [
      [96, 99, 'Deep Rest 3 Hz', 'Near-ideal low carrier with highly stable restorative pulse.'],
      [117, 120, 'Balanced Delta 3 Hz', 'Close to 120 target with smoother resonance behavior.'],
      [144, 147, 'Bright Delta 3 Hz', 'Near 150 class but cleaner harmonic structure.'],
    ],
  },

  theta: {
    title: 'Theta - meditation',
    desc: 'Meditative presets using nearby harmonic sweet spots rather than arbitrary round numbers.',
    presets: [
      [96, 101, 'Grounding Theta 5 Hz', 'Low stable theta with soft perceptual load.'],
      [117, 123, 'Gateway Theta 6 Hz', 'Optimized mid-band meditation preset.'],
      [144, 151, 'Vision Theta 7 Hz', 'Bright but coherent visualization-focused theta.'],
    ],
  },

  alpha: {
    title: 'Alpha - relaxation',
    desc: 'Relaxation presets centered on stronger nearby fundamentals for stability and comfort.',
    presets: [
      [108, 116, 'Soft Alpha 8 Hz', 'Warm, highly sustainable alpha relaxation.'],
      [117, 125, 'Balanced Alpha 8 Hz', 'Near-120 harmonic optimization.'],
      [144, 154, 'Bright Alpha 10 Hz', 'Clearer cognitive freshness with better resonance.'],
    ],
  },

  beta: {
    title: 'Beta - focus',
    desc: 'Focus-oriented carriers adjusted toward cleaner structural frequency anchors.',
    presets: [
      [108, 122, 'Gentle Focus 14 Hz', 'Productive beta with lower fatigue.'],
      [126, 142, 'Work Beta 16 Hz', 'Strong attentional pacing near ideal beta fundamentals.'],
      [144, 162, 'Sharp Focus 18 Hz', 'High-performance focus with stable energetic structure.'],
    ],
  },

  gamma: {
    title: 'Gamma - alertness',
    desc: 'Experimental gamma presets using nearby structural anchors to reduce excessive harshness.',
    presets: [
      [108, 144, 'Soft Gamma 36 Hz', 'Lower-stress gamma with strong clarity.'],
      [126, 166, 'Balanced Gamma 40 Hz', 'Mid gamma with improved harmonic spread.'],
      [144, 188, 'Bright Gamma 44 Hz', 'High-energy preset using cleaner upper structure.'],
    ],
  },
};

let activeBand = 'theta';
let running = true;
let channelAMuted = false;
let channelBMuted = false;
let audioContext = null;
let oscA = null;
let oscB = null;
let gainA = null;
let gainB = null;
let merger = null;
let audioOn = false;
let startTime = performance.now();

function numberValue(id) {
  return parseFloat($(id).value);
}

function masterVolume() {
  return Math.max(0, parseFloat($('masterVolume')?.value) || 0);
}

function channelGain(isMuted) {
  return isMuted ? 0 : masterVolume();
}

function updateGains() {
  if (!audioOn) return;
  gainA.gain.value = channelGain(channelAMuted);
  gainB.gain.value = channelGain(channelBMuted);
}

function gcd(a, b) {
  let left = Math.round(Math.abs(a) * 10);
  let right = Math.round(Math.abs(b) * 10);
  while (right) {
    [left, right] = [right, left % right];
  }
  return left || 1;
}

function currentValues() {
  const rawA = Math.max(1, parseFloat($('fA').value) || 120);
  const rawB = Math.max(1, parseFloat($('fB').value) || 124);
  const fA = channelAMuted ? 0 : rawA;
  const fB = channelBMuted ? 0 : rawB;
  const beat = !channelAMuted && !channelBMuted ? Math.abs(rawB - rawA) : 0;
  const carrier = !channelAMuted && !channelBMuted ? (rawA + rawB) / 2 : channelAMuted ? rawB : rawA;
  const divisor = gcd(rawA, rawB);

  $('beat').textContent = beat.toFixed(2);
  $('carrier').textContent = carrier.toFixed(2);
  $('ratio').textContent = !channelAMuted && !channelBMuted
    ? `${Math.round(rawA * 10 / divisor)}:${Math.round(rawB * 10 / divisor)}`
    : '-';

  if ($('mobileFAInput')) {
    $('mobileFAInput').value = rawA;
  }
  if ($('mobileFBInput')) {
    $('mobileFBInput').value = rawB;
  }

  if (audioOn) {
    oscA.frequency.value = rawA;
    oscB.frequency.value = rawB;
  }

  return { fA, fB, rawA, rawB, beat, carrier };
}

function renderStillWave() {
  drawWavePanel(0, currentValues());
}

function renderPresetChips(bandKey) {
  const band = bands[bandKey];
  const row = $('presetChips');
  const description = $('bandDescription');

  if (!row || !description) return;

  row.innerHTML = '';
  description.textContent = band.desc;

  band.presets.forEach((preset, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'preset-chip' + (index === 0 ? ' active' : '');
    chip.innerHTML = `<strong>${preset[2]} - ${preset[0]} / ${preset[1]} Hz</strong><small>${preset[3]}</small>`;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach((button) => button.classList.remove('active'));
      chip.classList.add('active');
      $('fA').value = preset[0];
      $('fB').value = preset[1];
      renderStillWave();
    });
    row.appendChild(chip);
  });
}

function renderBand(bandKey) {
  const band = bands[bandKey];
  activeBand = bandKey;

  document.querySelectorAll('.band-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.band === bandKey);
  });

  $('bandTitle').textContent = band.title;
  $('fA').value = band.presets[0][0];
  $('fB').value = band.presets[0][1];
  renderPresetChips(bandKey);
  renderStillWave();
}

function clearWave(context) {
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(255,255,255,0.08)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  for (let x = 0; x < width; x += 60) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
}

function drawWavePanel(time, values) {
  const context = ctx.waves;
  const { width, height } = context.canvas;
  clearWave(context);

  const amp = numberValue('waveAmp') * height * 0.28;
  const visualScale = numberValue('waveSpeed');
  const phase = time * Math.PI * 2;
  const cyclesA = Math.max(1, values.rawA) / (120 / visualScale);
  const cyclesB = Math.max(1, values.rawB) / (120 / visualScale);

  const draw = (color, fn, lineWidth = 2.4) => {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.beginPath();
    for (let x = 0; x < width; x += 1) {
      const t = x / width;
      const y = height / 2 + fn(t) * amp;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  };

  if (!channelAMuted) {
    draw('rgba(255,100,100,0.8)', (t) => Math.sin(t * cyclesA * Math.PI * 2 + phase));
  }
  if (!channelBMuted) {
    draw('rgba(100,100,255,0.8)', (t) => Math.sin(t * cyclesB * Math.PI * 2 + phase));
  }
  if (!channelAMuted && !channelBMuted) {
    draw('rgba(255,255,255,0.9)', (t) => {
      const waveA = Math.sin(t * cyclesA * Math.PI * 2 + phase);
      const waveB = Math.sin(t * cyclesB * Math.PI * 2 + phase);
      return (waveA + waveB) / 2;
    }, 1.8);
  }
}

function loop(time) {
  if (!audioOn || !running) return;
  const values = currentValues();
  drawWavePanel((time - startTime) / 1000, values);
  requestAnimationFrame(loop);
}

async function startAudio() {
  if (audioOn) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  oscA = audioContext.createOscillator();
  oscB = audioContext.createOscillator();
  gainA = audioContext.createGain();
  gainB = audioContext.createGain();
  merger = audioContext.createChannelMerger(2);

  oscA.type = 'sine';
  oscB.type = 'sine';
  oscA.frequency.value = parseFloat($('fA').value);
  oscB.frequency.value = parseFloat($('fB').value);
  gainA.gain.value = channelGain(channelAMuted);
  gainB.gain.value = channelGain(channelBMuted);

  oscA.connect(gainA).connect(merger, 0, 0);
  oscB.connect(gainB).connect(merger, 0, 1);
  merger.connect(audioContext.destination);
  oscA.start();
  oscB.start();
  audioOn = true;
  running = true;
  startTime = performance.now();
  $('audioBtn').textContent = 'Stop Audio';
  $('pauseVisualBtn').textContent = 'Pause Visuals';
  requestAnimationFrame(loop);
}

async function stopAudio() {
  if (!audioOn) return;
  oscA.stop();
  oscB.stop();
  await audioContext.close();
  audioOn = false;
  audioContext = null;
  oscA = null;
  oscB = null;
  gainA = null;
  gainB = null;
  $('audioBtn').textContent = 'Start Audio';
  renderStillWave();
}

async function toggleAudio() {
  if (audioOn) await stopAudio();
  else await startAudio();
}

function setMuteButtonState(channel, muted) {
  const desktopButton = $(channel === 'A' ? 'muteA' : 'muteB');
  const mobileButton = $(channel === 'A' ? 'mobileMuteA' : 'mobileMuteB');
  const mobileLabel = muted ? 'Unmute' : 'Mute';
  if (desktopButton) desktopButton.classList.toggle('active', muted);
  if (mobileButton) {
    mobileButton.textContent = mobileLabel;
    mobileButton.classList.toggle('active', muted);
  }
}

function toggleMute(channel) {
  if (channel === 'A') {
    channelAMuted = !channelAMuted;
    setMuteButtonState('A', channelAMuted);
  } else {
    channelBMuted = !channelBMuted;
    setMuteButtonState('B', channelBMuted);
  }
  updateGains();
  renderStillWave();
}

function pauseVisuals() {
  running = !running;
  $('pauseVisualBtn').textContent = running ? 'Pause Visuals' : 'Resume Visuals';
  if (running && audioOn) requestAnimationFrame(loop);
}

function resetWaveSpeed() {
  $('waveSpeed').value = 1;
}

function bindEvents() {
  $('audioBtn').addEventListener('click', toggleAudio);
  $('pauseVisualBtn').addEventListener('click', pauseVisuals);
  $('muteA').addEventListener('click', () => toggleMute('A'));
  $('muteB').addEventListener('click', () => toggleMute('B'));
  $('mobileMuteA')?.addEventListener('click', () => toggleMute('A'));
  $('mobileMuteB')?.addEventListener('click', () => toggleMute('B'));

  $('fA').addEventListener('input', renderStillWave);
  $('fB').addEventListener('input', renderStillWave);

  const masterVolumeInput = $('masterVolume');
  const mobileMasterVolumeInput = $('mobileMasterVolume');

  function syncMasterVolume(value) {
    if (masterVolumeInput) masterVolumeInput.value = value;
    if (mobileMasterVolumeInput) mobileMasterVolumeInput.value = value;
    updateGains();
  }

  if (masterVolumeInput) {
    masterVolumeInput.addEventListener('input', (event) => {
      if (mobileMasterVolumeInput) mobileMasterVolumeInput.value = event.target.value;
      updateGains();
    });
  }

  if (mobileMasterVolumeInput) {
    mobileMasterVolumeInput.addEventListener('input', (event) => {
      if (masterVolumeInput) masterVolumeInput.value = event.target.value;
      updateGains();
    });
  }

  $('waveSpeed').addEventListener('input', renderStillWave);
  $('waveAmp').addEventListener('input', renderStillWave);
  $('resetWaveSpeed').addEventListener('click', () => {
    resetWaveSpeed();
    renderStillWave();
  });

  document.querySelectorAll('.band-btn').forEach((button) => {
    button.addEventListener('click', () => renderBand(button.dataset.band));
  });

  $('mobileAudioPlayBtn').addEventListener('click', toggleAudio);
  $('mobileAudioStopBtn').addEventListener('click', stopAudio);
  $('mobilePauseVisualBtn').addEventListener('click', pauseVisuals);

  if ($('mobileFAInput')) {
    $('mobileFAInput').addEventListener('input', (event) => {
      $('fA').value = event.target.value;
      renderStillWave();
    });
  }
  if ($('mobileFBInput')) {
    $('mobileFBInput').addEventListener('input', (event) => {
      $('fB').value = event.target.value;
      renderStillWave();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  bindEvents();
  renderBand(activeBand);
  renderStillWave();
});
