const $ = (id) => document.getElementById(id);

const canvases = ['waves', 'beatWave', 'plateA', 'plateB', 'lissajous', 'mandala'].reduce((items, id) => {
  items[id] = $(id);
  return items;
}, {});

const ctx = Object.fromEntries(
  Object.entries(canvases).map(([key, canvas]) => [key, canvas.getContext('2d')])
);

const bands = {
  delta: {
    title: 'Delta offset',
    desc: 'Slow stereo offsets often used for calm, low-movement listening experiments.',
    presets: [
      [120, 122, 'Slow 2 Hz', 'Very low offset with a 120 Hz base tone.'],
      [120, 123, 'Slow 3 Hz', 'A low offset with slightly more movement.'],
      [120, 123.5, 'Slow 3.5 Hz', 'Near the delta/theta boundary for comparison.'],
    ],
  },
  theta: {
    title: 'Theta offset',
    desc: 'Medium-slow offsets for exploring beat movement, visualization and low-tempo stereo contrast.',
    presets: [
      [120, 124, '4 Hz comparison', 'Lower theta-range offset with a comfortable 120 Hz carrier.'],
      [120, 127, '7 Hz comparison', 'Higher theta-range offset for a clearer slow pulse.'],
      [120, 126, '6 Hz comparison', 'Middle theta-range offset with balanced movement.'],
    ],
  },
  alpha: {
    title: 'Alpha offset',
    desc: 'Moderate offsets commonly used for relaxed listening and steady wave comparison.',
    presets: [
      [120, 128, '8 Hz comparison', 'Entry into alpha-range offset with a low carrier.'],
      [120, 130, '10 Hz comparison', 'Classic alpha-range offset for a clear beat envelope.'],
      [120, 132, '12 Hz comparison', 'Upper alpha-range offset with more activity.'],
    ],
  },
  beta: {
    title: 'Beta offset',
    desc: 'Faster offsets for inspecting more active beat movement and denser visual patterns.',
    presets: [
      [120, 136, '16 Hz comparison', 'Moderate beta-range offset.'],
      [120, 138, '18 Hz comparison', 'Active offset with a clear envelope.'],
      [120, 146, '26 Hz comparison', 'Higher beta-range offset.'],
    ],
  },
  gamma: {
    title: 'Gamma offset',
    desc: 'High offsets can feel intense. Use conservative volume and treat these as technical comparisons.',
    presets: [
      [120, 160, '40 Hz comparison', '40 Hz offset with a low carrier.'],
      [200, 240, 'Higher 40 Hz', 'Same offset with a higher carrier tone.'],
      [432, 440, '432 / 440 reference', 'A musical 8 Hz offset between 432 Hz and 440 Hz.'],
    ],
  },
};

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
let activeView = 'syncView';
let patternDirty = true;

function numberValue(id) {
  return parseFloat($(id).value);
}

function gcd(a, b) {
  let left = Math.round(Math.abs(a) * 10);
  let right = Math.round(Math.abs(b) * 10);
  while (right) {
    [left, right] = [right, left % right];
  }
  return left || 1;
}

function bandName(beat) {
  if (beat < 0.5) return 'Sub-delta';
  if (beat < 4) return 'Delta';
  if (beat < 8) return 'Theta';
  if (beat < 13) return 'Alpha';
  if (beat < 30) return 'Beta';
  return 'Gamma';
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
  $('state').textContent = !channelAMuted && !channelBMuted ? bandName(beat) : 'Muted channel';

  if (audioOn) {
    oscA.frequency.value = rawA;
    oscB.frequency.value = rawB;
  }

  return { fA, fB, rawA, rawB, beat, carrier };
}

function markPatternsDirty() {
  patternDirty = true;
}

function renderBand(bandKey) {
  const band = bands[bandKey];
  document.querySelectorAll('.band-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.band === bandKey);
  });

  $('bandTitle').textContent = band.title;
  if ($('mobileHemiNow')) $('mobileHemiNow').textContent = band.title;
  $('bandDescription').textContent = band.desc;
  $('presetChips').innerHTML = '';

  band.presets.forEach((preset, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `preset-chip${index === 0 ? ' active' : ''}`;
    chip.innerHTML = `<strong>${preset[2]} - ${preset[0]} / ${preset[1]} Hz</strong><small>${preset[3]}</small>`;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      $('fA').value = preset[0];
      $('fB').value = preset[1];
      currentValues();
      markPatternsDirty();
    });
    $('presetChips').appendChild(chip);
  });

  $('fA').value = band.presets[0][0];
  $('fB').value = band.presets[0][1];
  currentValues();
  markPatternsDirty();
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

  if (!channelAMuted) draw('rgba(96,165,250,.95)', (t) => Math.sin(t * cyclesA * Math.PI * 2 - phase));
  if (!channelBMuted) draw('rgba(244,114,182,.95)', (t) => Math.sin(t * cyclesB * Math.PI * 2 - phase * 1.01));
  if (!channelAMuted && !channelBMuted) {
    draw('rgba(255,255,255,.9)', (t) => (
      0.5 * Math.sin(t * cyclesA * Math.PI * 2 - phase)
      + 0.5 * Math.sin(t * cyclesB * Math.PI * 2 - phase * 1.01)
    ), 2.1);
  }

  context.fillStyle = 'rgba(255,255,255,.76)';
  context.font = '18px system-ui';
  context.fillText(`Beat frequency: ${values.beat.toFixed(2)} Hz`, 24, 38);
}

