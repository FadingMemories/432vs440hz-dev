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
  const offscreen = document.createElement('canvas');
  const scale = 0.42;

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
      notes.forEach((note, index) => {
        const ratio = note.freq / rootFrequency;
        const harmonicSet = [1, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8];
        const nearest = harmonicSet.reduce((best, value) => (
          Math.abs(value - ratio) < Math.abs(best - ratio) ? value : best
        ), harmonicSet[0]);
        const harmonicCloseness = Math.max(1, Math.round(nearest * 4));
        const rootShift = (NOTES.indexOf(state.root) % 3) + 1;
        const m = harmonicCloseness + rootShift;
        const nMode = Math.max(2, harmonicCloseness + index + 1);
        const plate = Math.sin(m * Math.PI * nx) * Math.sin(nMode * Math.PI * ny)
          - Math.sin(nMode * Math.PI * nx) * Math.sin(m * Math.PI * ny);
        const radial = (state.base === 432 ? 0.1 : 0.18) * Math.cos((m + nMode) * Math.atan2(ny, nx));

        field += plate + radial;
      });

      field /= notes.length;

      const instability = state.base === 440
        ? 0.14 * (Math.sin(rootFrequency * 0.00022 + nx * 11 + ny * 9)
          + 0.5 * Math.cos((nx * nx + ny * ny) * 22 + rootFrequency * 0.00008))
        : 0;
      const value = Math.abs(field * (state.base === 432 ? 0.92 : 1.18) + instability);
      const line = Math.max(0, 1 - value / 0.12);
      const glow = Math.pow(line, 0.45);
      const stable = state.base === 432;

      data[idx] = stable ? glow * 110 : glow * 220;
      data[idx + 1] = stable ? glow * 180 : glow * 80;
      data[idx + 2] = stable ? glow * 255 : glow * 140;
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

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = '15px system-ui';
  ctx.fillText(state.base === 432 ? '432 Hz - symmetric nodes' : '440 Hz - increased drift', 18, 28);
}

export function getActiveChord() {
  return CHORDS[state.chord] || CHORDS.maj7;
}
