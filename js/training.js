// ══════════════════════════════════════════════════════════
// training.js — Scheda allenamento personalizzata per atleta
// ══════════════════════════════════════════════════════════

function renderTraining() {
  const sel     = document.getElementById('trainingAthlete');
  const content = document.getElementById('trainingContent');
  const id      = sel.value;

  if (!id) {
    content.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">
      <div style="font-size:2rem;margin-bottom:10px;">📋</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:2px;">
        Seleziona un atleta per generare la scheda
      </div></div>`;
    return;
  }

  const ath      = getAthleteById(id);
  if (!ath) return;
  const sessions = getSessionsByAthlete(id);
  const maxEver  = sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
  const avgEver  = sessions.length
    ? Math.round(sessions.map(s => s.maxHeight).reduce((a,b) => a+b, 0) / sessions.length) : 0;
  const bestFlight = sessions.length ? Math.max(...sessions.map(s => s.maxFlightMs || 0)) : 0;
  const goal     = ath.goal ? parseInt(ath.goal) : null;
  const gap      = goal && maxEver ? goal - maxEver : null;
  const bmi      = (ath.height && ath.weight)
    ? ath.weight / ((ath.height / 100) ** 2) : null;

  // ── Determine athlete level ──────────────────────────
  // Based on max jump height (cm)
  const level = maxEver >= 65 ? 'elite'
              : maxEver >= 50 ? 'avanzato'
              : maxEver >= 35 ? 'intermedio'
              : maxEver >  0  ? 'principiante'
              : 'nessun_dato';

  const levelLabel = {
    elite:        '🏆 Elite',
    avanzato:     '⭐ Avanzato',
    intermedio:   '📈 Intermedio',
    principiante: '🔰 Principiante',
    nessun_dato:  '❓ Nessun dato',
  }[level];

  // ── Build exercise prescription ───────────────────────
  const programs = {
    elite: {
      title: 'Programma Elite — Ottimizzazione Potenza',
      freq: '4-5 giorni/settimana',
      focus: 'Potenza massimale, reattività, esplosività',
      exercises: [
        { name: 'Depth Jump con rimbalzo', sets: '5', reps: '4', rest: '3min', note: 'Caduta da 60cm, rimbalzo esplosivo immediato' },
        { name: 'Squat Jump con bilanciere', sets: '5', reps: '3', rest: '3min', note: '30-40% 1RM, massima velocità concentrica' },
        { name: 'Box Jump altezza massima', sets: '4', reps: '5', rest: '2min', note: 'Punta al 80%+ della tua altezza di salto' },
        { name: 'Pallonate in salto (attacco)', sets: '4', reps: '8', rest: '90s', note: 'Con rincorsa completa, focus sulla tocco al picco' },
        { name: 'Balzi singola gamba alternati', sets: '3', reps: '10', rest: '2min', note: 'Stacco rapido, massima frequenza' },
        { name: 'Salti con elastico (resistenza)', sets: '4', reps: '6', rest: '2min', note: 'Elastico in tensione dall\'alto' },
      ],
      strength: [
        { name: 'Squat bilanciere', sets: '4', reps: '3-5', rest: '4min', note: '85-90% 1RM' },
        { name: 'Stacco rumeno', sets: '4', reps: '5', rest: '3min', note: 'Focus catena posteriore' },
        { name: 'Pressa a 45°', sets: '3', reps: '6', rest: '3min', note: '80% 1RM, esplosivo in uscita' },
        { name: 'Affondi con salto', sets: '3', reps: '8/gamba', rest: '2min', note: 'Alternati con esplosione' },
      ],
    },
    avanzato: {
      title: 'Programma Avanzato — Sviluppo Potenza',
      freq: '3-4 giorni/settimana',
      focus: 'Potenza, forza esplosiva, tecnica di salto',
      exercises: [
        { name: 'Box Jump (altezza progressiva)', sets: '4', reps: '6', rest: '2min', note: 'Aumenta altezza box ogni settimana' },
        { name: 'Squat Jump (corpo libero)', sets: '4', reps: '8', rest: '90s', note: 'Massima esplosione, atterraggio morbido' },
        { name: 'Depth Jump da 40cm', sets: '3', reps: '5', rest: '3min', note: 'Contatto minimo a terra' },
        { name: 'Pallonate in salto', sets: '3', reps: '10', rest: '90s', note: 'Simula azione di gioco reale' },
        { name: 'Salti con doppio rimbalzo', sets: '3', reps: '8', rest: '2min', note: 'Focus velocità di stacco' },
      ],
      strength: [
        { name: 'Squat bilanciere', sets: '4', reps: '5-6', rest: '3min', note: '75-80% 1RM' },
        { name: 'Leg press', sets: '3', reps: '8', rest: '2min', note: 'Completa estensione finale' },
        { name: 'Affondi bulgari', sets: '3', reps: '10/gamba', rest: '90s', note: 'Con manubri' },
        { name: 'Calf raise esplosivo', sets: '4', reps: '12', rest: '60s', note: 'Salita rapida, discesa lenta' },
      ],
    },
    intermedio: {
      title: 'Programma Intermedio — Costruzione Base',
      freq: '3 giorni/settimana',
      focus: 'Forza di base, coordinazione, tecnica',
      exercises: [
        { name: 'Box Jump (altezza media)', sets: '3', reps: '8', rest: '2min', note: 'Focus atterraggio controllato' },
        { name: 'Squat Jump corpo libero', sets: '3', reps: '10', rest: '90s', note: 'Braccia per slancio' },
        { name: 'Salti con corda (veloce)', sets: '3', reps: '30s', rest: '60s', note: 'Massima frequenza' },
        { name: 'Step-up esplosivo', sets: '3', reps: '8/gamba', rest: '90s', note: 'Spinta completa sulla coscia' },
        { name: 'Salti laterali (coni)', sets: '3', reps: '10', rest: '60s', note: 'Reattività laterale' },
      ],
      strength: [
        { name: 'Squat corpo libero', sets: '3', reps: '12', rest: '90s', note: 'Tecnica prima del carico' },
        { name: 'Affondi alternati', sets: '3', reps: '10/gamba', rest: '90s', note: 'Passo lungo, schiena dritta' },
        { name: 'Ponte glutei', sets: '3', reps: '15', rest: '60s', note: 'Isometrico 2s in cima' },
        { name: 'Calf raise (scalino)', sets: '3', reps: '15', rest: '60s', note: 'Completo range di movimento' },
      ],
    },
    principiante: {
      title: 'Programma Base — Fondamenta',
      freq: '2-3 giorni/settimana',
      focus: 'Tecnica, mobilità, forza iniziale',
      exercises: [
        { name: 'Salti sul posto', sets: '3', reps: '10', rest: '90s', note: 'Focus atterraggio su punta piedi' },
        { name: 'Squat Jump leggero', sets: '3', reps: '8', rest: '90s', note: 'Atterraggio morbido, ginocchia non oltre punta piedi' },
        { name: 'Salti con corda', sets: '3', reps: '20s', rest: '60s', note: 'Ritmo regolare' },
        { name: 'Step-up su gradino', sets: '3', reps: '10/gamba', rest: '60s', note: 'Passo completo' },
      ],
      strength: [
        { name: 'Squat corpo libero', sets: '3', reps: '15', rest: '60s', note: 'Impara prima la tecnica' },
        { name: 'Affondi statici', sets: '3', reps: '8/gamba', rest: '60s', note: 'Equilibrio e stabilità' },
        { name: 'Ponte glutei', sets: '3', reps: '12', rest: '60s', note: 'Attiva i glutei' },
        { name: 'Calf raise', sets: '3', reps: '20', rest: '45s', note: 'Punta e tallone' },
      ],
    },
    nessun_dato: {
      title: 'Scheda Generale — Inizia a misurare!',
      freq: '3 giorni/settimana',
      focus: 'Valutazione iniziale e basi',
      exercises: [
        { name: 'Salti sul posto (test)', sets: '3', reps: '5', rest: '2min', note: 'Registra un video per misurare l\'elevazione' },
        { name: 'Box Jump base', sets: '3', reps: '5', rest: '2min', note: 'Altezza confortevole' },
      ],
      strength: [
        { name: 'Squat corpo libero', sets: '3', reps: '12', rest: '90s', note: 'Valuta la tecnica' },
        { name: 'Affondi alternati', sets: '3', reps: '8/gamba', rest: '60s', note: '' },
      ],
    },
  };

  const prog = programs[level];

  // ── Weekly schedule ───────────────────────────────────
  const schedules = {
    elite:        ['Forza + Pliometria', 'Recupero attivo', 'Pliometria specifica', 'Forza', 'Tecnica pallavolo', 'Riposo', 'Riposo'],
    avanzato:     ['Forza + Pliometria', 'Riposo', 'Pliometria', 'Forza', 'Tecnica', 'Riposo', 'Riposo'],
    intermedio:   ['Forza + Pliometria', 'Riposo', 'Pliometria leggera', 'Riposo', 'Tecnica', 'Riposo', 'Riposo'],
    principiante: ['Basi forza', 'Riposo', 'Pliometria base', 'Riposo', 'Riposo', 'Riposo', 'Riposo'],
    nessun_dato:  ['Valutazione', 'Riposo', 'Allenamento base', 'Riposo', 'Riposo', 'Riposo', 'Riposo'],
  };
  const days = ['LUN','MAR','MER','GIO','VEN','SAB','DOM'];
  const schedule = schedules[level];

  let html = '';

  // ── Header card ───────────────────────────────────────
  html += `
  <div class="card">
    <div class="card-hd">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:38px;height:38px;border-radius:50%;
          background:linear-gradient(135deg,var(--blue),var(--green));
          display:flex;align-items:center;justify-content:center;font-size:1.1rem;">${ath.emoji||'🏐'}</div>
        <div>
          <div style="font-weight:600;">${ath.name}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.58rem;color:var(--muted);">${ath.role} · ${levelLabel}</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="exportTrainingPDF('${id}')">📄 PDF</button>
    </div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:var(--blue);">${maxEver||'--'}<span style="font-size:0.8rem;color:var(--muted);"> cm</span></div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">RECORD</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:var(--yellow);">${goal||'--'}<span style="font-size:0.8rem;color:var(--muted);"> cm</span></div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">OBIETTIVO</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:${gap && gap > 0 ? 'var(--red)':'var(--green)'};">${gap !== null ? (gap > 0 ? '-'+gap : '✓') : '--'}<span style="font-size:0.8rem;color:var(--muted);"> cm</span></div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);">DA COLMARE</div>
        </div>
      </div>
      ${gap && gap > 0 ? `
      <div style="margin-top:12px;padding:10px;background:rgba(79,142,255,0.06);border:1px solid rgba(79,142,255,0.2);border-radius:6px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--blue);">
          💡 Con un programma costante puoi guadagnare 5-8cm in 3 mesi
        </div>
      </div>` : gap !== null && gap <= 0 ? `
      <div style="margin-top:12px;padding:10px;background:rgba(0,232,176,0.06);border:1px solid rgba(0,232,176,0.2);border-radius:6px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--green);">
          🎯 Obiettivo raggiunto! Imposta un nuovo traguardo
        </div>
      </div>` : ''}
    </div>
  </div>`;

  // ── Program title ─────────────────────────────────────
  html += `
  <div style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:3px;
    margin:16px 0 8px;color:var(--txt);">${prog.title}</div>
  <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted);
    margin-bottom:12px;">📅 ${prog.freq} · 🎯 ${prog.focus}</div>`;

  // ── Weekly calendar ───────────────────────────────────
  html += `<div class="card"><div class="card-hd"><span class="card-lbl">📅 PIANIFICAZIONE SETTIMANALE</span></div>
  <div class="card-body" style="padding:10px 14px;">
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">`;
  schedule.forEach((d, i) => {
    const isRest = d === 'Riposo';
    html += `<div style="text-align:center;padding:6px 2px;background:${isRest?'rgba(0,0,0,0.2)':'rgba(79,142,255,0.08)'};
      border:1px solid ${isRest?'var(--brd)':'rgba(79,142,255,0.3)'};border-radius:6px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.5rem;color:var(--muted);margin-bottom:4px;">${days[i]}</div>
      <div style="font-size:0.6rem;color:${isRest?'var(--muted)':'var(--txt)'};line-height:1.3;">${d}</div>
    </div>`;
  });
  html += `</div></div></div>`;

  // ── Progressione automatica ──────────────────────────
  const week = parseInt(localStorage.getItem('vbjump_week_'+id) || '1');
  const nextWeek = () => {
    localStorage.setItem('vbjump_week_'+id, Math.min(week+1, 12));
    renderTraining();
  };
  const prevWeek = () => {
    localStorage.setItem('vbjump_week_'+id, Math.max(week-1, 1));
    renderTraining();
  };
  // Progressione: ogni 2 settimane aumenta serie o reps del 10%
  const weekMult = 1 + Math.floor((week-1)/2) * 0.08;

  html += `
  <div class="card">
    <div class="card-hd">
      <span class="card-lbl">📅 SETTIMANA DI ALLENAMENTO</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <button onclick="(${prevWeek.toString()})()" class="btn btn-outline btn-sm" style="padding:4px 10px;">‹</button>
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:var(--blue);">SETTIMANA ${week}</span>
        <button onclick="(${nextWeek.toString()})()" class="btn btn-primary btn-sm" style="padding:4px 10px;">›</button>
      </div>
    </div>
    <div class="card-body" style="padding:10px 16px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);">
        ${week <= 3 ? '🔰 Fase adattamento — carichi leggeri, focus sulla tecnica' :
          week <= 6 ? '📈 Fase sviluppo — aumento progressivo del volume' :
          week <= 9 ? '💪 Fase intensificazione — massima intensità' :
                      '🔄 Fase picco/recupero — consolidamento dei guadagni'}
      </div>
    </div>
  </div>`;

  // ── Plyometric exercises ──────────────────────────────
  html += `<div class="card"><div class="card-hd"><span class="card-lbl">⚡ ESERCIZI PLIOMETRICI</span></div>
  <div class="card-body" style="padding:0;">`;
  prog.exercises.forEach((ex, i) => {
    const adjSets = Math.round(parseInt(ex.sets) * weekMult);
    const restSec = parseRestToSeconds(ex.rest);
    html += `
    <div style="padding:12px 16px;border-bottom:1px solid var(--brd);${i===prog.exercises.length-1?'border:none;':''}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <div style="font-weight:600;font-size:0.85rem;">${ex.name}</div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;padding:2px 8px;
            background:rgba(79,142,255,0.1);color:var(--blue);border-radius:3px;">${adjSets}×${ex.reps}</span>
          <button onclick="openTimer(${restSec},'${ex.name} — RECUPERO')"
            style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;padding:3px 8px;
            background:rgba(0,232,176,0.1);color:var(--green);border:1px solid rgba(0,232,176,0.3);
            border-radius:3px;cursor:pointer;">⏱ ${ex.rest}</button>
        </div>
      </div>
      ${ex.note ? `<div style="font-size:0.75rem;color:var(--muted);">💡 ${ex.note}</div>` : ''}
    </div>`;
  });
  html += `</div></div>`;

  // ── Strength exercises ────────────────────────────────
  html += `<div class="card"><div class="card-hd"><span class="card-lbl">💪 FORZA SPECIFICA</span></div>
  <div class="card-body" style="padding:0;">`;
  prog.strength.forEach((ex, i) => {
    const adjSets = Math.round(parseInt(ex.sets) * weekMult);
    const restSec = parseRestToSeconds(ex.rest);
    html += `
    <div style="padding:12px 16px;border-bottom:1px solid var(--brd);${i===prog.strength.length-1?'border:none;':''}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <div style="font-weight:600;font-size:0.85rem;">${ex.name}</div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;padding:2px 8px;
            background:rgba(255,95,126,0.1);color:var(--red);border-radius:3px;">${adjSets}×${ex.reps}</span>
          <button onclick="openTimer(${restSec},'${ex.name} — RECUPERO')"
            style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;padding:3px 8px;
            background:rgba(0,232,176,0.1);color:var(--green);border:1px solid rgba(0,232,176,0.3);
            border-radius:3px;cursor:pointer;">⏱ ${ex.rest}</button>
        </div>
      </div>
      ${ex.note ? `<div style="font-size:0.75rem;color:var(--muted);">💡 ${ex.note}</div>` : ''}
    </div>`;
  });
  html += `</div></div>`;

  // ── Notes / tips ──────────────────────────────────────
  html += `
  <div class="guide-block">
    <div class="guide-title">📌 NOTE IMPORTANTI</div>
    <div class="guide-row"><span class="guide-icon">🔥</span><div>Riscaldamento 10-15 min prima di ogni sessione — corsa leggera + mobilità caviglie e anche</div></div>
    <div class="guide-row"><span class="guide-icon">❄️</span><div>Defaticamento 5-10 min — stretching statico dopo ogni sessione</div></div>
    <div class="guide-row"><span class="guide-icon">😴</span><div>Il riposo è parte dell'allenamento — i muscoli crescono durante il recupero</div></div>
    <div class="guide-row"><span class="guide-icon">📹</span><div>Registra un video ogni 2 settimane per monitorare i progressi con VBJump</div></div>
    ${bmi && bmi > 27 ? `<div class="guide-row"><span class="guide-icon">⚖️</span><div>IMC attuale: <strong>${bmi.toFixed(1)}</strong> — ridurre il peso corporeo può migliorare significativamente il salto</div></div>` : ''}
  </div>`;

  content.innerHTML = html;
}

