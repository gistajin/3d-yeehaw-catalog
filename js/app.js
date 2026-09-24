// ============================================================
//  APP.JS — Public catalog logic
// ============================================================

let models = [];
let searchTerm = '';

// ---- Theme (shared pattern with the internal app) ----

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function updateThemeIcons() {
  const dark = currentTheme() === 'dark';
  document.querySelectorAll('.theme-icon-sun').forEach(el => el.classList.toggle('hidden', dark));
  document.querySelectorAll('.theme-icon-moon').forEach(el => el.classList.toggle('hidden', !dark));
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) {}
  updateThemeIcons();
}

// ---- Bootstrap ----

window.addEventListener('DOMContentLoaded', () => {
  updateThemeIcons();
  if (!CONFIG.scriptUrl || CONFIG.scriptUrl === 'YOUR_SCRIPT_URL_HERE') {
    document.getElementById('catalog-grid').innerHTML =
      '<div class="empty-state">Setup needed — open js/config.js and fill in your scriptUrl.</div>';
    return;
  }
  loadModels();
});

async function loadModels() {
  setLoading(true);
  try {
    models = await Sheets.publicModels(CONFIG.fairSheet);
    models.sort((a, b) => a.sortOrder - b.sortOrder);
    render();
  } catch (e) {
    document.getElementById('catalog-grid').innerHTML =
      '<div class="empty-state">Could not load the catalog right now. Please try again later.</div>';
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  document.getElementById('catalog-loading').classList.toggle('hidden', !isLoading);
}

function handleSearch(value) {
  searchTerm = value.trim().toLowerCase();
  render();
}

function render() {
  const grid = document.getElementById('catalog-grid');
  const filtered = models.filter(m => {
    if (!searchTerm) return true;
    return m.model.toLowerCase().includes(searchTerm) || m.variant.toLowerCase().includes(searchTerm);
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state">${models.length ? 'No models match your search.' : 'No models to show yet.'}</div>`;
    return;
  }

  grid.innerHTML = filtered.map(cardHtml).join('');
}

function cardHtml(m) {
  const img = m.photoFullUrl || m.photo;
  const title = m.variant ? `${m.model} — ${m.variant}` : m.model;
  return `<div class="catalog-card">
      <div class="catalog-card-photo">
        ${img ? `<img src="${esc(img)}" alt="${escAttr(title)}" class="photo-clickable" onclick="openLightbox('${lightboxSrc(m)}')">` : `<div class="catalog-card-noimg">No photo</div>`}
      </div>
      <div class="catalog-card-body">
        <div class="catalog-card-title">${esc(title)}</div>
        ${m.license ? `<div class="catalog-card-credit">${esc(m.license)}</div>` : ''}
      </div>
    </div>`;
}

function lightboxSrc(m) {
  return escAttr(m.photoFullUrl || m.photo).replace(/'/g, "\\'");
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.getElementById('lightbox-img').src = '';
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
