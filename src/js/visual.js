/**
 * Canvas Visualization
 * 432 vs 440 Hz Comparator
 */

import { NOTES, CHORDS } from './config.js';
import { getNotes } from './audio.js';

/**
 * Clear canvas and return context
 */
function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

/**
 * Calculate harmonic point for geometry visualization
 */
function harmonicPoint(angle, layer, notes, root, maxRadius, stable, time, speed) {
  const ratio = notes[layer].freq / root;
  const chordVariance = (NOTES.indexOf(notes[0].note.slice(0, -1)) + layer * 2 + layer) % 7;
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

/**
 * Draw harmonic geometry visualization (432/440 comparison)
 */
export function drawHarmonicGeometry(canvasId, base, stable, time, state) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = clearCanvas(canvas);
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  const speed = parseFloat(document.getElementById('visualSpeed')?.value || 1);
  const notes = getNotes('equal', base, state.root, state.chord);
  const rootFreq = notes[0].freq;
  const maxRadius = Math.min(w, h) * (window.innerWidth <= 720 ? 0.46 : 0.38);

  ctx.save();
  ctx.translate(cx, cy);

  // Draw circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let r = 0; r < maxRadius; r += maxRadius / 5) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw harmonic paths
  for (let layer = 0; layer < notes.length; layer++) {
    ctx.beginPath();
    for (let i = 0; i <= 720; i++) {
      const angle = (i / 720) * Math.PI * 2;
      const point = harmonicPoint(angle, layer, notes, rootFreq, maxRadius, stable, time, speed);
      i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.strokeStyle = stable ? `rgba(96, 165, 250, ${0.85 - layer * 0.08})` : `rgba(244, 114, 182, ${0.82 - layer * 0.07})`;
    ctx.lineWidth = stable ? 1.8 : 1.25;
    ctx.stroke();
  }

  // Draw points
  const pointPositions = [];
  notes.forEach((n, layer) => {
    const ratio = n.freq / rootFreq;
    const angle = ((ratio % 2) * Math.PI * 2 + time * speed * 0.28) % (Math.PI * 2);
    const point = harmonicPoint(angle, layer, notes, rootFreq, maxRadius, stable, time, speed);
    pointPositions.push(point);

    ctx.fillStyle = layer === 0 ? '#fbbf24' : stable ? '#60a5fa' : '#f472b6';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Connect points
  if (pointPositions.length > 1) {
    ctx.beginPath();
    pointPositions.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.strokeStyle = stable ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
  ctx.font = '15px system-ui';
  ctx.fillText(
    base + ' Hz · ' + (stable ? 'stable pattern points' : 'drifting pattern points'),
    -maxRadius,
    -maxRadius - 12
  );

  ctx.restore();
}

/**
 * Draw consonance/nodal plate visualization (Chladni-inspired)
 */
export function drawConsonancePlate(canvasId, state) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = clearCanvas(canvas);
  const w = canvas.width;
  const h = canvas.height;

  const notes = getNotes(state.tuning === 'both' ? 'natural' : state.tuning, state.base, state.root, state.chord);
  const rootFreq = notes[0].freq;

  // Cached low-res rendering
  const scale = 0.42;
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(220, Math.floor(w * scale));
  offscreen.height = Math.max(160, Math.floor(h * scale));
  const og = offscreen.getContext('2d');
  const ow = offscreen.width;
  const oh = offscreen.height;

  const imageData = og.createImageData(ow, oh);
  const data = imageData.data;

  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const nx = (x / (ow - 1)) * 2 - 1;
      const ny = (y / (oh - 1)) * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);
      const idx = (y * ow + x) * 4;

      if (r > 0.98) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
        continue;
      }

      let field = 0;
      notes.forEach((n, i) => {
        const ratio = n.freq / rootFreq;
        const harmonicSet = [1, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8];
        const nearest = harmonicSet.reduce(
          (best, val) => (Math.abs(val - ratio) < Math.abs(best - ratio) ? val : best),
          harmonicSet[0]
        );
        const harmonicCloseness = Math.max(1, Math.round(nearest * 4));
        const rootShift = (NOTES.indexOf(state.root) % 3) + 1;
        const m = harmonicCloseness + rootShift;
        const nMode = Math.max(2, harmonicCloseness + i + 1);

        // Chladni-like plate field
        const plate = Math.sin(m * Math.PI * nx) * Math.sin(nMode * Math.PI * ny) - Math.sin(nMode * Math.PI * nx) * Math.sin(m * Math.PI * ny);

        // Radial component (subtle)
        const radial = (state.base === 432 ? 0.1 : 0.18) * Math.cos((m + nMode) * Math.atan2(ny, nx));

        field += plate + radial;
      });

      field /= notes.length;

      // Instability component (more pronounced in 440)
      const instability =
        state.base === 440
          ? 0.14 * (Math.sin(rootFreq * 0.00022 + nx * 11 + ny * 9) + 0.5 * Math.cos((nx * nx + ny * ny) * 22 + rootFreq * 0.00008))
          : 0;

      const structuralBias = state.base === 432 ? 0.92 : 1.18;
      const value = Math.abs(field * structuralBias + instability);
      const line = Math.max(0, 1 - value / 0.12);
      const glow = Math.pow(line, 0.45);
      const stable = state.base === 432;

      data[idx] = stable ? glow * 110 : glow * 220;
      data[idx + 1] = stable ? glow * 180 : glow * 80;
      data[idx + 2] = stable ? glow * 255 : glow * 140;
      data[idx + 3] = 255;
    }
  }

  og.putImageData(imageData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, 0, 0, w, h);

  // Circle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.49, 0, Math.PI * 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.font = '15px system-ui';
  ctx.fillText(state.base === 432 ? '432 Hz · symmetric nodes' : '440 Hz · increased drift', 18, 28);
}
