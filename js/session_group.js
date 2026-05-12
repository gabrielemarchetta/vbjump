// ══════════════════════════════════════════════════════════
// session_group.js — Modalità allenamento di gruppo
// ══════════════════════════════════════════════════════════

let groupSession = {
  active: false,
  athletes: [],   // [{id, name, jumps:[]}]
  currentIdx: 0,
};

function renderGroup() {
  const content = document.getElementById('groupContent');
  const athletes = getAllAthletes();

  if (!athletes.length) {
    content.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">
      <div style="font-size:2rem;margin-bottom:10px;">👥</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:2px;">
        Crea prima gli atleti nella sezione Atleti
      </div></div>`;
    return;
  }

  let html = `
  <div class="card">
    <div class="card-hd"><span class="card-lbl">👥 SELEZIONA ATLETI PER SESSIONE</span></div>
    <div class="card-body">
      <div style="font-size:0.78rem;color:var(--muted);margin-bottom:12px;">
        Seleziona gli atleti che partecipano all'allenamento di oggi. Poi analizza un video per volta per ognuno.
      </div>
      <div id="groupAthleteList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">`;

  athletes.forEach(a => {
    const sessions = getSessionsByAthlete(a.id);
    const maxEver  = sessions.length ? Math.max(...sessions.map(s=>s.maxHeight)) : 0;
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;
        background:var(--surf2);border:1px solid var(--brd);border-radius:8px;">
        <input type="checkbox" id="grp_${a.id}" value="${a.id}"
          style="width:18px;height:18px;accent-color:var(--blue);cursor:pointer;">
        <div style="flex:1;">
          <label for="grp_${a.id}" style="font-weight:600;cursor:pointer;">${a.emoji||'🏐'} ${a.name}</label>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.58rem;color:var(--muted);">
            ${a.role}${maxEver?' · Record: '+maxEver+'cm':''}
          </div>
        </div>
      </div>`;
  });

  html += `</div>
      <div class="fg">
        <label class="lbl">TIPO SESSIONE</label>
        <select class="inp" id="groupSessionType">
          <option value="fermo">Salto da fermo</option>
          <option value="rincorsa">Salto con rincorsa</option>
          <option value="misto">Misto (fermo + rincorsa)</option>
          <option value="gara">Simulazione gara</option>
          <option value="test">Test massimale</option>
        </select>
      </div>
      <div class="fg">
        <label class="lbl">NOTE SESSIONE</label>
        <input class="inp" id="groupNote" type="text" placeholder="es. Primo allenamento stagione...">
      </div>
      <button class="btn btn-primary btn-full" onclick="startGroupSession()">▶ AVVIA SESSIONE GRUPPO</button>
    </div>
  </div>

  <div id="groupActiveWrap" style="display:none;">
    <div class="card">
      <div class="card-hd">
        <span class="card-lbl">📊 SESSIONE IN CORSO</span>
        <span id="groupProgress" style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--blue);">0/0</span>
      </div>
      <div class="card-body" id="groupActiveBody"></div>
    </div>
    <div class="card" style="margin-top:10px;">
      <div class="card-hd"><span class="card-lbl">🏆 RISULTATI SESSIONE</span></div>
      <div class="card-body" style="padding:0;" id="groupResults"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="nextGroupAthlete()">ATLETA SUCCESSIVO →</button>
      <button class="btn btn-green" style="flex:1;justify-content:center;" onclick="saveGroupSession()">💾 SALVA TUTTI</button>
    </div>
  </div>`;

  content.innerHTML = html;
}

function startGroupSession() {
  const checkboxes = document.querySelectorAll('[id^="grp_"]:checked');
  if (checkboxes.length === 0) { showToast('Seleziona almeno un atleta'); return; }

  groupSession.active  = true;
  groupSession.currentIdx = 0;
  groupSession.athletes = Array.from(checkboxes).map(cb => {
    const ath = getAthleteById(cb.value);
    return { id: cb.value, name: ath.name, emoji: ath.emoji||'🏐', jumps: [], saved: false };
  });

  document.getElementById('groupAthleteList').closest('.card').style.display = 'none';
  document.getElementById('groupActiveWrap').style.display = 'block';
  updateGroupUI();
}

