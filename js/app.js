// ============================================================
//  APP.JS — Public catalog logic
// ============================================================

let models = [];
let searchTerm = '';
let groupFilter = null; // model name currently drilled into, or null for the top-level grid

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

// ---- Grouping — models sharing the same internal name become one card
// with a "N variants" badge, matching how they're grouped in Yeehaw HQ.

function groupModels(items) {
  const map = new Map();
  items.forEach(m => {
    const key = (m.model || '').trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  });
  return Array.from(map.entries())
    .map(([model, groupItems]) => ({
      model,
      items: groupItems.slice().sort((a, b) => a.sortOrder - b.sortOrder)
    }))
    .sort((a, b) => Math.min(...a.items.map(i => i.sortOrder)) - Math.min(...b.items.map(i => i.sortOrder)));
}

function openGroup(model) {
  groupFilter = model;
  render();
}

function closeGroup() {
  groupFilter = null;
  render();
}

function render() {
  const breadcrumb = document.getElementById('catalog-breadcrumb');
  const grid = document.getElementById('catalog-grid');

  if (groupFilter !== null) {
    const group = groupModels(models).find(g => g.model === groupFilter);
    if (!group) { groupFilter = null; return render(); }
    breadcrumb.classList.remove('hidden');
    breadcrumb.innerHTML = `<button class="btn-back" onclick="closeGroup()">&larr; Back to all models</button>
      <div class="breadcrumb-title">${esc(group.model)} <span class="breadcrumb-meta">${group.items.length} variants</span></div>`;
    grid.innerHTML = group.items.map(m => cardHtml(m, true)).join('');
    return;
  }

  breadcrumb.classList.add('hidden');
  const filtered = models.filter(m => {
    if (!searchTerm) return true;
    return m.model.toLowerCase().includes(searchTerm) ||
      m.displayName.toLowerCase().includes(searchTerm) ||
      m.variant.toLowerCase().includes(searchTerm);
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state">${models.length ? 'No models match your search.' : 'No models to show yet.'}</div>`;
    return;
  }

  const groups = groupModels(filtered);
  grid.innerHTML = groups.map(g => g.items.length > 1 ? groupCardHtml(g) : cardHtml(g.items[0], false)).join('');
}

function groupCardHtml(g) {
  const photoItem = g.items.find(m => m.photoFullUrl || m.photo);
  const img = photoItem ? (photoItem.photoFullUrl || photoItem.photo) : '';
  return `<div class="catalog-card group-card" onclick="openGroup('${esc(g.model).replace(/'/g, "\\'")}')">
      <div class="catalog-card-photo">
        ${img ? `<img src="${esc(img)}" alt="${escAttr(g.model)}">` : `<div class="catalog-card-noimg">No photo</div>`}
        <span class="variant-count-badge">${g.items.length} variants</span>
      </div>
      <div class="catalog-card-body">
        <div class="catalog-card-title">${esc(g.model)}</div>
        <div class="group-hint">Click to view &rarr;</div>
      </div>
    </div>`;
}

function cardHtml(m, inGroup) {
  const img = m.photoFullUrl || m.photo;
  const title = inGroup
    ? (m.variant || m.displayName)
    : (m.variant ? `${m.displayName} — ${m.variant}` : m.displayName);
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
