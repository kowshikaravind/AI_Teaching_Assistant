const DEFAULT_SETTINGS = {
  themeMode: 'dark',
  fontSize: 'Medium',
};

const FONT_SCALE_MAP = {
  Small: 0.9,
  Medium: 1,
  Large: 1.1,
};

export function loadAppSettings() {
  const themeMode = localStorage.getItem('themeMode') || DEFAULT_SETTINGS.themeMode;
  const fontSize = localStorage.getItem('fontSize') || DEFAULT_SETTINGS.fontSize;

  return {
    themeMode: themeMode === 'light' ? 'light' : 'dark',
    fontSize: FONT_SCALE_MAP[fontSize] ? fontSize : DEFAULT_SETTINGS.fontSize,
  };
}

export function applyAppSettings(settings) {
  const themeMode = settings?.themeMode === 'light' ? 'light' : 'dark';
  const fontSize = FONT_SCALE_MAP[settings?.fontSize] ? settings.fontSize : DEFAULT_SETTINGS.fontSize;

  document.documentElement.setAttribute('data-theme', themeMode);
  document.documentElement.style.setProperty('--app-font-scale', String(FONT_SCALE_MAP[fontSize]));
}

export function saveAppSettings(settings) {
  const safe = {
    themeMode: settings?.themeMode === 'light' ? 'light' : 'dark',
    fontSize: FONT_SCALE_MAP[settings?.fontSize] ? settings.fontSize : DEFAULT_SETTINGS.fontSize,
  };

  localStorage.setItem('themeMode', safe.themeMode);
  localStorage.setItem('fontSize', safe.fontSize);
  applyAppSettings(safe);
  window.dispatchEvent(new Event('app-settings-changed'));

  return safe;
}
