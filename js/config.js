// ============================================================
//  3D YEEHAW — PUBLIC CATALOG — CONFIG
//  Same Google Apps Script backend as the internal app, since
//  it's the same source data — just a different, restricted
//  read-only action (see AppsScript.js: action=publicModels).
// ============================================================

const CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/AKfycbwjVmN7sm7tAjTRk3xfSGiOAG7lqU7y3Ix-6i1RycGvbfAjTmvMpWSqTLjzpwwgloQyAA/exec",
  fairSheet: "Fair 1",

  // Filter categories shown on the catalog. Keys must match the list in Yeehaw HQ.
  // Models with no category are counted as 'misc'.
  categories: [
    { key: 'keychains', label: 'Keychains' },
    { key: 'jewelry', label: 'Jewelry' },
    { key: 'figurines', label: 'Figurines' },
    { key: 'fidget', label: 'Fidget toys' },
    { key: 'misc', label: 'Misc' },
  ],
};
