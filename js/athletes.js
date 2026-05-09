// ══════════════════════════════════════════════════════════
// athletes.js — Athlete profiles: render, add, edit, delete
// ══════════════════════════════════════════════════════════

// ── Render athlete list ─────────────────────────────────
function renderAthletes() {
  const list = document.getElementById('athletesList');
  list.innerHTML = '';

  const athletes = getAllAthletes();
  if (!athletes.length) {
    list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--muted);
      font-family:'JetBrains Mono',monospace;font-size:0.7rem;">
      Nessun atleta ancora</div>`;
    return;
  }

  athletes.forEach(a => {
    const sessions = getSessionsByAthlete(a.id);
    const maxEver  = sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
    const age      = a.birth ? new Date().getFullYear() - a.birth : null;
    const bmi      = (a.height && a.weight)
      ? (a.weight / ((a.height / 100) ** 2)).toFixed(1) : null;
    const goalPct  = (a.goal && maxEver)
      ? Math.min(100, Math.round((maxEver / a.goal) * 100)) : null;

    const card = document.createElement('div');
    card.className = 'ath-card';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="ath-avatar">${a.emoji || '🏐'}</div>
        <div class="ath-info">
          <div class="ath-name">${a.name}</div>
          <div class="ath-role">${a.role}${age ? ' · ' + age + ' anni' : ''}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.58rem;color:var(--muted);margin-top:2px;">
            ${a.height ? '↕ ' + a.height + 'cm' : ''}
            ${a.height && a.weight ? ' · ' : ''}
            ${a.weight ? '⚖ ' + a.weight + 'kg' : ''}
            ${bmi ? ' · IMC ' + bmi : ''}
          </div>
        </div>
        <div class="ath-meta">
          <div class="ath-max">${maxEver || '--'}<span style="font-size:0.8rem;color:var(--muted)"> cm</span></div>
          <div class="ath-sessions">${sessions.length} sess.</div>
        </div>
      </div>

      ${goalPct !== null ? `
      <div style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;
          font-family:'JetBrains Mono',monospace;font-size:0.58rem;color:var(--muted);margin-bottom:4px;">
          <span>OBIETTIVO ${a.goal}cm</span><span>${goalPct}%</span>
        </div>
        <div style="height:4px;background:var(--brd);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${goalPct}%;
            background:linear-gradient(90deg,var(--blue),var(--green));
            border-radius:2px;transition:width 0.6s;"></div>
        </div>
      </div>` : ''}

      <div style="display:flex;justify-content:flex-end;margin-top:10px;">
        <button
          onclick="event.stopPropagation(); openEditAthlete('${a.id}')"
          style="background:transparent;border:1px solid var(--brd2);color:var(--muted);
            border-radius:5px;padding:5px 12px;font-family:'JetBrains Mono',monospace;
            font-size:0.6rem;cursor:pointer;letter-spacing:1px;">
          ✏ MODIFICA
        </button>
      </div>`;

    card.onclick = () => {
      showPage('compare');
      document.getElementById('cmpSelect').value = a.id;
      renderCompare();
    };
    list.appendChild(card);
  });
}

// ── Modal: open for new athlete ──────────────────────────
function openAddAthlete() {
  document.getElementById('modalAthleteTitle').textContent = 'NUOVO ATLETA';
  document.getElementById('aSaveBtn').textContent = 'CREA ✓';
  document.getElementById('aDeleteBtn').style.display = 'none';
  document.getElementById('aEditId').value = '';
  ['aName','aBirth','aEmoji','aHeight','aWeight','aGoal']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('aRole').selectedIndex = 0;
  openModal('modalAthlete');
}

// ── Modal: open for editing ──────────────────────────────
function openEditAthlete(id) {
  const a = getAthleteById(id);
  if (!a) return;
  document.getElementById('modalAthleteTitle').textContent = 'MODIFICA ATLETA';
  document.getElementById('aSaveBtn').textContent = 'SALVA ✓';
  document.getElementById('aDeleteBtn').style.display = 'inline-flex';
  document.getElementById('aEditId').value   = id;
  document.getElementById('aName').value     = a.name   || '';
  document.getElementById('aRole').value     = a.role   || 'Schiacciatore';
  document.getElementById('aBirth').value    = a.birth  || '';
  document.getElementById('aEmoji').value    = a.emoji  || '';
  document.getElementById('aHeight').value   = a.height || '';
  document.getElementById('aWeight').value   = a.weight || '';
  document.getElementById('aGoal').value     = a.goal   || '';
  openModal('modalAthlete');
}

// ── Save (create or update) ──────────────────────────────
function saveAthlete() {
  const name = document.getElementById('aName').value.trim();
  if (!name) return;

  const data = {
    name,
    role:   document.getElementById('aRole').value,
    birth:  document.getElementById('aBirth').value  || '',
    emoji:  document.getElementById('aEmoji').value  || '🏐',
    height: document.getElementById('aHeight').value || '',
    weight: document.getElementById('aWeight').value || '',
    goal:   document.getElementById('aGoal').value   || '',
  };

  const editId = document.getElementById('aEditId').value;
  if (editId) {
    updateAthlete(editId, data);
    showToast('✓ Profilo aggiornato!');
  } else {
    addAthlete(data);
    showToast('✓ Atleta aggiunto!');
  }

  closeModal('modalAthlete');
  renderAthletes();
}

// ── Delete ───────────────────────────────────────────────
function confirmDeleteAthlete() {
  const id = document.getElementById('aEditId').value;
  if (!id) return;
  const a = getAthleteById(id);
  if (!confirm(`Eliminare ${a.name} e tutte le sue sessioni?`)) return;
  deleteAthlete(id);
  closeModal('modalAthlete');
  renderAthletes();
  showToast('🗑 Atleta eliminato');
}
