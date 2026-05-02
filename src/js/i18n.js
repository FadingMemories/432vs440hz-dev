/**
 * Internationalization (i18n)
 * 432 vs 440 Hz Comparator
 * Supports: English (EN), Spanish (ES)
 */

import translations from '../data/i18n.json' assert { type: 'json' };

let currentLanguage = localStorage.getItem('language') || 'en';

/**
 * Get translation string
 */
export function t(key, lang = null) {
  const language = lang || currentLanguage;
  return translations[language]?.[key] || translations['en']?.[key] || key;
}

/**
 * Set language
 */
export function setLanguage(lang) {
  if (['en', 'es'].includes(lang)) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateUILanguage();
  }
}

/**
 * Get current language
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Update all UI text with translations
 */
function updateUILanguage() {
  // Update page title and meta
  document.title = t('pageTitle');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('pageDescription'));

  // Update content
  const elementsToTranslate = document.querySelectorAll('[data-i18n]');
  elementsToTranslate.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update input placeholders
  const inputsToTranslate = document.querySelectorAll('input[data-i18n-placeholder]');
  inputsToTranslate.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Update select labels
  const selects = document.querySelectorAll('select[data-i18n-options]');
  selects.forEach((select) => {
    const key = select.getAttribute('data-i18n-options');
    const options = t(key);
    if (Array.isArray(options)) {
      Array.from(select.options).forEach((opt, i) => {
        if (options[i]) opt.textContent = options[i];
      });
    }
  });

  // Update language switcher button state
  const langBtns = document.querySelectorAll('[data-language-switch]');
  langBtns.forEach((btn) => {
    const lang = btn.getAttribute('data-language-switch');
    btn.classList.toggle('active', lang === currentLanguage);
  });
}

/**
 * Initialize i18n system
 */
export function initI18n() {
  // Set HTML lang attribute
  document.documentElement.lang = currentLanguage;

  // Update initial UI
  updateUILanguage();

  // Language switcher listeners
  const langBtns = document.querySelectorAll('[data-language-switch]');
  langBtns.forEach((btn) => {
    btn.onclick = () => {
      const lang = btn.getAttribute('data-language-switch');
      setLanguage(lang);
      document.documentElement.lang = lang;
    };
  });
}
