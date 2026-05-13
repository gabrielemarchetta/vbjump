// ══════════════════════════════════════════════════════════
// ranking.js — Team leaderboard / classifica
// ══════════════════════════════════════════════════════════

function renderRanking() {
  const content = document.getElementById('rankingContent');
  const athletes = getAllAthletes();

  if (!athletes.length) {
    content.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">
      <div style="font-size:2rem;margin-bottom:10px;">🏆</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:2px;">
        Nessun atleta ancora
      </div></div>`;
    return;
  }

  // Build ranking data
  const ranked = athletes.map(a => {
    const sessions = getSessionsByAthlete(a.id);
    const maxEver  = sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
    const avgEver  = sessions.length
      ? Math.round(sessions.map(s => s.maxHeight).reduce((x,y) => x+y, 0) / sessions.length) : 0;
    const lastSession = sessions.length ? sessions[sessions.length - 1] : null;
    const trend = sessions.length >= 2
      ? sessions[sessions.length-1].maxHeight - sessions[0].maxHeight : null;
    const bestFlight = sessions.length
      ? Math.max(...sessions.map(s => s.maxFlightMs || 0)) : 0;
    return { ...a, maxEver, avgEver, sessions: sessions.length, lastSession, trend, bestFlight };
  }).sort((a, b) => b.maxEver - a.maxEver);

  const globalMax = ranked[0]?.maxEver || 1;
  const medals = ['🥇','🥈','🥉'];

  let html = '';

  // ── Podium top 3 ──────────────────────────────────────
  if (ranked.length >= 2) {
    html += `<div style="display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:8px;margin-bottom:16px;align-items:flex-end;">`;
    const podiumOrder = ranked.length >= 3
      ? [ranked[1], ranked[0], ranked[2]]
      : ranked.length === 2
        ? [ranked[1], ranked[0]]
        : [ranked[0]];
    const podiumCols  = ranked.length >= 3
      ? [1, 0, 2]
      : ranked.length === 2 ? [1, 0] : [0];
    const heights = ['80px','100px','68px'];

    podiumOrder.forEach((a, i) => {
      const realIdx = podiumCols[i];
      const podH    = ranked.length >= 3 ? heights[i] : (i === 0 ? '80px' : '100px');
      html += `
      <div style="background:var(--surf);border:1px solid var(--brd);border-radius:10px;
        padding:14px 8px;text-align:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;
          background:${realIdx===0?'linear-gradient(90deg,var(--yellow),var(--green))':realIdx===1?'var(--muted)':'#cd7f32'};"></div>
        <div style="font-size:1.4rem;margin-bottom:4px;">${medals[realIdx] || ''}</div>
        <div style="font-size:1.1rem;margin-bottom:4px;">${a.emoji || '🏐'}</div>
        <div style="font-weight:600;font-size:0.75rem;margin-bottom:6px;line-height:1.2;">${a.name.split(' ')[0]}</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;
          color:${realIdx===0?'var(--yellow)':realIdx===1?'var(--muted)':'#cd7f32'};">
          ${a.maxEver || '--'}
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">cm</div>
        <div style="height:${podH};background:${realIdx===0?'rgba(255,209,102,0.08)':realIdx===1?'rgba(100,100,120,0.08)':'rgba(205,127,50,0.08)'};
          margin:8px -8px -14px;border-top:1px solid var(--brd);"></div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Full ranking list ──────────────────────────────────
  html += `<div class="card">
    <div class="card-hd"><span class="card-lbl">CLASSIFICA COMPLETA</span></div>
    <div class="card-body" style="padding:0;">`;

  ranked.forEach((a, i) => {
    const barPct = globalMax ? Math.round((a.maxEver / globalMax) * 100) : 0;
    const trendStr = a.trend !== null
      ? `<span style="color:${a.trend >= 0 ? 'var(--green)' : 'var(--red)'};">
          ${a.trend >= 0 ? '▲' : '▼'} ${Math.abs(a.trend)}cm
         </span>` : '';

    html += `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;
      border-bottom:1px solid var(--brd);cursor:pointer;"
      onclick="goToCompare('${a.id}');">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:var(--muted);
        min-width:28px;text-align:center;">${i < 3 ? medals[i] : '#'+(i+1)}</div>
      <div style="width:36px;height:36px;border-radius:50%;flex-shrink:0;
        background:linear-gradient(135deg,var(--blue),var(--green));
        display:flex;align-items:center;justify-content:center;font-size:1rem;">${a.emoji || '🏐'}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.88rem;margin-bottom:2px;">${a.name}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">
          ${a.role} · ${a.sessions} sess. ${trendStr}
        </div>
        <div style="height:3px;background:var(--brd);border-radius:2px;margin-top:6px;overflow:hidden;">
          <div style="height:100%;width:${barPct}%;
            background:linear-gradient(90deg,var(--blue),var(--green));border-radius:2px;"></div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:var(--blue);line-height:1;">
          ${a.maxEver || '--'}
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">cm MAX</div>
        ${a.bestFlight ? `<div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;color:var(--muted);">⏱ ${a.bestFlight}ms</div>` : ''}
      </div>
    </div>`;
  });

  html += `</div></div>`;

  // ── Team stats ─────────────────────────────────────────
  const teamAvg  = ranked.filter(a => a.maxEver > 0).length
    ? Math.round(ranked.filter(a=>a.maxEver>0).reduce((s,a)=>s+a.maxEver,0) / ranked.filter(a=>a.maxEver>0).length) : 0;
  const totalSess = ranked.reduce((s,a) => s+a.sessions, 0);

  html += `
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:4px;">
    <div class="stat-tile st-blue">
      <div class="st-lbl">MEDIA TEAM</div>
      <div class="st-val">${teamAvg || '--'}<span class="st-unit">cm</span></div>
      <div class="st-sub">elevazione media</div>
    </div>
    <div class="stat-tile st-green">
      <div class="st-lbl">ATLETI</div>
      <div class="st-val">${athletes.length}</div>
      <div class="st-sub">nel roster</div>
    </div>
    <div class="stat-tile st-yellow">
      <div class="st-lbl">SESSIONI</div>
      <div class="st-val">${totalSess}</div>
      <div class="st-sub">totali team</div>
    </div>
  </div>`;

  content.innerHTML = html;
}

// ── Navigate to compare with athlete pre-selected ────────
function goToCompare(athId) {
  showPage('compare');
  // Aspetta che i select siano popolati prima di impostare il valore
  setTimeout(() => {
    const sel = document.getElementById('cmpSelect');
    if (sel) {
      sel.value = athId;
      renderCompare();
    }
  }, 100);
}
