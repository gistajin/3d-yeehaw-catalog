// ============================================================
//  SHEETS.JS — read-only public catalog client
// ============================================================

const Sheets = {

  _call(params) {
    return new Promise((resolve, reject) => {
      const cbName = 'cb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const url = CONFIG.scriptUrl + '?' + Object.entries({ ...params, callback: cbName })
        .map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
      const script = document.createElement('script');
      const timeout = setTimeout(() => { cleanup(); reject(new Error('Request timed out')); }, 15000);
      window[cbName] = (data) => { cleanup(); if (data && data.status === 'error') reject(new Error(data.message)); else resolve(data); };
      function cleanup() { clearTimeout(timeout); delete window[cbName]; if (script.parentNode) script.parentNode.removeChild(script); }
      script.onerror = () => { cleanup(); reject(new Error('Script load failed')); };
      script.src = url;
      document.head.appendChild(script);
    });
  },

  async publicModels(sheetName) {
    const rows = await this._call({ action: 'publicModels', tab: sheetName });
    return (Array.isArray(rows) ? rows : []).map(r => ({
      id: String(r.id || ''),
      model: String(r.model || ''),
      displayName: String(r.displayName || r.model || ''),
      variant: String(r.variant || ''),
      photo: String(r.photo || ''),
      photoFullUrl: String(r.photoFullUrl || ''),
      license: String(r.license || ''),
      sortOrder: r.sortOrder === '' || r.sortOrder === undefined ? 0 : Number(r.sortOrder) || 0
    })).filter(r => r.id);
  }

};
