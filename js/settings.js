// ══════════════════════════════════════════════════════════
// settings.js — Impostazioni club, backup/ripristino, Excel
// ══════════════════════════════════════════════════════════

// ── Club settings ─────────────────────────────────────────
function loadClubSettings() {
  const s = JSON.parse(localStorage.getItem('vbjump_club') || '{}');
  document.getElementById('clubName').value  = s.name  || '';
  document.getElementById('clubCity').value  = s.city  || '';
  document.getElementById('clubLogo').value  = s.emoji || '🏐';
  document.getElementById('clubColor').value = s.color || '#4f8eff';
  applyClubBranding();
}

function saveClubSettings() {
  const s = {
    name:  document.getElementById('clubName').value.trim(),
    city:  document.getElementById('clubCity').value.trim(),
    emoji: document.getElementById('clubLogo').value.trim() || '🏐',
    color: document.getElementById('clubColor').value,
  };
  localStorage.setItem('vbjump_club', JSON.stringify(s));
  applyClubBranding();
  showToast('✓ Impostazioni salvate!');
}

function applyClubBranding() {
  const s = JSON.parse(localStorage.getItem('vbjump_club') || '{}');
  if (s.color) {
    document.documentElement.style.setProperty('--blue', s.color);
  }
  const logoEl = document.getElementById('topbarLogo');
  if (logoEl) {
    if (s.name) {
      logoEl.innerHTML = `${s.emoji || '🏐'} <span>${s.name.toUpperCase()}</span>`;
    } else {
      logoEl.innerHTML = `VB<span>JUMP</span>`;
    }
  }
}

// ── Backup ────────────────────────────────────────────────
function backupData() {
  const data = {
    version:   '3.0',
    exported:  new Date().toISOString(),
    club:      JSON.parse(localStorage.getItem('vbjump_club') || '{}'),
    athletes:  db.athletes,
    sessions:  db.sessions,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'VBJump_backup_' + new Date().toLocaleDateString('it-IT').replace(/\//g,'-') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Backup scaricato!');
}

// ── Restore ───────────────────────────────────────────────
function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.athletes || !data.sessions) throw new Error('File non valido');
      if (!confirm(`Ripristinare ${data.athletes.length} atleti e ${data.sessions.length} sessioni?\nI dati attuali verranno sovrascritti.`)) return;
      db.athletes = data.athletes;
      db.sessions = data.sessions;
      saveDB();
      if (data.club) localStorage.setItem('vbjump_club', JSON.stringify(data.club));
      applyClubBranding();
      renderAthletes();
      showToast(`✓ Ripristinati ${data.athletes.length} atleti!`);
    } catch(err) {
      showToast('❌ File backup non valido');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ── Export Excel ──────────────────────────────────────────
function exportExcel() {
  const athletes = getAllAthletes();
  if (!athletes.length) { showToast('Nessun dato da esportare'); return; }

  // Build CSV (Excel apre CSV senza problemi)
  let csv = 'ATLETA;RUOLO;ETA;ALTEZZA(cm);PESO(kg);IMC;RECORD(cm);MEDIA(cm);SESSIONI;OBIETTIVO(cm);TREND(cm)\n';

  athletes.forEach(a => {
    const sessions = getSessionsByAthlete(a.id);
    const maxEver  = sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
    const avgEver  = sessions.length
      ? Math.round(sessions.map(s => s.maxHeight).reduce((x,y)=>x+y,0) / sessions.length) : 0;
    const trend    = sessions.length >= 2
      ? sessions[sessions.length-1].maxHeight - sessions[0].maxHeight : 0;
    const age      = a.birth ? new Date().getFullYear() - a.birth : '';
    const bmi      = (a.height && a.weight)
      ? (a.weight / ((a.height/100)**2)).toFixed(1) : '';

    csv += [
      a.name, a.role, age,
      a.height||'', a.weight||'', bmi,
      maxEver||'', avgEver||'', sessions.length,
      a.goal||'', trend
    ].join(';') + '\n';
  });

  // Sessioni sheet
  csv += '\n\nSTORICO SESSIONI\n';
  csv += 'ATLETA;DATA;MAX(cm);MEDIA(cm);SALTI;VOLO MAX(ms);NOTE\n';

  athletes.forEach(a => {
    getSessionsByAthlete(a.id).forEach(s => {
      csv += [
        a.name, s.date, s.maxHeight, s.avgHeight,
        s.jumpCount, s.maxFlightMs||'', s.note||''
      ].join(';') + '\n';
    });
  });

  // BOM per Excel italiano
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a2   = document.createElement('a');
  a2.href    = url;
  a2.download = 'VBJump_dati_' + new Date().toLocaleDateString('it-IT').replace(/\//g,'-') + '.csv';
  a2.click();
  URL.revokeObjectURL(url);
  showToast('✓ Excel scaricato!');
}

// ── Render settings page ──────────────────────────────────
function renderSettings() {
  loadClubSettings();
}
