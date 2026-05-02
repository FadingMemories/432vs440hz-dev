const translations = {
  en: {
    pageTitle: '432 vs 440 Hz Comparator | Tuning, Chords & Audio Visualization',
    pageDescription: 'Compare 432 Hz and 440 Hz tuning with real-time chord playback, frequency tables, harmonic geometry and cymatic-inspired educational visuals.',
    eyebrow: 'Educational audio comparator',
    appTitle: '432 vs 440 Hz Comparator',
    appSubtitle: 'Compare 432 Hz and 440 Hz tuning in real time through chord playback, frequency data, harmonic geometry and cymatic-inspired visual models.',
    languageEN: 'EN',
    languageES: 'ES',
    sectionChord: '1. Chord',
    rootNoteLabel: 'Root Note',
    playChordBtn: 'Play Chord',
    stopBtn: 'Stop',
    mobilePlayBtn: 'Play',
    advancedControls: 'Advanced controls',
    masterVolumeLabel: 'Master Volume',
    waveformLabel: 'Waveform',
    waveformSine: 'Clean Sine',
    waveformTriangle: 'Smooth Triangle',
    waveformSawtooth: 'Bright Sawtooth',
    visualSpeedLabel: 'Visual Speed',
    resetSpeedBtn: 'Reset Speed',
    randomChordBtn: 'Random Chord',
    activeChordLabel: 'Active Chord',
    activeALabel: 'Active A4',
    systemLabel: 'System',
    spreadLabel: '432 to 440',
    harmonicGeometry432: 'Harmonic Geometry, 432 Hz',
    harmonicGeometry440: 'Comparative Geometry, 440 Hz',
    listen432Btn: 'Listen 432 Hz',
    listen440Btn: 'Listen 440 Hz',
    geometryDesc432: 'A stable generative map based on the active chord proportions.',
    geometryDesc440: 'A comparative map showing the same chord under a higher A4 reference.',
    stablePattern: 'Stable pattern',
    harmonicProportions: 'Harmonic proportions',
    shiftedPattern: 'Shifted pattern',
    relativeDrift: 'Relative drift',
    resonantPlateLabel: 'Resonant Plate / Nodal Pattern',
    resonantPlateDesc: 'Generative visualization inspired by cymatics. It is not a physical simulation of a real plate.',
    stableNodes: 'Stable nodes',
    perturbationNodes: 'Perturbation',
    whatYouSeeing: "What You're Seeing",
    visualizationNote: 'The visuals are generative educational maps, not direct physical measurements of sound.',
    physicalNote: 'A real plate depends on material, size, thickness, excitation point, amplitude and surface.',
    scientificNote: 'This project avoids therapeutic or scientific claims and focuses on audible and visual comparison.',
    notesAndProportions: 'Notes and Proportions',
    notesDesc: 'Check frequencies, tuning differences and natural-ratio deviation for each chord tone.',
    faqTitle: 'FAQ',
    faqQuestion1: 'Does 432 Hz scientifically guarantee better effects?',
    faqAnswer1: 'No. The comparator is for harmonic exploration, listening practice and creative experimentation.',
    faqQuestion2: 'What is 432 vs 440 Hz?',
    faqAnswer2: '432 Hz and 440 Hz are two A4 tuning references. This tool compares how chords shift when the reference changes.',
    faqQuestion3: 'How do I use this comparator?',
    faqAnswer3: 'Choose a root note and chord type, then play and compare the two tuning references.',
  },
  es: {
    pageTitle: '432 vs 440 Hz Comparator | Afinacion, acordes y visualizacion de audio',
    pageDescription: 'Compara 432 Hz y 440 Hz con reproduccion de acordes, tablas de frecuencia, geometria armonica y visuales educativos inspirados en cimatica.',
    eyebrow: 'Comparador educativo de audio',
    appTitle: '432 vs 440 Hz Comparator',
    appSubtitle: 'Compara 432 Hz y 440 Hz en tiempo real mediante acordes, datos de frecuencia, geometria armonica y modelos visuales inspirados en cimatica.',
    languageEN: 'EN',
    languageES: 'ES',
    sectionChord: '1. Acorde',
    rootNoteLabel: 'Nota raiz',
    playChordBtn: 'Reproducir acorde',
    stopBtn: 'Detener',
    mobilePlayBtn: 'Play',
    advancedControls: 'Controles avanzados',
    masterVolumeLabel: 'Volumen general',
    waveformLabel: 'Forma de onda',
    waveformSine: 'Seno limpia',
    waveformTriangle: 'Triangular suave',
    waveformSawtooth: 'Sierra brillante',
    visualSpeedLabel: 'Velocidad visual',
    resetSpeedBtn: 'Resetear velocidad',
    randomChordBtn: 'Acorde aleatorio',
    activeChordLabel: 'Acorde activo',
    activeALabel: 'A4 activo',
    systemLabel: 'Sistema',
    spreadLabel: '432 a 440',
    harmonicGeometry432: 'Geometria armonica, 432 Hz',
    harmonicGeometry440: 'Geometria comparativa, 440 Hz',
    listen432Btn: 'Escuchar 432 Hz',
    listen440Btn: 'Escuchar 440 Hz',
    geometryDesc432: 'Un mapa generativo estable basado en las proporciones del acorde activo.',
    geometryDesc440: 'Un mapa comparativo que muestra el mismo acorde con una referencia A4 mas alta.',
    stablePattern: 'Patron estable',
    harmonicProportions: 'Proporciones armonicas',
    shiftedPattern: 'Patron desplazado',
    relativeDrift: 'Deriva relativa',
    resonantPlateLabel: 'Placa resonante / patron nodal',
    resonantPlateDesc: 'Visualizacion generativa inspirada en cimatica. No es una simulacion fisica de una placa real.',
    stableNodes: 'Nodos estables',
    perturbationNodes: 'Perturbacion',
    whatYouSeeing: 'Que estas viendo',
    visualizationNote: 'Los visuales son mapas educativos generativos, no mediciones fisicas directas del sonido.',
    physicalNote: 'Una placa real depende de material, tamano, grosor, punto de excitacion, amplitud y superficie.',
    scientificNote: 'El proyecto evita afirmaciones terapeuticas o cientificas y se centra en la comparacion audible y visual.',
    notesAndProportions: 'Notas y proporciones',
    notesDesc: 'Consulta frecuencias, diferencias de afinacion y desviacion respecto a proporciones naturales.',
    faqTitle: 'Preguntas frecuentes',
    faqQuestion1: '432 Hz garantiza cientificamente mejores efectos?',
    faqAnswer1: 'No. El comparador sirve para exploracion armonica, escucha y experimentacion creativa.',
    faqQuestion2: 'Que es 432 vs 440 Hz?',
    faqAnswer2: '432 Hz y 440 Hz son dos referencias de afinacion para A4. Esta herramienta compara como cambian los acordes al modificar la referencia.',
    faqQuestion3: 'Como uso este comparador?',
    faqAnswer3: 'Elige una nota raiz y un tipo de acorde. Despues reproduce y compara las dos referencias de afinacion.',
  },
};

let currentLanguage = 'en';

export function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(language) {
  currentLanguage = language === 'es' ? 'es' : 'en';
  localStorage.setItem('language', currentLanguage);
  document.documentElement.lang = currentLanguage;
  applyTranslations();
}

export function applyTranslations() {
  document.title = t('pageTitle');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('pageDescription'));

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll('[data-language-switch]').forEach((button) => {
    button.classList.toggle('active', button.dataset.languageSwitch === currentLanguage);
    button.setAttribute('aria-pressed', String(button.dataset.languageSwitch === currentLanguage));
  });
}

export function initI18n() {
  const params = new URLSearchParams(window.location.search);
  const requestedLanguage = params.get('lang') || localStorage.getItem('language') || 'en';
  currentLanguage = requestedLanguage === 'es' ? 'es' : 'en';
  document.documentElement.lang = currentLanguage;
  applyTranslations();

  document.querySelectorAll('[data-language-switch]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageSwitch));
  });
}
