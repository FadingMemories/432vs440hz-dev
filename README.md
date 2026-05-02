# 432 vs 440 Hz Comparator

Interactive web tool to compare 432 Hz and 440 Hz tuning systems through real-time chord playback, harmonic geometry visualization, cymatic-inspired resonance patterns, and interactive sound exploration.

## Features

- **Real-time Chord Playback** — Play chords in 432 Hz or 440 Hz tuning instantly
- **Harmonic Geometry** — Visual representation of chord structure and symmetry
- **Resonance Patterns** — Generative Chladni-inspired nodal patterns
- **Interactive Keyboard** — Select root notes directly with on-screen keyboard
- **Chord Library** — Major, minor, maj7, m7, dom7, sus4, add9, fifth
- **Waveform Selection** — Sine, triangle, sawtooth oscillators
- **Comparative Analysis** — Side-by-side frequency tables and cents deviation
- **Responsive Design** — Optimized for desktop, tablet, and mobile
- **Multilingual** — English and Spanish support

## Getting Started

1. Clone the repository or download files
2. Open `index.html` in a modern web browser
3. Select root note and chord type
4. Click "Play" to compare 432 Hz vs 440 Hz

## Technology

- **Audio**: Web Audio API
- **Visualization**: Canvas 2D
- **Styling**: CSS3, responsive grid
- **Language**: Vanilla JavaScript (no dependencies)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: 13+
- Mobile browsers: iOS Safari 13+, Chrome Android

## Deployment

Deploy to Netlify or any static hosting:

```bash
# Netlify CLI
netlify deploy

# Or connect GitHub repo directly to Netlify
```

## Project Structure

```
432-vs-440-hz-comparator/
├── index.html              # Main entry point
├── netlify.toml           # Netlify deployment config
├── package.json           # Project metadata
├── README.md              # This file
└── src/
    ├── css/
    │   └── main.css       # Main stylesheet
    ├── js/
    │   ├── config.js      # Configuration & constants
    │   ├── audio.js       # Audio synthesis & playback
    │   ├── visual.js      # Canvas rendering
    │   ├── ui.js          # DOM manipulation
    │   └── i18n.js        # Translation system
    └── data/
        └── i18n.json      # Translation strings
```

## Audio Information

This tool is designed for **comparative harmonic exploration and creative experimentation**. The visualizations are generative models that use chord ratios and frequencies to produce geometric patterns—they are not direct physical measurements of actual cymatic plates.

For accurate cymatics, one would need:
- Physical cymatic plate
- Specific material, size, thickness
- Precise excitation point and amplitude
- Real-time frequency response analysis

## Contributing

Suggestions and improvements welcome. Please maintain the educational and serious tone while avoiding pseudoscientific claims.

## License

MIT License — feel free to use, modify, and distribute.

## Disclaimer

This tool is for educational and creative exploration of harmonic relationships and tuning systems. It is **not** a medical or therapeutic device. 432 Hz does not have scientific evidence for special healing properties—both 432 Hz and 440 Hz are valid tuning standards used across music and professional audio.
