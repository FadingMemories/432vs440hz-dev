import { CHORDS, NOTES } from './chords.js';
import { state } from './state.js';
import { getNotes } from './tuning.js';

function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

function getVisualSpeed() {
  return parseFloat(document.getElementById('visualSpeed')?.value || 1);
}

function harmonicPoint(angle, layer, notes, rootFrequency, maxRadius, stable, time, speed) {
  const ratio = notes[layer].freq / rootFrequency;
  const chordVariance = (NOTES.indexOf(notes[0].note.slice(0, -1)) + layer * 3) % 7;
  const symmetry = Math.max(3, Math.round(ratio * 8) + chordVariance);
  const phase = time * speed * 0.18 * (layer + 1);
  const radius = maxRadius * (0.28 + layer * 0.18);
  const drift = stable ? 0 : 0.0185;
  const jitter = stable ? 0 : Math.sin(time * speed * 1.7) * 0.028;
  const harmonic = Math.sin(angle * symmetry + phase) * radius * (stable ? 0.12 : 0.21);
  const tension = Math.sin(angle * (symmetry + 1.0185) + phase * 1.7) * radius * (stable ? 0.02 : 0.1);
  const r = radius + harmonic + tension + jitter * radius * Math.sin(angle * 13 + time);

  return {
    x: Math.cos(angle + drift * layer * Math.sin(time)) * r,
    y: Math.sin(angle - drift * layer * Math.cos(time)) * r,
  };
}

export function drawHarmonicGeometry(canvasId, base, stable, time) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = clearCanvas(canvas);
  const { width, height } = canvas;
  const notes = getNotes('equal', base, state.root, state.chord);
  const rootFrequency = notes[0].freq;
  const maxRadius = Math.min(width, height) * (window.innerWidth <= 720 ? 0.46 : 0.38);
  const speed = getVisualSpeed();

  ctx.save();
  ctx.translate(width / 2, height / 2);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let radius = maxRadius / 5; radius <= maxRadius; radius += maxRadius / 5) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  notes.forEach((_, layer) => {
    ctx.beginPath();
    for (let i = 0; i <= 720; i += 1) {
      const angle = (i / 720) * Math.PI * 2;
      const point = harmonicPoint(angle, layer, notes, rootFrequency, maxRadius, stable, time, speed);
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.strokeStyle = stable
      ? `rgba(96, 165, 250, ${0.85 - layer * 0.08})`
      : `rgba(244, 114, 182, ${0.82 - layer * 0.07})`;
    ctx.lineWidth = stable ? 1.8 : 1.25;
    ctx.stroke();
  });

  const pointPositions = notes.map((note, layer) => {
    const ratio = note.freq / rootFrequency;
    const angle = ((ratio % 2) * Math.PI * 2 + time * speed * 0.28) % (Math.PI * 2);
    const point = harmonicPoint(angle, layer, notes, rootFrequency, maxRadius, stable, time, speed);

    ctx.fillStyle = layer === 0 ? '#fbbf24' : stable ? '#60a5fa' : '#f472b6';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();

    return point;
  });

  if (pointPositions.length > 1) {
    ctx.beginPath();
    pointPositions.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.strokeStyle = stable ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 191, 36, 0.72)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
  ctx.font = '15px system-ui';
  ctx.fillText(`${base} Hz - ${stable ? 'stable pattern' : 'drifting pattern'}`, -maxRadius, -maxRadius - 12);
  ctx.restore();
}