function drawBeatWave(time, values) {
  const context = ctx.beatWave;
  const { width, height } = context.canvas;
  clearWave(context);

  const amp = numberValue('waveAmp') * height * 0.28;
  const visualScale = numberValue('waveSpeed');
  const phase = time * visualScale * Math.PI * 2;
  const cyclesA = Math.max(1, values.rawA) / 120;
  const cyclesB = Math.max(1, values.rawB) / 120;
  const envelopeSpeed = Math.max(0.2, values.beat / 4);

  context.strokeStyle = 'rgba(255,255,255,.96)';
  context.lineWidth = 2.1;
  context.beginPath();
  for (let x = 0; x < width; x += 1) {
    const t = x / width;
    const y1 = channelAMuted ? 0 : Math.sin(t * cyclesA * Math.PI * 2 - phase);
    const y2 = channelBMuted ? 0 : Math.sin(t * cyclesB * Math.PI * 2 - phase * 1.01);
    const divisor = !channelAMuted && !channelBMuted ? 0.5 : 1;
    const y = height / 2 + (y1 + y2) * divisor * amp;
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();

  context.strokeStyle = 'rgba(255,255,255,.32)';
  context.lineWidth = 1.5;
  context.setLineDash([6, 6]);
  if (!channelAMuted && !channelBMuted) {
    [-1, 1].forEach((sign) => {
      context.beginPath();
      for (let x = 0; x < width; x += 1) {
        const t = x / width;
        const env = Math.abs(Math.sin(t * envelopeSpeed * Math.PI * 2 - phase * 0.2));
        const y = height / 2 + sign * env * amp;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    });
  }
  context.setLineDash([]);
}

function drawLissajous(time, values) {
  const context = ctx.lissajous;
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);
  context.strokeStyle = 'rgba(167,139,250,.9)';
  context.lineWidth = 1.5;
  context.beginPath();

  const visualScale = numberValue('waveSpeed');
  const phaseShift = time * visualScale;
  const scale = numberValue('syncScale');

  for (let i = 0; i <= 2400; i += 1) {
    const t = (i / 2400) * Math.PI * 2 * 10;
    const x = channelAMuted ? 0 : Math.sin(t * (values.rawA / 100) + phaseShift) * width * scale;
    const y = channelBMuted ? 0 : Math.sin(t * (values.rawB / 100)) * height * scale;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.stroke();
  context.restore();
}

function drawMandala(time, values) {
  const context = ctx.mandala;
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);

  const layers = numberValue('mandalaLayers');
  const intensity = numberValue('mandalaIntensity');
  const zoom = numberValue('mandalaZoom');
  const visualScale = numberValue('waveSpeed');

  for (let layer = 1; layer <= layers; layer += 1) {
    const radius = layer * (Math.min(width, height) * 0.017) * zoom;
    context.beginPath();
    for (let a = 0; a <= 720; a += 1) {
      const angle = (a / 720) * Math.PI * 2;
      const mod = Math.sin(angle * (values.beat + 1) * layer + time * visualScale) * radius * intensity;
      const r = radius + mod;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (a === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.strokeStyle = `hsla(${(layer * 18 + time * 30) % 360}, 80%, 70%, 0.55)`;
    context.lineWidth = 1.1;
    context.stroke();
  }
  context.restore();
}

function modeParams(freq, detail) {
  const root = Math.sqrt(Math.max(1, freq));
  return {
    m: 1 + (Math.floor(root * 0.39) % detail),
    n: 1 + (Math.floor(root * 0.63) % detail),
    p: 1 + (Math.floor(root * 0.91) % detail),
  };
}

function waveField(x, y, freq, detail) {
  const { m, n, p } = modeParams(freq, detail);
  const radial = Math.sqrt(x * x + y * y);
  const damping = 1 - 0.22 * radial;
  const plate = Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y)
    - Math.sin(n * Math.PI * x) * Math.sin(m * Math.PI * y);
  const diagonal = 0.32 * Math.sin(p * Math.PI * (x + y));
  return (plate + diagonal) * damping;
}

function drawPatternBorder(context) {
  const { width, height } = context.canvas;
  context.save();
  context.strokeStyle = 'rgba(255,255,255,0.22)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(width / 2, height / 2, Math.min(width, height) * 0.49, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function clearPlate(context, label) {
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  context.fillStyle = 'rgba(255,255,255,.55)';
  context.font = '16px system-ui';
  context.fillText(label, 18, 28);
}

function renderPattern(context, frequency) {
  const { width, height } = context.canvas;
  const image = context.createImageData(width, height);
  const { data } = image;
  const detail = numberValue('detail');
  const thickness = numberValue('lineThickness');

  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const index = (py * width + px) * 4;
      const x = (px / (width - 1)) * 2 - 1;
      const y = (py / (height - 1)) * 2 - 1;
      const r = Math.sqrt(x * x + y * y);

      if (r > 0.985) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 255;
        continue;
      }

      const field = waveField(x, y, frequency, detail);
      const line = Math.max(0, 1 - Math.abs(field) / thickness);
      const brightness = Math.max(0, Math.min(255, 8 + Math.pow(line, 0.38) * 247));
      data[index] = brightness;
      data[index + 1] = brightness;
      data[index + 2] = brightness;
      data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  drawPatternBorder(context);
  context.fillStyle = 'rgba(255,255,255,.78)';
  context.font = '16px system-ui';
  context.fillText(`${frequency.toFixed(1)} Hz`, 18, 28);
}

function drawActiveComplementaryView(time, values) {
  if (activeView === 'syncView') {
    drawLissajous(time, values);
    return;
  }

  if (activeView === 'mandalaView') {
    drawMandala(time, values);
    return;
  }

  if (activeView === 'patternsView' && patternDirty) {
    if (!channelAMuted) renderPattern(ctx.plateA, values.rawA);
    else clearPlate(ctx.plateA, 'Channel A muted');
    if (!channelBMuted) renderPattern(ctx.plateB, values.rawB);
    else clearPlate(ctx.plateB, 'Channel B muted');
    patternDirty = false;
  }
}

function loop(now) {
  if (running) {
    const values = currentValues();
    const time = (now - startTime) / 1000;
    drawWavePanel(time, values);
    drawBeatWave(time, values);
    drawActiveComplementaryView(time, values);
  }
  requestAnimationFrame(loop);
}

function bindEvents() {
  document.querySelectorAll('.band-btn').forEach((button) => {
    button.addEventListener('click', () => renderBand(button.dataset.band));
  });

  document.querySelectorAll('.visual-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.visual-btn').forEach((item) => item.classList.remove('active'));
      document.querySelectorAll('.visual-panel').forEach((panel) => panel.classList.remove('active'));
      button.classList.add('active');
      $(button.dataset.view).classList.add('active');
      activeView = button.dataset.view;
      markPatternsDirty();
    });
  });

  ['fA', 'fB'].forEach((id) => $(id).addEventListener('input', () => {
    currentValues();
    markPatternsDirty();
  }));
  $('resetWaveSpeed').addEventListener('click', () => {
    $('waveSpeed').value = 1;
  });
  const toggleVisuals = () => {
    running = !running;
    const label = running ? 'Pause Visuals' : 'Resume Visuals';
    $('pauseVisualBtn').textContent = label;
    if ($('mobilePauseVisualBtn')) $('mobilePauseVisualBtn').textContent = label;
  };
  $('pauseVisualBtn').addEventListener('click', toggleVisuals);
  $('mobilePauseVisualBtn')?.addEventListener('click', toggleVisuals);
  $('muteA').addEventListener('click', () => {
    channelAMuted = !channelAMuted;
    if (gainA) gainA.gain.value = channelAMuted ? 0.00001 : 0.035;
    $('muteA').textContent = channelAMuted ? 'Enable Channel A' : 'Mute Channel A';
    $('muteA').classList.toggle('paused', channelAMuted);
    currentValues();
    markPatternsDirty();
  });
  $('muteB').addEventListener('click', () => {
    channelBMuted = !channelBMuted;
    if (gainB) gainB.gain.value = channelBMuted ? 0.00001 : 0.035;
    $('muteB').textContent = channelBMuted ? 'Enable Channel B' : 'Mute Channel B';
    $('muteB').classList.toggle('paused', channelBMuted);
    currentValues();
    markPatternsDirty();
  });
  ['lineThickness', 'detail'].forEach((id) => $(id).addEventListener('input', markPatternsDirty));
  $('audioBtn').addEventListener('click', toggleAudio);
  $('mobileAudioPlayBtn')?.addEventListener('click', startAudio);
  $('mobileAudioStopBtn')?.addEventListener('click', stopAudio);
}

async function startAudio() {
  if (audioOn) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const values = currentValues();
  oscA = audioContext.createOscillator();
  oscB = audioContext.createOscillator();
  gainA = audioContext.createGain();
  gainB = audioContext.createGain();
  merger = audioContext.createChannelMerger(2);
  oscA.type = 'sine';
  oscB.type = 'sine';
  oscA.frequency.value = values.rawA;
  oscB.frequency.value = values.rawB;
  gainA.gain.value = channelAMuted ? 0.00001 : 0.035;
  gainB.gain.value = channelBMuted ? 0.00001 : 0.035;
  oscA.connect(gainA).connect(merger, 0, 0);
  oscB.connect(gainB).connect(merger, 0, 1);
  merger.connect(audioContext.destination);
  oscA.start();
  oscB.start();
  audioOn = true;
  $('audioBtn').textContent = 'Stop Audio';
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
}

async function toggleAudio() {
  if (audioOn) await stopAudio();
  else await startAudio();
}


bindEvents();
renderBand('theta');
requestAnimationFrame(loop);
