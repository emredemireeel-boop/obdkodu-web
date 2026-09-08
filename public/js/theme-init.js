// Apply the saved theme before page rendering to prevent a color-scheme flash.
(() => {
  try {
    const savedTheme = localStorage.getItem('obd-theme');
    document.documentElement.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
  } catch (_) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
