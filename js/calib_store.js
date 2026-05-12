// ══════════════════════════════════════════════════════════
// calib_store.js — Salvataggio calibrazione per palestra
// ══════════════════════════════════════════════════════════

const CALIB_KEY = 'vbjump_calibrations';

function getCalibrations() {
  return JSON.parse(localStorage.getItem(CALIB_KEY) || '[]');
}

function saveCalibration(name, cmPerUnit, refCm) {
  const calibs = getCalibrations();
  const existing = calibs.findIndex(c => c.name === name);
  const entry = {
    id:         existing >= 0 ? calibs[existing].id : Date.now().toString(),
    name,
    cmPerUnit:  parseFloat(cmPerUnit.toFixed(2)),
    refCm,
    savedAt:    new Date().toLocaleDateString('it-IT'),
  };
  if (existing >= 0) calibs[existing] = entry;
  else calibs.push(entry);
  localStorage.setItem(CALIB_KEY, JSON.stringify(calibs));
  return entry;
}

function deleteCalibration(id) {
  const calibs = getCalibrations().filter(c => c.id !== id);
  localStorage.setItem(CALIB_KEY, JSON.stringify(calibs));
}

function renderCalibStore() {
  const calibs = getCalibrations();
  const wrap   = document.getElementById('calibStoreWrap');
  if (!wrap) return;

  if (!calibs.length) {
    wrap.innerHTML = `<div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;
      color:var(--muted);text-align:center;padding:12px;">
      Nessuna calibrazione salvata
    </div>`;
    return;
  }

  wrap.innerHTML = calibs.map(c => `
  <div style="display:flex;align-items:center;gap:10px;padding:8px 0;
    border-bottom:1px solid var(--brd);">
    <div style="flex:1;">
      <div style="font-weight:600;font-size:0.85rem;">${c.name}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.58rem;color:var(--muted);">
        ${c.refCm}cm → scala ${c.cmPerUnit} · ${c.savedAt}
      </div>
    </div>
    <button onclick="loadCalibration('${c.id}')"
      style="background:rgba(79,142,255,0.1);color:var(--blue);border:1px solid rgba(79,142,255,0.3);
      border-radius:5px;padding:5px 10px;font-family:'JetBrains Mono',monospace;font-size:0.6rem;cursor:pointer;">
      USA
    </button>
    <button onclick="deleteCalibration('${c.id}');renderCalibStore();"
      style="background:transparent;color:var(--red);border:1px solid var(--red);
      border-radius:5px;width:28px;height:28px;cursor:pointer;font-size:0.8rem;">🗑</button>
  </div>`).join('');
}

function loadCalibration(id) {
  const c = getCalibrations().find(x => x.id === id);
  if (!c) return;
  // Imposta la calibrazione nell'analisi
  cmPerNormUnit = c.cmPerUnit;
  const disp = document.getElementById('calibScaleDisplay');
  if (disp) disp.textContent = `✓ ${c.name} (${c.refCm}cm)`;
  showToast(`✓ Calibrazione "${c.name}" caricata!`);
  if (navigator.vibrate) navigator.vibrate([100,50,100]);
}

function promptSaveCalibration() {
  if (!cmPerNormUnit) { showToast('Nessuna calibrazione attiva'); return; }
  const name = prompt('Nome palestra/location (es. Palestra Centrale):');
  if (!name) return;
  saveCalibration(name, cmPerNormUnit, refObjectCm);
  renderCalibStore();
  showToast(`✓ Calibrazione "${name}" salvata!`);
}
