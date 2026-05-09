// ══════════════════════════════════════════════════════════
// nav.js — Page navigation & routing
// ══════════════════════════════════════════════════════════

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('tab-'  + name).classList.add('active');

  if (name === 'athletes') renderAthletes();
  if (name === 'analysis') populateAthleteSelect('sessionAthlete');
  if (name === 'ranking')  renderRanking();
  if (name === 'training') { populateAthleteSelect('trainingAthlete'); renderTraining(); }
  if (name === 'compare')  { populateAthleteSelect('cmpSelect'); populateAthleteSelect2(); renderCompare(); }
  if (name === 'settings') { renderSettings(); updateInfoStats(); }

  window.scrollTo(0, 0);
}

function populateAthleteSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">— Seleziona atleta —</option>';
  getAllAthletes().forEach(a => {
    const o = document.createElement('option');
    o.value = a.id; o.textContent = a.name;
    sel.appendChild(o);
  });
  if (cur) sel.value = cur;
}

function populateAthleteSelect2() {
  const sel = document.getElementById('cmpSelect2');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">— Nessuno —</option>';
  getAllAthletes().forEach(a => {
    const o = document.createElement('option');
    o.value = a.id; o.textContent = a.name;
    sel.appendChild(o);
  });
  if (cur) sel.value = cur;
}

function updateInfoStats() {
  const a = document.getElementById('infoAthletes');
  const s = document.getElementById('infoSessions');
  if (a) a.textContent = db.athletes.length;
  if (s) s.textContent = db.sessions.length;
}
