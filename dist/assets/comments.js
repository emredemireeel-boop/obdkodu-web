(() => {
  const brand = document.querySelector('[data-vehicle-brand]');
  const model = document.querySelector('[data-vehicle-model]');
  if (!brand || !model) return;
  fetch('/assets/vehicle-models.json').then(response => response.json()).then(vehicles => {
    const brands = document.querySelector('#vehicle-brands');
    const models = document.querySelector('#vehicle-models');
    for (const name of Object.keys(vehicles).sort((a, b) => a.localeCompare(b, 'tr'))) {
      const option = document.createElement('option'); option.value = name; brands.append(option);
    }
    const refresh = () => {
      models.replaceChildren();
      const chosen = Object.keys(vehicles).find(name => name.toLocaleLowerCase('tr') === brand.value.trim().toLocaleLowerCase('tr'));
      for (const name of chosen ? vehicles[chosen] : []) {
        const option = document.createElement('option'); option.value = name; models.append(option);
      }
    };
    brand.addEventListener('input', refresh);
    refresh();
  }).catch(() => {});
})();
