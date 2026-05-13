// ══════════════════════════════════════════════════════════
// compare.js — Sessioni, confronto due atleti, stanchezza
// ══════════════════════════════════════════════════════════

function renderCompare() {
  const id1     = document.getElementById('cmpSelect').value;
  const id2     = document.getElementById('cmpSelect2') ? document.getElementById('cmpSelect2').value : '';
  const content = document.getElementById('compareContent');

  if (!id1) {
    content.innerHTML = `<div style="text-align:center;padding:40px 16px;color:var(--muted);">
      <div style="font-size:2rem;margin-bottom:10px;">📊</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:2px;">Seleziona un atleta</div>
    </div>`;
    return;
  }

  // Se selezionati due atleti → confronto diretto
  if (id2 && id2 !== id1) {
    renderDualCompare(id1, id2, content);
    return;
  }

  // Singolo atleta
  const ath      = getAthleteById(id1);
  if (!ath) return;
  const sessions = getSessionsByAthlete(id1);
  const maxEver  = sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
  const avgAll   = sessions.length ? Math.round(sessions.map(s => s.maxHeight).reduce((a,b)=>a+b,0)/sessions.length) : 0;
  const trend    = sessions.length >= 2 ? sessions[sessions.length-1].maxHeight - sessions[0].maxHeight : 0;

  // ── Stanchezza: ultima sessione ──────────────────────
  let fatigueHtml = '';
  if (sessions.length > 0) {
    const last = sessions[sessions.length-1];
    if (last.jumps && last.jumps.length >= 4) {
      const firstHalf = last.jumps.slice(0, Math.floor(last.jumps.length/2));
      const secHalf   = last.jumps.slice(Math.floor(last.jumps.length/2));
      const avgFirst  = firstHalf.reduce((a,b)=>a+b,0)/firstHalf.length;
      const avgSecond = secHalf.reduce((a,b)=>a+b,0)/secHalf.length;
      const drop      = Math.round(avgFirst - avgSecond);
      if (drop >= 3) {
        fatigueHtml = `<div style="margin-top:10px;padding:10px;background:rgba(255,95,126,0.08);
          border:1px solid rgba(255,95,126,0.3);border-radius:6px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--red);">
            ⚠ STANCHEZZA RILEVATA — calo di ${drop}cm nella seconda parte della sessione
          </div>
        </div>`;
      } else if (drop <= -2) {
        fatigueHtml = `<div style="margin-top:10px;padding:10px;background:rgba(0,232,176,0.08);
          border:1px solid rgba(0,232,176,0.3);border-radius:6px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--green);">
            ✓ PROGRESSIONE POSITIVA — miglioramento di ${Math.abs(drop)}cm nella sessione
          </div>
        </div>`;
      }
    }
  }

  let html = `
  <div class="card">
    <div class="card-hd">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--green));
          display:flex;align-items:center;justify-content:center;font-size:1.1rem;">${ath.emoji||'🏐'}</div>
        <div>
          <div style="font-weight:600;">${ath.name}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.58rem;color:var(--muted);">${ath.role}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="exportPDF('${id1}')">📄 PDF</button>
        <button class="btn btn-sm" onclick="shareSessionWhatsApp('${id1}')"
          style="background:#25D366;color:#fff;border:none;">📤</button>
      </div>
    </div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--blue);">${maxEver||'--'}<span style="font-size:0.8rem;color:var(--muted);"> cm</span></div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">RECORD</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--yellow);">${avgAll||'--'}<span style="font-size:0.8rem;color:var(--muted);"> cm</span></div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">MEDIA</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:${trend>=0?'var(--green)':'var(--red)'};">${trend>=0?'+':''}${trend}<span style="font-size:0.8rem;color:var(--muted);"> cm</span></div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">TREND</div>
        </div>
      </div>
      ${fatigueHtml}
      ${sessions.length >= 2 ? `
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted);letter-spacing:2px;margin-top:12px;margin-bottom:8px;">ANDAMENTO</div>
        <div class="prog-chart"><canvas id="progChart"></canvas></div>` : ''}
    </div>
  </div>`;

  if (!sessions.length) {
    html += `<div style="text-align:center;padding:24px;color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:0.7rem;">Nessuna sessione salvata</div>`;
  } else {
    html += `<div class="card"><div class="card-hd"><span class="card-lbl">SESSIONI (${sessions.length})</span></div><div class="card-body">`;
    sessions.slice().reverse().forEach(s => {
      const pct = maxEver ? Math.round((s.maxHeight/maxEver)*100) : 0;
      html += `
      <div class="session-row" id="srow_${s.id}">
        <div style="min-width:68px;">
          <div class="s-date">${s.date}</div>
          ${s.note ? `<div style="font-size:0.68rem;color:var(--muted);">${s.note}</div>` : ''}
          ${s.maxFlightMs ? `<div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">⏱${s.maxFlightMs}ms</div>` : ''}
        </div>
        <div class="s-bar-wrap"><div class="s-bar" style="width:${pct}%;background:linear-gradient(90deg,var(--blue),var(--green));"></div></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div><span class="s-val" style="color:var(--blue);">${s.maxHeight}</span><span style="font-size:0.7rem;color:var(--muted);"> cm</span></div>
          <button onclick="openEditSession('${s.id}')"
            style="background:transparent;border:1px solid var(--blue);color:var(--blue);border-radius:5px;
            width:28px;height:28px;cursor:pointer;font-size:0.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✏️</button>
          <button onclick="confirmDeleteSession('${s.id}')"
            style="background:transparent;border:1px solid var(--red);color:var(--red);border-radius:5px;
            width:28px;height:28px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">🗑</button>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  content.innerHTML = html;

  if (sessions.length >= 2) {
    setTimeout(() => {
      const c = document.getElementById('progChart');
      if (!c) return;
      c.width = c.offsetWidth; c.height = c.offsetHeight;
      drawProgressChart(c, sessions, '#4f8eff');
    }, 120);
  }
}

// ── Dual athlete comparison ───────────────────────────────
function renderDualCompare(id1, id2, content) {
  const ath1 = getAthleteById(id1);
  const ath2 = getAthleteById(id2);
  if (!ath1 || !ath2) return;

  const s1 = getSessionsByAthlete(id1);
  const s2 = getSessionsByAthlete(id2);
  const max1 = s1.length ? Math.max(...s1.map(s=>s.maxHeight)) : 0;
  const max2 = s2.length ? Math.max(...s2.map(s=>s.maxHeight)) : 0;
  const avg1 = s1.length ? Math.round(s1.map(s=>s.maxHeight).reduce((a,b)=>a+b,0)/s1.length) : 0;
  const avg2 = s2.length ? Math.round(s2.map(s=>s.maxHeight).reduce((a,b)=>a+b,0)/s2.length) : 0;
  const delta = max1 - max2;

  const metrics = [
    { label:'RECORD', v1:max1, v2:max2, unit:'cm' },
    { label:'MEDIA', v1:avg1, v2:avg2, unit:'cm' },
    { label:'SESSIONI', v1:s1.length, v2:s2.length, unit:'' },
  ];

  let html = `
  <!-- Summary header -->
  <div class="card">
    <div class="card-body">
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;">
        <div style="text-align:center;">
          <div style="font-size:1.4rem;margin-bottom:4px;">${ath1.emoji||'🏐'}</div>
          <div style="font-weight:600;font-size:0.9rem;">${ath1.name}</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--blue);">${max1||'--'}<span style="font-size:0.9rem;color:var(--muted);"> cm</span></div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:${delta>0?'var(--blue)':delta<0?'var(--red)':'var(--muted)'};">
            ${delta>0?'+':''}${delta}cm
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">DIFF</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1.4rem;margin-bottom:4px;">${ath2.emoji||'🏐'}</div>
          <div style="font-weight:600;font-size:0.9rem;">${ath2.name}</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--red);">${max2||'--'}<span style="font-size:0.9rem;color:var(--muted);"> cm</span></div>
        </div>
      </div>
    </div>
  </div>`;

  // Metrics comparison bars
  html += `<div class="card"><div class="card-hd"><span class="card-lbl">CONFRONTO METRICA</span></div><div class="card-body">`;
  const globalMax = Math.max(max1, max2, 1);
  metrics.forEach(m => {
    const p1 = Math.round((m.v1/globalMax)*100);
    const p2 = Math.round((m.v2/globalMax)*100);
    html += `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted);margin-bottom:4px;">
        <span style="color:var(--blue);">${m.v1}${m.unit}</span>
        <span>${m.label}</span>
        <span style="color:var(--red);">${m.v2}${m.unit}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
        <div style="height:6px;background:var(--brd);border-radius:2px;overflow:hidden;direction:rtl;">
          <div style="height:100%;width:${p1}%;background:var(--blue);border-radius:2px;"></div>
        </div>
        <div style="height:6px;background:var(--brd);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${p2}%;background:var(--red);border-radius:2px;"></div>
        </div>
      </div>
    </div>`;
  });
  html += '</div></div>';

  // Progress charts
  if (s1.length >= 2 || s2.length >= 2) {
    html += `<div class="card"><div class="card-hd"><span class="card-lbl">ANDAMENTO</span></div>
    <div class="card-body" style="padding:12px;">
      <div class="prog-chart" style="height:120px;"><canvas id="dualChart"></canvas></div>
      <div style="display:flex;gap:16px;margin-top:8px;justify-content:center;">
        <div style="display:flex;align-items:center;gap:4px;"><div style="width:12px;height:3px;background:var(--blue);border-radius:2px;"></div><span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted);">${ath1.name.split(' ')[0]}</span></div>
        <div style="display:flex;align-items:center;gap:4px;"><div style="width:12px;height:3px;background:var(--red);border-radius:2px;"></div><span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted);">${ath2.name.split(' ')[0]}</span></div>
      </div>
    </div></div>`;
  }

  content.innerHTML = html;

  // Draw dual chart
  setTimeout(() => {
    const c = document.getElementById('dualChart');
    if (!c) return;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    if (s1.length >= 2) drawProgressChart(c, s1, '#4f8eff', false);
    if (s2.length >= 2) drawProgressChart(c, s2, '#ff5f7e', true);
  }, 120);
}

// ── Draw progress chart on canvas ────────────────────────
function drawProgressChart(c, sessions, color, overlay=false) {
  const ct   = c.getContext('2d');
  const vals = sessions.map(s => s.maxHeight);
  const allMax = Math.max(...vals, 10);
  const w = c.width, h = c.height;
  const step = vals.length > 1 ? w / (vals.length - 1) : w;

  if (!overlay) {
    const g = ct.createLinearGradient(0,0,0,h);
    g.addColorStop(0, color.replace('#','rgba(').split('').join('') + '30)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ct.beginPath(); ct.moveTo(0, h);
    vals.forEach((v,i) => ct.lineTo(i*step, h-(v/allMax)*(h-12)));
    ct.lineTo(w, h); ct.closePath();
    ct.fillStyle = color + '22'; ct.fill();
  }

  ct.beginPath(); ct.strokeStyle = color; ct.lineWidth = 2;
  vals.forEach((v,i) => {
    const x = i*step, y = h-(v/allMax)*(h-12);
    i===0 ? ct.moveTo(x,y) : ct.lineTo(x,y);
  });
  ct.stroke();

  vals.forEach((v,i) => {
    const x = i*step, y = h-(v/allMax)*(h-12);
    ct.beginPath(); ct.arc(x, y, 4, 0, Math.PI*2);
    ct.fillStyle = color; ct.fill();
    ct.fillStyle = '#dde2f5'; ct.font = 'bold 8px JetBrains Mono,monospace';
    ct.textAlign = 'center'; ct.fillText(v+'cm', x, y-8);
  });
}

// ── Delete session ────────────────────────────────────────
function confirmDeleteSession(sessionId) {
  if (!confirm("Eliminare questa sessione? L'operazione non è reversibile.")) return;
  deleteSession(sessionId);
  renderCompare();
  showToast('🗑 Sessione eliminata');
}

// ── Modal modifica sessione ───────────────────────────────
function openEditSession(sessionId) {
  const s = db.sessions.find(x => x.id === sessionId);
  if (!s) return;

  // Crea modal dinamico
  let existing = document.getElementById('modalEditSession');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-ov open';
  modal.id = 'modalEditSession';

  const jumpsHtml = (s.jumps || [s.maxHeight]).map((j, i) => `
    <div id="jump_edit_${i}" style="display:flex;align-items:center;gap:8px;
      padding:8px 10px;background:rgba(0,0,0,0.3);border:1px solid var(--brd);
      border-radius:5px;margin-bottom:6px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;
        color:var(--muted);min-width:60px;">SALTO #${i+1}</span>
      <input type="number" value="${j}" min="5" max="120"
        id="jval_${i}"
        style="flex:1;padding:6px 10px;background:var(--surf2);border:1px solid var(--brd2);
        border-radius:5px;color:var(--txt);font-size:0.9rem;outline:none;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--muted);">cm</span>
      <button onclick="removeJumpFromEdit(${i})"
        style="background:transparent;border:1px solid var(--red);color:var(--red);
        border-radius:5px;width:28px;height:28px;cursor:pointer;font-size:0.8rem;">🗑</button>
    </div>`).join('');

  modal.innerHTML = `
  <div class="modal" style="max-height:85vh;overflow-y:auto;">
    <div class="modal-handle"></div>
    <div class="modal-title" style="font-size:1.2rem;">MODIFICA SESSIONE</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);margin-bottom:14px;">
      ${s.date}${s.note?' · '+s.note:''}
    </div>
    <div class="fg">
      <label class="lbl">NOTE SESSIONE</label>
      <input class="inp" id="editSessionNote" type="text" value="${s.note||''}" placeholder="es. Pre-gara...">
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);
      letter-spacing:2px;margin-bottom:10px;">SALTI REGISTRATI</div>
    <div id="editJumpsList">${jumpsHtml}</div>
    <div class="modal-footer" style="margin-top:14px;">
      <button class="btn btn-outline btn-sm" onclick="document.getElementById('modalEditSession').remove()">ANNULLA</button>
      <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center;"
        onclick="saveEditedSession('${sessionId}')">✓ SALVA</button>
    </div>
  </div>`;

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function removeJumpFromEdit(idx) {
  const el = document.getElementById('jump_edit_' + idx);
  if (el) el.style.opacity = '0.3';
  const input = document.getElementById('jval_' + idx);
  if (input) input.disabled = true;
}

function saveEditedSession(sessionId) {
  const s = db.sessions.find(x => x.id === sessionId);
  if (!s) return;

  // Raccoglie i salti validi (non disabilitati)
  const newJumps = [];
  let i = 0;
  while (true) {
    const input = document.getElementById('jval_' + i);
    if (!input) break;
    if (!input.disabled) {
      const val = parseInt(input.value);
      if (val >= 5 && val <= 120) newJumps.push(val);
    }
    i++;
  }

  if (!newJumps.length) { showToast('Almeno un salto richiesto'); return; }

  s.jumps    = newJumps;
  s.maxHeight = Math.max(...newJumps);
  s.avgHeight = Math.round(newJumps.reduce((a,b)=>a+b,0)/newJumps.length);
  s.jumpCount = newJumps.length;
  s.note      = document.getElementById('editSessionNote')?.value || s.note;

  saveDB();
  document.getElementById('modalEditSession')?.remove();
  renderCompare();
  showToast('✓ Sessione aggiornata!');
}

// ── Share session via WhatsApp ────────────────────────────
function shareSessionWhatsApp(athId) {
  const ath      = getAthleteById(athId);
  if (!ath) return;
  const sessions = getSessionsByAthlete(athId);
  const maxEver  = sessions.length ? Math.max(...sessions.map(s=>s.maxHeight)) : 0;
  const avgAll   = sessions.length ? Math.round(sessions.map(s=>s.maxHeight).reduce((a,b)=>a+b,0)/sessions.length) : 0;
  const trend    = sessions.length>=2 ? sessions[sessions.length-1].maxHeight - sessions[0].maxHeight : 0;
  const club     = JSON.parse(localStorage.getItem('vbjump_club') || '{}');
  const clubLine = club.name ? `${club.emoji||'🏐'} ${club.name}\n` : '';
  const rating   = maxEver>=60?'🏆 Eccellente':maxEver>=45?'✅ Buono':maxEver>=30?'📈 Nella media':'🔰 In sviluppo';

  const msg = `${clubLine}📊 *REPORT PROGRESSI — ${ath.name}*\n\n`
    + `🔝 Record personale: *${maxEver} cm*\n`
    + `📈 Media sessioni: *${avgAll} cm*\n`
    + `📅 Sessioni totali: *${sessions.length}*\n`
    + `${trend>=0?'📈':'📉'} Trend: *${trend>=0?'+':''}${trend} cm*\n`
    + `${rating}\n\n`
    + `_Analisi effettuata con VBJump Pro_`;

  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}
