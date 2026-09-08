// Resolve theme before rendering: explicit user choice, then system, then light.
(() => {
  let theme = 'light';

  try {
    // Ignore the legacy key that could leave unrelated pages stuck in dark mode.
    localStorage.removeItem('obd-theme');
    const preference = localStorage.getItem('obd-theme-preference');

    if (preference === 'light' || preference === 'dark') {
      theme = preference;
    } else if (typeof window.matchMedia === 'function') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  } catch (_) {
    theme = 'light';
  }

  document.documentElement.setAttribute('data-theme', theme);
})();