export function drawConsonancePlate(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = clearCanvas(canvas);
  const { width, height } = canvas;
  const notes = getNotes(state.tuning === 'both' ? 'natural' : state.tuning, state.base, state.root, state.chord);
  const rootFrequency = notes[0].freq;
  const chord = CHORDS[state.chord] || CHORDS.maj7;
  const rootIndex = NOTES.indexOf(state.root);
  const chordSignature = chord.intervals.reduce((sum, interval, index) => (
    sum + (interval + 1) * (index + 2) + chord.ratios[index] * 7
  ), rootIndex + 1);
  const offscreen = document.createElement('canvas');
  const stable = state.base === 432;
  const scale = window.innerWidth <= 720 ? 0.34 : 0.44;

  offscreen.width = Math.max(220, Math.floor(width * scale));
  offscreen.height = Math.max(160, Math.floor(height * scale));

  const offscreenContext = offscreen.getContext('2d');
  const imageData = offscreenContext.createImageData(offscreen.width, offscreen.height);
  const { data } = imageData;

  for (let y = 0; y < offscreen.height; y += 1) {
    for (let x = 0; x < offscreen.width; x += 1) {
      const nx = (x / (offscreen.width - 1)) * 2 - 1;
      const ny = (y / (offscreen.height - 1)) * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);
      const idx = (y * offscreen.width + x) * 4;

      if (r > 0.98) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
        continue;
      }

      let field = 0;
      let interference = 0;
      const angle = Math.atan2(ny, nx);
      notes.forEach((note, index) => {
        const ratio = note.freq / rootFrequency;
        const interval = chord.intervals[index] || 0;
        const ratioMode = Math.max(2, Math.round(ratio * 5 + index + (rootIndex % 4)));
        const intervalMode = Math.max(3, ((interval + rootIndex + index * 2) % 11) + 3);
        const rotation = (rootIndex / NOTES.length) * Math.PI * 2 + index * 0.31;
        const rx = nx * Math.cos(rotation) - ny * Math.sin(rotation);
        const ry = nx * Math.sin(rotation) + ny * Math.cos(rotation);
        const plate = Math.sin(ratioMode * Math.PI * rx) * Math.sin(intervalMode * Math.PI * ry)
          - Math.sin(intervalMode * Math.PI * rx) * Math.sin(ratioMode * Math.PI * ry);
        const radial = Math.cos((ratioMode + intervalMode + rootIndex) * angle + chordSignature * 0.08)
          * Math.cos((ratio * 2.4 + index) * Math.PI * r);
        const lattice = Math.sin((rootIndex + 2) * nx + intervalMode * ny + chordSignature * 0.12);

        field += plate * (stable ? 1.08 : 0.86) + radial * (stable ? 0.26 : 0.18);
        interference += lattice * Math.sin((ratioMode + intervalMode) * (nx * ny + 0.08));
      });

      field /= notes.length;
      interference /= notes.length;

      const drift = stable
        ? 0.035 * Math.cos(chordSignature * 0.1 + r * 8)
        : 0.28 * (
            Math.sin(rootFrequency * 0.00018 + nx * (10 + rootIndex % 5) + ny * 7)
            + Math.cos((nx * nx + ny * ny) * (18 + notes.length * 3) + chordSignature * 0.05)
          );
      const symmetry = stable
        ? 0.16 * Math.cos((rootIndex + notes.length + 4) * angle) * (1 - r)
        : 0;
      const combined = field + symmetry + interference * (stable ? 0.08 : 0.24) + drift;
      const value = Math.abs(combined * (stable ? 0.9 : 1.28));
      const line = Math.max(0, 1 - value / (stable ? 0.105 : 0.16));
      const glow = Math.pow(line, stable ? 0.5 : 0.38);
      const haze = Math.max(0, 1 - r) * (stable ? 0.08 : 0.16);
      const contour = Math.max(0, 1 - Math.abs(Math.sin(combined * 10)) / (stable ? 0.86 : 0.64));

      data[idx] = stable ? glow * 78 + contour * 22 : glow * 240 + haze * 90;
      data[idx + 1] = stable ? glow * 205 + haze * 42 : glow * 72 + contour * 28;
      data[idx + 2] = stable ? glow * 255 + contour * 34 : glow * 156 + haze * 68;
      data[idx + 3] = 255;
    }
  }

  offscreenContext.putImageData(imageData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, 0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.49, 0, Math.PI * 2);
  ctx.stroke();

  const label = `${state.base} Hz - ${state.root} ${chord.label}`;
  const mode = stable ? 'symmetric generative nodes' : 'drift + interference';
  ctx.fillStyle = 'rgba(5, 8, 22, 0.58)';
  ctx.fillRect(14, 14, Math.min(360, width - 28), 58);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeRect(14, 14, Math.min(360, width - 28), 58);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = '600 15px system-ui';
  ctx.fillText(label, 28, 38);
  ctx.fillStyle = stable ? 'rgba(125, 211, 252, 0.82)' : 'rgba(251, 113, 133, 0.82)';
  ctx.font = '12px system-ui';
  ctx.fillText(mode, 28, 58);
}

export function getActiveChord() {
  return CHORDS[state.chord] || CHORDS.maj7;
}