function updateGroupUI() {
  const curr = groupSession.athletes[groupSession.currentIdx];
  const total = groupSession.athletes.length;
  document.getElementById('groupProgress').textContent =
    `${groupSession.currentIdx+1}/${total}`;

  // Aggiorna corpo atleta corrente
  const body = document.getElementById('groupActiveBody');
  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <div style="width:48px;height:48px;border-radius:50%;
        background:linear-gradient(135deg,var(--blue),var(--green));
        display:flex;align-items:center;justify-content:center;font-size:1.4rem;">
        ${curr.emoji}
      </div>
      <div>
        <div style="font-weight:600;font-size:1rem;">${curr.name}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted);">
          Atleta ${groupSession.currentIdx+1} di ${total}
        </div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--blue);">
          ${curr.jumps.length ? Math.max(...curr.jumps)+'cm' : '--'}
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">MAX</div>
      </div>
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);margin-bottom:10px;">
      💡 Vai su ANALISI, carica il video di ${curr.name}, analizza e torna qui
    </div>
    <button class="btn btn-outline btn-full" onclick="importFromAnalysis()">
      📥 IMPORTA RISULTATO DA ANALISI
    </button>`;

  // Aggiorna risultati
  renderGroupResults();
}

function importFromAnalysis() {
  // Importa l'ultimo risultato dalla pagina analisi
  const curr = groupSession.athletes[groupSession.currentIdx];
  // Legge ultima sessione salvata per questo atleta
  const sessions = getSessionsByAthlete(curr.id);
  const last = sessions[sessions.length-1];
  if (!last || (Date.now() - last.dateSort) > 3600000) {
    // Alternativa: apri analisi
    showToast('Vai su ANALISI, analizza il video e torna qui');
    showPage('analysis');
    // Pre-seleziona atleta
    setTimeout(() => {
      const sel = document.getElementById('sessionAthlete');
      if (sel) sel.value = curr.id;
    }, 300);
    return;
  }
  curr.jumps = last.jumps || [last.maxHeight];
  curr.saved = true;
  showToast(`✓ Importato: ${curr.name} max ${last.maxHeight}cm`);
  updateGroupUI();
}

function nextGroupAthlete() {
  if (groupSession.currentIdx < groupSession.athletes.length-1) {
    groupSession.currentIdx++;
    updateGroupUI();
    showToast(`Prossimo: ${groupSession.athletes[groupSession.currentIdx].name}`);
  } else {
    showToast('Tutti gli atleti completati! Premi SALVA TUTTI');
  }
}

function renderGroupResults() {
  const results = document.getElementById('groupResults');
  const sorted = [...groupSession.athletes]
    .filter(a => a.jumps.length > 0)
    .sort((a,b) => Math.max(...b.jumps) - Math.max(...a.jumps));

  if (!sorted.length) {
    results.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-family:\'JetBrains Mono\',monospace;font-size:0.65rem;">Nessun risultato ancora</div>';
    return;
  }

  const maxAll = Math.max(...sorted.map(a => Math.max(...a.jumps)));
  const medals = ['🥇','🥈','🥉'];

  results.innerHTML = sorted.map((a,i) => {
    const max = Math.max(...a.jumps);
    const avg = Math.round(a.jumps.reduce((s,v)=>s+v,0)/a.jumps.length);
    const pct = Math.round(max/maxAll*100);
    return `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;
      border-bottom:1px solid var(--brd);">
      <span style="font-size:1.2rem;">${medals[i]||'#'+(i+1)}</span>
      <span style="font-size:1.1rem;">${a.emoji}</span>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.88rem;">${a.name}</div>
        <div style="height:4px;background:var(--brd);border-radius:2px;margin-top:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--blue),var(--green));"></div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--blue);">${max}<span style="font-size:0.8rem;color:var(--muted);"> cm</span></div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">avg ${avg}cm</div>
      </div>
    </div>`;
  }).join('');
}

function saveGroupSession() {
  const type  = document.getElementById('groupSessionType')?.value || 'misto';
  const note  = document.getElementById('groupNote')?.value || '';
  let saved = 0;

  groupSession.athletes.forEach(a => {
    if (!a.jumps.length || a.saved) return;
    const max = Math.max(...a.jumps);
    const avg = Math.round(a.jumps.reduce((s,v)=>s+v,0)/a.jumps.length);
    addSession({
      athleteId: a.id,
      date:      new Date().toLocaleDateString('it-IT'),
      dateSort:  Date.now(),
      maxHeight: max, avgHeight: avg,
      jumpCount: a.jumps.length,
      maxFlightMs: 0, lastApproachSpd: 0,
      note: `[${type}] ${note}`.trim(),
      jumps: [...a.jumps],
    });
    a.saved = true;
    saved++;
  });

  showToast(`✓ ${saved} sessioni salvate!`);
  renderGroupResults();
}
