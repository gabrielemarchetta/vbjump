// ══════════════════════════════════════════════════════════
// weekly_report.js — Report settimanale team
// ══════════════════════════════════════════════════════════

function renderWeeklyReport() {
  const content = document.getElementById('weeklyContent');
  const athletes = getAllAthletes();

  // Calcola settimana corrente (lunedì - domenica)
  const now    = new Date();
  const day    = now.getDay() || 7;
  const mon    = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0,0,0,0);
  const sun    = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);

  const weekLabel = `${mon.toLocaleDateString('it-IT',{day:'2-digit',month:'short'})} — ${sun.toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}`;

  // Raccoglie sessioni di questa settimana
  const weekData = athletes.map(a => {
    const allSess = getSessionsByAthlete(a.id);
    const weekSess = allSess.filter(s => s.dateSort >= mon.getTime() && s.dateSort <= sun.getTime());
    const prevSess = allSess.filter(s => s.dateSort < mon.getTime()).slice(-1)[0];
    const maxWeek  = weekSess.length ? Math.max(...weekSess.map(s=>s.maxHeight)) : null;
    const maxEver  = allSess.length ? Math.max(...allSess.map(s=>s.maxHeight)) : 0;
    const trend    = maxWeek && prevSess ? maxWeek - prevSess.maxHeight : null;
    return { ...a, weekSess, maxWeek, maxEver, trend, prevSess };
  }).filter(a => a.weekSess.length > 0 || a.maxEver > 0);

  const weekActive = weekData.filter(a => a.weekSess.length > 0);

  let html = `
  <div style="background:var(--surf);border:1px solid var(--brd);border-radius:10px;
    padding:16px;margin-bottom:12px;">
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted);
      letter-spacing:2px;margin-bottom:4px;">SETTIMANA CORRENTE</div>
    <div style="font-weight:600;font-size:1rem;">${weekLabel}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px;">
      <div style="text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--blue);">${weekActive.length}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">ATLETI ATTIVI</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--green);">
          ${weekData.reduce((s,a)=>s+a.weekSess.length,0)}
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">SESSIONI</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--yellow);">
          ${weekActive.length ? Math.max(...weekActive.filter(a=>a.maxWeek).map(a=>a.maxWeek)) : '--'}
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">BEST WEEK cm</div>
      </div>
    </div>
  </div>`;

  if (!weekActive.length) {
    html += `<div style="text-align:center;padding:32px;color:var(--muted);">
      <div style="font-size:2rem;margin-bottom:10px;">📅</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;">
        Nessuna sessione questa settimana
      </div></div>`;
  } else {
    html += `<div class="card"><div class="card-hd">
      <span class="card-lbl">ATLETI QUESTA SETTIMANA</span>
      <button class="btn btn-primary btn-sm" onclick="shareWeeklyReport()">📤 WA</button>
    </div><div class="card-body" style="padding:0;">`;

    weekData.sort((a,b) => (b.maxWeek||0) - (a.maxWeek||0)).forEach(a => {
      const trendColor = !a.trend ? 'var(--muted)'
        : a.trend > 0 ? 'var(--green)' : a.trend < 0 ? 'var(--red)' : 'var(--muted)';
      const trendStr = !a.trend ? '—'
        : (a.trend > 0 ? '▲+' : '▼') + Math.abs(a.trend) + 'cm';

      html += `
      <div style="padding:12px 16px;border-bottom:1px solid var(--brd);">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:50%;
            background:linear-gradient(135deg,var(--blue),var(--green));
            display:flex;align-items:center;justify-content:center;font-size:1rem;">
            ${a.emoji||'🏐'}
          </div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:0.88rem;">${a.name}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">
              ${a.weekSess.length} sess. questa settimana
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:var(--blue);">
              ${a.maxWeek||'--'}<span style="font-size:0.8rem;color:var(--muted);"> cm</span>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:${trendColor};">
              ${trendStr}
            </div>
          </div>
        </div>
        ${a.weekSess.length > 1 ? `
        <div style="margin-top:8px;display:flex;gap:4px;">
          ${a.weekSess.map(s=>`
            <div style="flex:1;text-align:center;padding:4px;background:rgba(0,0,0,0.3);
              border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:0.55rem;">
              <div style="color:var(--blue);font-weight:600;">${s.maxHeight}cm</div>
              <div style="color:var(--muted);">${s.date.substring(0,5)}</div>
            </div>`).join('')}
        </div>` : ''}
      </div>`;
    });
    html += '</div></div>';
  }

  // Atleti inattivi questa settimana
  const inactive = weekData.filter(a => !a.weekSess.length);
  if (inactive.length) {
    html += `<div class="card" style="margin-top:10px;">
      <div class="card-hd"><span class="card-lbl">⚠ NON HANNO ALLENATO</span></div>
      <div class="card-body" style="padding:10px 14px;">
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${inactive.map(a=>`
          <div style="padding:6px 12px;background:rgba(255,95,126,0.08);
            border:1px solid rgba(255,95,126,0.3);border-radius:6px;font-size:0.8rem;">
            ${a.emoji||'🏐'} ${a.name}
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  content.innerHTML = html;
}

function shareWeeklyReport() {
  const athletes = getAllAthletes();
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);

  const club = JSON.parse(localStorage.getItem('vbjump_club')||'{}');
  const clubLine = club.name ? `${club.emoji||'🏐'} *${club.name}*\n` : '';
  const weekLabel = `${mon.toLocaleDateString('it-IT',{day:'2-digit',month:'short'})} — ${sun.toLocaleDateString('it-IT',{day:'2-digit',month:'short'})}`;

  const weekData = athletes.map(a => {
    const sess = getSessionsByAthlete(a.id).filter(s => s.dateSort >= mon.getTime());
    const max  = sess.length ? Math.max(...sess.map(s=>s.maxHeight)) : null;
    return { ...a, max, sessions: sess.length };
  }).filter(a => a.max).sort((a,b) => b.max - a.max);

  if (!weekData.length) { showToast('Nessun dato questa settimana'); return; }

  const medals = ['🥇','🥈','🥉'];
  const rows = weekData.map((a,i) =>
    `${medals[i]||'  '} ${a.name}: *${a.max}cm* (${a.sessions} sess.)`
  ).join('\n');

  const msg = `${clubLine}📊 *REPORT SETTIMANALE*\n${weekLabel}\n\n${rows}\n\n_VBJump Pro_`;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}