// ── Export training card as PDF ───────────────────────────
function exportTrainingPDF(athId) {
  const ath = getAthleteById(athId);
  if (!ath) return;
  const sessions = getSessionsByAthlete(athId);
  const maxEver  = sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
  const goal     = ath.goal ? parseInt(ath.goal) : null;

  const level = maxEver >= 65 ? 'Elite'
              : maxEver >= 50 ? 'Avanzato'
              : maxEver >= 35 ? 'Intermedio'
              : maxEver > 0   ? 'Principiante'
              : 'Da valutare';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;

  // Header
  doc.setFillColor(7,8,13); doc.rect(0,0,W,40,'F');
  doc.setFillColor(0,232,176); doc.rect(0,0,4,297,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(24); doc.setTextColor(0,232,176);
  doc.text('SCHEDA ALLENAMENTO', margin, 18);
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(74,80,128);
  doc.text('VBJump Pro — Volleyball Analytics', margin, 26);
  doc.text(new Date().toLocaleDateString('it-IT'), W-margin, 18, {align:'right'});

  // Athlete
  let y = 48;
  doc.setFillColor(18,21,42); doc.roundedRect(margin,y,W-margin*2,24,3,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(221,226,245);
  doc.text(ath.name, margin+8, y+10);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,80,128);
  doc.text(ath.role + ' · Livello: ' + level, margin+8, y+18);
  doc.text('Record: ' + (maxEver||'--') + 'cm' + (goal?' · Obiettivo: '+goal+'cm':''), W-margin, y+10, {align:'right'});

  y += 32;
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0,232,176);
  doc.text('PIANO DI ALLENAMENTO PERSONALIZZATO', margin, y);
  doc.setDrawColor(0,232,176); doc.line(margin, y+3, W-margin, y+3);

  y += 12;
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(74,80,128);
  doc.text('Questo programma è stato generato automaticamente da VBJump Pro basandosi sui dati di performance dell\'atleta.', margin, y, {maxWidth: W-margin*2});

  y += 12;
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(79,142,255);
  doc.text('ESERCIZI PLIOMETRICI', margin, y);
  doc.setDrawColor(28,32,64); doc.line(margin, y+2, W-margin, y+2);
  y += 8;

  // Simple table
  const cols = [margin+2, margin+60, margin+80, margin+100, margin+115];
  ['ESERCIZIO','SERIE','REPS','RIPOSO','NOTE'].forEach((h,i) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(74,80,128);
    doc.text(h, cols[i], y);
  });
  y += 6;

  // Content rows - we use simplified list
  const allExercises = [
    ...(maxEver >= 65 ? [
      ['Depth Jump con rimbalzo','5','4','3min','Caduta da 60cm'],
      ['Squat Jump bilanciere','5','3','3min','30-40% 1RM'],
      ['Box Jump altezza max','4','5','2min','Focus altezza'],
      ['Pallonate in salto','4','8','90s','Azione di gioco'],
    ] : maxEver >= 50 ? [
      ['Box Jump progressivo','4','6','2min','Aumenta ogni settimana'],
      ['Squat Jump corpo libero','4','8','90s','Massima esplosione'],
      ['Depth Jump da 40cm','3','5','3min','Contatto minimo'],
      ['Pallonate in salto','3','10','90s','Rincorsa completa'],
    ] : maxEver >= 35 ? [
      ['Box Jump altezza media','3','8','2min','Atterraggio controllato'],
      ['Squat Jump','3','10','90s','Braccia per slancio'],
      ['Salti con corda','3','30s','60s','Massima frequenza'],
      ['Step-up esplosivo','3','8/gamba','90s','Spinta completa'],
    ] : [
      ['Salti sul posto','3','10','90s','Punta piedi'],
      ['Squat Jump leggero','3','8','90s','Atterraggio morbido'],
      ['Salti con corda','3','20s','60s','Ritmo regolare'],
      ['Step-up su gradino','3','10/gamba','60s','Equilibrio'],
    ]),
  ];

  allExercises.forEach((ex, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    if (i%2===0) { doc.setFillColor(12,14,22); doc.rect(margin, y-4, W-margin*2, 8, 'F'); }
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(221,226,245);
    doc.text(ex[0], cols[0], y);
    doc.setFont('helvetica','normal'); doc.setTextColor(79,142,255);
    doc.text(ex[1], cols[1], y);
    doc.setTextColor(221,226,245);
    doc.text(ex[2], cols[2], y);
    doc.setTextColor(74,80,128);
    doc.text(ex[3], cols[3], y);
    doc.text(ex[4]||'', cols[4], y);
    y += 8;
  });

  // Footer
  doc.setFillColor(13,15,26); doc.rect(0,285,W,12,'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(74,80,128);
  doc.text('VBJump Pro — Scheda generata il ' + new Date().toLocaleDateString('it-IT'), margin, 292);
  doc.setTextColor(0,232,176);
  doc.text('CONFIDENZIALE', W-margin, 292, {align:'right'});

  doc.save('Scheda_' + ath.name.replace(/\s+/g,'_') + '.pdf');
  showToast('📄 Scheda PDF scaricata!');
}
