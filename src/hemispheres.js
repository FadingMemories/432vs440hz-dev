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
    desc: 'Very slow offsets for deep relaxation and rest-oriented exploration.',
    presets: [
      [100, 102, 'Low Rest 2 Hz', 'Low carrier with a very slow delta offset.'],
      [120, 123, 'Soft Delta 3 Hz', 'Mid carrier for gentle deep-rest exploration.'],
      [150, 153, 'Deep Recovery 3 Hz', 'Higher carrier with a stable slow delta pulse.'],
    ],
  },
  theta: {
    title: 'Theta - meditation',
    desc: 'Medium-slow offsets for meditation, creativity and internal visualization.',
    presets: [
      [100, 104, 'Low Theta 4 Hz', 'Low carrier with a soft theta offset.'],
      [120, 127, 'Gateway 7 Hz', 'Mid carrier with clearer slow pulses.'],
      [150, 156, 'Visualization 6 Hz', 'Higher carrier for a brighter theta comparison.'],
    ],
  },
  alpha: {
    title: 'Alpha - relaxation',
    desc: 'Calm waking offsets for relaxed focus and gentle mental clarity.',
    presets: [
      [100, 108, 'Soft Alpha 8 Hz', 'Low carrier with a relaxed alpha beat.'],
      [120, 130, 'Calm 10 Hz', 'Mid carrier for quiet alertness.'],
      [150, 162, 'Bright Alpha 12 Hz', 'Higher carrier with a clearer active beat.'],
    ],
  },
  beta: {
    title: 'Beta - focus',
    desc: 'More active offsets for attention, productivity and mental alertness.',
    presets: [
      [100, 116, 'Focus 16 Hz', 'Low carrier with a moderate beta offset.'],
      [120, 138, 'Work 18 Hz', 'Mid carrier for active comparison.'],
      [150, 176, 'Alert 26 Hz', 'Higher carrier with a stronger beta offset.'],
    ],
  },
  gamma: {
    title: 'Gamma - alertness',
    desc: 'High-frequency offsets for intense or experimental stimulation.',
    presets: [
      [100, 140, 'Low Gamma 40 Hz', 'Low carrier gamma for a clear fast beat.'],
      [120, 160, 'Gamma 40 Hz', 'Mid carrier with the same fast offset.'],
      [150, 190, 'High Gamma 40 Hz', 'Higher carrier for a brighter gamma comparison.'],
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

function toggleMute(channel) {
  if (channel === 'A') {
    channelAMuted = !channelAMuted;
    $('muteA').classList.toggle('active', channelAMuted);
  } else {
    channelBMuted = !channelBMuted;
    $('muteB').classList.toggle('active', channelBMuted);
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

  $('fA').addEventListener('input', renderStillWave);
  $('fB').addEventListener('input', renderStillWave);
  $('masterVolume').addEventListener('input', updateGains);

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
