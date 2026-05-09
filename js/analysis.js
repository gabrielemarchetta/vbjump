// ══════════════════════════════════════════════════════════
// analysis.js — VBJump Pro v6
// Metodo: picco pixel calibrato con altezza atleta reale
// + fattore correzione manuale per calibrazione fine
// ══════════════════════════════════════════════════════════

const videoEl  = document.getElementById('videoEl');
const canvas   = document.getElementById('outputCanvas');
const ctx      = canvas.getContext('2d');
const chartC   = document.getElementById('heightChart');
const chartCtx = chartC.getContext('2d');

let pose = null, poseLoaded = false, analyzing = false, rafId = null;
let frameCount = 0;

// ── Slow-mo factor (impostato dal selettore UI) ───────────
let slowMoFactor = 1.0;

// ── Fattore correzione manuale ────────────────────────────
// L'utente può regolarlo se i risultati sono sistematicamente
// troppo alti o troppo bassi. Default 1.0 = nessuna correzione.
let correctionFactor = 1.0;

// ── Calibrazione altezza atleta nel frame ────────────────
// Durante i primi BL_FRAMES misuriamo quanto spazio occupa
// l'atleta in pixel normalizzati. Questo ci permette di
// convertire il movimento delle anche in cm reali.
let baselineY         = null;
let baselineYSamples  = [];
let baselineBuffer    = [];
let baselineAnkleY    = null;
let baselineAnkleSamples = [];
let athleteHeightNorm = null; // altezza atleta in unità normalizzate
let headYSamples      = [];   // campioni posizione testa
let baselineHeadY     = null; // posizione testa a terra
const BL_FRAMES       = 50;   // più frame per calibrazione più stabile

// ── EMA smoothing ─────────────────────────────────────────
let hipYSmoothed  = null;
let headYSmoothed = null;
const EMA_ALPHA   = 0.20;

// ── Jump detection ────────────────────────────────────────
const AIR_THRESH_INIT = 0.014;  // più sensibile per catturare decollo con rincorsa
const AIR_THRESH_GAME = 0.010;  // mantieni rilevamento in aria
let   AIR_THRESH      = AIR_THRESH_INIT;
const MIN_AIR_FRAMES  = 2;  // ridotto per non perdere decollo durante rincorsa
const MIN_VIS         = 0.4;
let lostFrames        = 0;
const MAX_LOST        = 8;

let maxJumpH = 0, curJumpH = 0, jumpPeakNorm = 0;
let jumpCount = 0, isInAir = false, jumpAirFrames = 0;
let jumpHistory = [], jumpListData = [];

// ── Flight time (informativo) ─────────────────────────────
let flightStartTime = null, lastFlightMs = 0, maxFlightMs = 0;

// ── Approach speed ────────────────────────────────────────
let hipXHistory = [], lastApproachSpd = 0;

// ─────────────────────────────────────────────────────────
// FILE INPUT / DRAG-DROP
// ─────────────────────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', e => handleFile(e.target.files[0]));
const dz = document.getElementById('dropZone');
dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
dz.addEventListener('drop', e => {
  e.preventDefault(); dz.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  if (!file) return;
  videoEl.src = URL.createObjectURL(file);
  document.getElementById('uploadWrap').style.display = 'none';
  document.getElementById('videoWrap').style.display  = 'block';
  resetState();
  setStatus('Video caricato. Seleziona il framerate e premi AVVIA.', '');
}

// ─────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────
function setSlowMoFactor() {
  const sel = document.getElementById('videoFpsSelect');
  slowMoFactor = sel ? parseFloat(sel.value) : 1.0;
}

function setCorrectionFactor(val) {
  correctionFactor = parseFloat(val) || 1.0;
  document.getElementById('corrFactorDisplay').textContent =
    'fattore ×' + correctionFactor.toFixed(2);
}

async function startAnalysis() {
  if (analyzing) return;
  await loadMP();
  resetState();
  setSlowMoFactor();
  correctionFactor = parseFloat(
    document.getElementById('corrFactorInput')?.value || '1.0'
  ) || 1.0;
  resetCalibrationBar();
  analyzing = true;
  videoEl.currentTime = 0;
  document.getElementById('analyzeBtn').disabled = true;
  setStatus('⏳ Calibrazione in corso — atleta fermo nel frame...', 'run');
  document.getElementById('dot2').classList.add('live');
  videoEl.play();
  processFrame();
}

function processFrame() {
  if (!analyzing) return;
  if (videoEl.paused || videoEl.ended) { finishAnalysis(); return; }
  pose.send({ image: videoEl })
    .then(() => { rafId = requestAnimationFrame(processFrame); })
    .catch(() => { rafId = requestAnimationFrame(processFrame); });
}

// ─────────────────────────────────────────────────────────
// POSE RESULTS
// ─────────────────────────────────────────────────────────
function onPoseResults(results) {
  canvas.width  = videoEl.videoWidth  || 640;
  canvas.height = videoEl.videoHeight || 360;
  chartC.width  = chartC.offsetWidth;
  chartC.height = chartC.offsetHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  frameCount++;

  // ── No skeleton ──────────────────────────────────────
  if (!results.poseLandmarks) {
    lostFrames++;
    if (lostFrames > MAX_LOST && isInAir) _landingDetected();
    if (lostFrames > 60 && baselineY !== null) _resetBaseline();
    drawHUD(0.5, 0.5, 0, false, true);
    return;
  }

  const lm  = results.poseLandmarks;
  const lH  = lm[23], rH = lm[24];
  const vis = (lH.visibility + rH.visibility) / 2;

  if (vis < MIN_VIS) {
    lostFrames++;
    if (lostFrames > MAX_LOST && isInAir) _landingDetected();
    if (lostFrames > 45 && baselineY !== null) {
      baselineBuffer = []; baselineAnkleSamples = []; hipYSmoothed = null;
    }
    if (window.drawConnectors && window.POSE_CONNECTIONS)
      drawConnectors(ctx, lm, POSE_CONNECTIONS, { color: 'rgba(100,100,120,0.25)', lineWidth: 1 });
    drawHUD(0.5, 0.5, curJumpH, false, false, '⚠ ATLETA PARZIALMENTE VISIBILE');
    return;
  }

  lostFrames = 0;

  // ── Skeleton ─────────────────────────────────────────
  if (window.drawConnectors && window.POSE_CONNECTIONS) {
    drawConnectors(ctx, lm, POSE_CONNECTIONS, { color: 'rgba(79,142,255,0.6)', lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: '#ff5f7e', fillColor: 'rgba(255,95,126,0.3)', lineWidth: 1, radius: 3 });
    [lm[27], lm[28]].forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x * canvas.width, a.y * canvas.height, 6, 0, Math.PI * 2);
      ctx.fillStyle = isInAir ? 'rgba(255,209,102,0.9)' : 'rgba(0,232,176,0.9)';
      ctx.fill();
    });
  }

  // ── EMA smoothing anche ───────────────────────────────
  const rawHipY = (lH.y + rH.y) / 2;
  const rawHipX = (lH.x + rH.x) / 2;
  hipYSmoothed  = hipYSmoothed === null
    ? rawHipY : EMA_ALPHA * rawHipY + (1 - EMA_ALPHA) * hipYSmoothed;
  const hipY = hipYSmoothed;
  const hipX = rawHipX;

  // ── Testa (punto 0 = naso, punto 7 = orecchio sx) ────
  const headRaw = (lm[0].y + lm[7].y + lm[8].y) / 3;
  headYSmoothed = headYSmoothed === null
    ? headRaw : EMA_ALPHA * headRaw + (1 - EMA_ALPHA) * headYSmoothed;

  // ── Caviglie ──────────────────────────────────────────
  const lA = lm[27], rA = lm[28];
  const ankleY   = (lA.y + rA.y) / 2;
  const ankleVis = (lA.visibility + rA.visibility) / 2;

  // ── Approch speed buffer ──────────────────────────────
  hipXHistory.push({ x: hipX, t: videoEl.currentTime });
  hipXHistory = hipXHistory.filter(p => videoEl.currentTime - p.t <= 2.0);

  // ── CALIBRAZIONE ─────────────────────────────────────
  if (baselineYSamples.length < BL_FRAMES) {
    baselineYSamples.push(hipY);
    headYSamples.push(headYSmoothed);
    if (ankleVis > 0.4) baselineAnkleSamples.push(ankleY);

    const pct = Math.round((baselineYSamples.length / BL_FRAMES) * 100);

    if (baselineYSamples.length === BL_FRAMES) {
      // Anche: 55° percentile
      const sH = [...baselineYSamples].sort((a,b)=>a-b);
      baselineY = sH[Math.floor(sH.length * 0.55)];
      baselineBuffer = [...baselineYSamples];

      // Testa: 45° percentile (più in alto nel frame)
      const sT = [...headYSamples].sort((a,b)=>a-b);
      baselineHeadY = sT[Math.floor(sT.length * 0.45)];

      // Altezza atleta in unità normalizzate = distanza testa-piedi
      // Usiamo testa (y min) e caviglie (y max)
      if (baselineAnkleSamples.length > 10) {
        const sA = [...baselineAnkleSamples].sort((a,b)=>a-b);
        baselineAnkleY = sA[Math.floor(sA.length * 0.70)];
        // athleteHeightNorm = distanza verticale testa→caviglie nel frame
        athleteHeightNorm = baselineAnkleY - baselineHeadY;
      }

      setStatus('✅ Calibrazione completata! Pronto per il salto.', 'ok');
      showCalibrationBanner();
    } else {
      setStatus(`⏳ Calibrazione ${pct}% — atleta fermo nel frame...`, 'run');
      updateCalibrationBar(pct);
    }
    drawHUD(hipX, hipY, 0, true, false);
    return;
  }

  // ── ADAPTIVE BASELINE ─────────────────────────────────
  if (frameCount % 8 === 0 && !isInAir) {
    const elevCheck = baselineY - hipY;
    if (elevCheck < AIR_THRESH * 0.5) {
      baselineBuffer.push(hipY);
      if (baselineBuffer.length > 90) baselineBuffer.shift();
      const sorted = [...baselineBuffer].sort((a,b)=>a-b);
      baselineY = sorted[Math.floor(sorted.length * 0.55)];
      if (ankleVis > 0.4) {
        baselineAnkleSamples.push(ankleY);
        if (baselineAnkleSamples.length > 90) baselineAnkleSamples.shift();
        const sa = [...baselineAnkleSamples].sort((a,b)=>a-b);
        baselineAnkleY = sa[Math.floor(sa.length * 0.70)];
      }
    }
  }

  // ── CALCOLO ELEVAZIONE ───────────────────────────────
  const elevNorm = baselineY - hipY;

  // ── FORMULA DEFINITIVA ───────────────────────────────
  // elevCm = elevNorm * athHeightCm / HIP_RATIO
  //
  // HIP_RATIO = 0.52 (rapporto anatomico fisso: le anche sono
  // sempre al 52% dell'altezza corporea per qualsiasi atleta)
  //
  // Questo funziona perché:
  // - elevNorm = spostamento anche in unità normalizzate
  // - athHeightCm / HIP_RATIO = cm reali per unità normalizzata
  //   calibrati sull'altezza REALE dell'atleta nel profilo
  // - Non dipende da testa/caviglie (instabili) né da distanza camera
  //
  // correctionFactor aggiusta distanze non standard
  const athId       = document.getElementById('sessionAthlete').value;
  const ath         = athId ? getAthleteById(athId) : null;
  const athHeightCm = (ath && ath.height) ? parseInt(ath.height) : 180;
  const HIP_RATIO   = 0.52;
  const elevCm = Math.max(0, elevNorm * (athHeightCm / HIP_RATIO) * correctionFactor);
  curJumpH = Math.round(elevCm);

  // ── JUMP DETECTION ────────────────────────────────────
  const ankleOnGround = baselineAnkleY !== null && ankleVis > 0.3
    && (ankleY >= baselineAnkleY - 0.018);

  if (elevNorm > AIR_THRESH && !ankleOnGround) {
    if (!isInAir) {
      jumpAirFrames++;
      if (jumpAirFrames >= MIN_AIR_FRAMES) {
        isInAir         = true;
        jumpPeakNorm    = 0;
        flightStartTime = videoEl.currentTime;
        AIR_THRESH      = AIR_THRESH_GAME;

        const now = videoEl.currentTime;
        const w05 = hipXHistory.filter(p => now - p.t <= 0.6 && now - p.t > 0.05);
        if (w05.length >= 2) {
          const dx = Math.abs(w05[w05.length-1].x - w05[0].x) * 4.0;
          const dt = (w05[w05.length-1].t - w05[0].t) * slowMoFactor;
          if (dt > 0) lastApproachSpd = Math.round(dx / dt * 10) / 10;
        }
      }
    }
    if (isInAir) jumpPeakNorm = Math.max(jumpPeakNorm, elevNorm);
  } else {
    jumpAirFrames = 0;  // reset immediato all'atterraggio
    if (isInAir) _landingDetected();
  }

  if (frameCount % 4 === 0) {
    jumpHistory.push(Math.max(0, curJumpH));
    if (jumpHistory.length > 200) jumpHistory.shift();
    drawChart();
  }

  updateStats();
  drawHUD(hipX, hipY, curJumpH, false, false);

  const hasAth = document.getElementById('sessionAthlete').value;
  document.getElementById('saveBtn').disabled = !(hasAth && jumpListData.length);
  const waBtn = document.getElementById('waBtn');
  if (waBtn) waBtn.disabled = !jumpListData.length;
}

// ─────────────────────────────────────────────────────────
// LANDING — usa picco elevazione in cm (pixel calibrato)
// ─────────────────────────────────────────────────────────
function _landingDetected() {
  if (!isInAir || jumpPeakNorm <= 0) {
    isInAir = false; jumpAirFrames = 0; return;
  }

  // Stessa formula di onPoseResults
  const athId2      = document.getElementById('sessionAthlete').value;
  const ath2        = athId2 ? getAthleteById(athId2) : null;
  const athH2       = (ath2 && ath2.height) ? parseInt(ath2.height) : 180;
  const HIP_RATIO   = 0.52;
  const heightCm = Math.round(jumpPeakNorm * (athH2 / HIP_RATIO) * correctionFactor);

  // Tempo di volo (informativo, con correzione slowMo)
  if (flightStartTime !== null) {
    const videoFlightSec = videoEl.currentTime - flightStartTime;
    const realFlightSec  = videoFlightSec / slowMoFactor;
    lastFlightMs = Math.round(realFlightSec * 1000);
    if (lastFlightMs > maxFlightMs) maxFlightMs = lastFlightMs;
    flightStartTime = null;
  }

  // Sanity check
  if (heightCm < 5 || heightCm > 120) {
    isInAir = false; jumpAirFrames = 0; jumpPeakNorm = 0; return;
  }

  jumpCount++;
  jumpListData.push(heightCm);
  if (heightCm > maxJumpH) maxJumpH = heightCm;
  curJumpH = heightCm;

  addJumpItem(heightCm, heightCm === maxJumpH, lastFlightMs, lastApproachSpd);
  isInAir = false; jumpAirFrames = 0; jumpPeakNorm = 0;
}

function _resetBaseline() {
  baselineY = null; baselineYSamples = []; baselineBuffer = [];
  baselineAnkleY = null; baselineAnkleSamples = [];
  baselineHeadY = null; headYSamples = []; athleteHeightNorm = null;
  hipYSmoothed = null; headYSmoothed = null;
  setStatus('⚠ Atleta uscito — ricalibrazione in corso...', 'run');
}

// ─────────────────────────────────────────────────────────
// DRAWING
// ─────────────────────────────────────────────────────────
function drawHUD(hipX, hipY, elev, calib, noSkeleton, warning) {
  const cx = hipX * canvas.width, cy = hipY * canvas.height;

  if (baselineY !== null && !noSkeleton) {
    const by = baselineY * canvas.height;
    ctx.beginPath(); ctx.setLineDash([5,4]);
    ctx.strokeStyle = 'rgba(79,142,255,0.4)'; ctx.lineWidth = 1.5;
    ctx.moveTo(0, by); ctx.lineTo(canvas.width, by); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(79,142,255,0.6)'; ctx.font = '8px JetBrains Mono,monospace';
    ctx.fillText('BASELINE ANCHE', 4, by - 4);

    if (cy < by && isInAir) {
      ctx.beginPath(); ctx.strokeStyle = '#00e8b0'; ctx.lineWidth = 3;
      ctx.moveTo(cx, by); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.beginPath(); ctx.fillStyle = '#00e8b0';
      ctx.moveTo(cx, cy-9); ctx.lineTo(cx-6, cy+4); ctx.lineTo(cx+6, cy+4); ctx.fill();
      ctx.fillStyle = '#00e8b0'; ctx.font = 'bold 12px JetBrains Mono,monospace';
      ctx.fillText(elev + 'cm', cx + 10, cy + 4);
    }
  }

  const boxH = warning ? 62 : 52;
  ctx.fillStyle = 'rgba(7,8,13,0.85)'; ctx.fillRect(8, 8, 240, boxH);
  ctx.strokeStyle = calib ? '#ffd166' : noSkeleton ? '#ff5f7e' : '#4f8eff';
  ctx.lineWidth = 1; ctx.strokeRect(8, 8, 240, boxH);

  ctx.font = 'bold 10px JetBrains Mono,monospace';
  if (calib) {
    ctx.fillStyle = '#ffd166'; ctx.fillText('CALIBRAZIONE IN CORSO...', 18, 28);
  } else if (noSkeleton) {
    ctx.fillStyle = '#ff5f7e'; ctx.fillText('⚠ ATLETA NON RILEVATO', 18, 28);
  } else {
    ctx.fillStyle = isInAir ? '#00e8b0' : '#4f8eff';
    ctx.fillText(isInAir ? '▲ IN ARIA — ' + elev + ' cm' : '● A TERRA', 18, 28);
  }

  const calOk = athleteHeightNorm ? '✓ cal' : '⏳ cal';
  ctx.fillStyle = '#4a5080'; ctx.font = '9px JetBrains Mono,monospace';
  ctx.fillText(`SALTI:${jumpCount}  MAX:${maxJumpH}cm  VOLO:${lastFlightMs||'--'}ms  ${calOk}`, 18, 44);

  if (warning) {
    ctx.fillStyle = '#ffd166'; ctx.font = '8px JetBrains Mono,monospace';
    ctx.fillText(warning, 18, 58);
  }
}

function drawChart() {
  const w = chartC.width, h = chartC.height;
  chartCtx.clearRect(0,0,w,h);
  if (jumpHistory.length < 2) return;
  const max = Math.max(...jumpHistory, 10), step = w/(jumpHistory.length-1);
  const grad = chartCtx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'rgba(79,142,255,0.3)'); grad.addColorStop(1,'rgba(79,142,255,0)');
  chartCtx.beginPath(); chartCtx.moveTo(0,h);
  jumpHistory.forEach((v,i) => chartCtx.lineTo(i*step, h-(v/max)*(h-6)));
  chartCtx.lineTo(w,h); chartCtx.closePath(); chartCtx.fillStyle=grad; chartCtx.fill();
  chartCtx.beginPath(); chartCtx.strokeStyle='#4f8eff'; chartCtx.lineWidth=1.5;
  jumpHistory.forEach((v,i)=>{ const x=i*step,y=h-(v/max)*(h-6); i===0?chartCtx.moveTo(x,y):chartCtx.lineTo(x,y); });
  chartCtx.stroke();
}

// ─────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────
function updateStats() {
  const avg = jumpListData.length
    ? Math.round(jumpListData.reduce((a,b)=>a+b,0)/jumpListData.length) : null;
  document.getElementById('maxJump').innerHTML    = (maxJumpH||'--')+'<span class="st-unit">cm</span>';
  document.getElementById('curJump').innerHTML    = (curJumpH||'--')+'<span class="st-unit">cm</span>';
  document.getElementById('jumpCount').textContent = jumpCount;
  document.getElementById('avgJump').innerHTML    = (avg||'--')+'<span class="st-unit">cm</span>';
  document.getElementById('flightTime').innerHTML = (lastFlightMs||'--')+'<span class="st-unit">ms</span>';
  document.getElementById('approachSpeed').innerHTML = (lastApproachSpd||'--')+'<span class="st-unit">m/s</span>';
  const r = maxJumpH>=60?'🏆 Eccellente':maxJumpH>=45?'✅ Buono':maxJumpH>=30?'📈 Nella media':'🔄 In analisi';
  document.getElementById('maxBadge').textContent  = maxJumpH ? r : 'In attesa';
  document.getElementById('curBadge').textContent  = isInAir ? '🔴 IN ARIA' : '⚫ A TERRA';
  if (lastFlightMs) document.getElementById('flightSub').textContent = `max: ${maxFlightMs}ms`;
  if (lastApproachSpd) document.getElementById('approachSub').textContent = lastApproachSpd>3?'🔥 Esplosiva':'💨 Moderata';
  if (jumpListData.length >= 4) {
    const half = Math.floor(jumpListData.length/2);
    const a1 = jumpListData.slice(0,half).reduce((a,b)=>a+b,0)/half;
    const a2 = jumpListData.slice(half).reduce((a,b)=>a+b,0)/(jumpListData.length-half);
    const drop = Math.round(a1-a2);
    const fb = document.getElementById('fatigueBadge');
    if (fb) fb.textContent = drop>=3?`⚠ calo ${drop}cm`:drop<=-2?`✓ +${Math.abs(drop)}cm`:'sessione';
  }
}

function addJumpItem(h, best, flightMs, approachSpd) {
  const list = document.getElementById('jumpList');
  const ph = list.querySelector('div:not(.jitem)'); if (ph) ph.remove();
  const el = document.createElement('div');
  el.className = 'jitem'+(best?' best':'');
  el.innerHTML = `
    <div>
      <span class="j-num">SALTO #${jumpCount}</span>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:var(--muted);margin-top:2px;">
        ${flightMs?'⏱ '+flightMs+'ms':''}${flightMs&&approachSpd?' · ':''}${approachSpd?'💨 '+approachSpd+'m/s':''}
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span class="j-val">${h}<span style="font-size:.8rem;color:var(--muted)"> cm</span></span>
      ${best?'<span class="j-badge">BEST</span>':''}
    </div>`;
  list.prepend(el);
}

// ─────────────────────────────────────────────────────────
// SESSION / WHATSAPP
// ─────────────────────────────────────────────────────────
function saveSession() {
  const athId = document.getElementById('sessionAthlete').value;
  if (!athId || !jumpListData.length) return;
  const avg = Math.round(jumpListData.reduce((a,b)=>a+b,0)/jumpListData.length);
  addSession({
    athleteId: athId, date: new Date().toLocaleDateString('it-IT'),
    dateSort: Date.now(), maxHeight: maxJumpH, avgHeight: avg,
    jumpCount, maxFlightMs, lastApproachSpd,
    note: document.getElementById('sessionNote').value||'',
    jumps: [...jumpListData],
  });
  document.getElementById('saveBtn').disabled = true;
  showToast('✓ Sessione salvata! Max: '+maxJumpH+' cm');
}

function shareWhatsApp() {
  const athId = document.getElementById('sessionAthlete').value;
  const ath   = athId ? getAthleteById(athId) : null;
  const name  = ath ? ath.name : 'Atleta';
  const avg   = jumpListData.length
    ? Math.round(jumpListData.reduce((a,b)=>a+b,0)/jumpListData.length) : 0;
  const fpsLabels = {'1':'30fps','2':'60fps','4':'120fps','8':'240fps'};
  const fpsSel    = document.getElementById('videoFpsSelect');
  const fpsLabel  = fpsLabels[fpsSel?fpsSel.value:'1']||'';
  const rating = maxJumpH>=60?'🏆 Eccellente':maxJumpH>=45?'✅ Buono':maxJumpH>=30?'📈 Nella media':'🔰 In sviluppo';
  const club = JSON.parse(localStorage.getItem('vbjump_club')||'{}');
  const clubLine = club.name?`${club.emoji||'🏐'} ${club.name}\n`:'';
  const msg = `${clubLine}📊 *REPORT SALTO — ${name}*\n\n`
    +`🔝 Elevazione max: *${maxJumpH} cm*\n`
    +`📈 Media sessione: *${avg} cm*\n`
    +`🔢 Salti analizzati: *${jumpCount}*\n`
    +`⏱ Volo max: *${maxFlightMs||'--'} ms*\n`
    +`${rating}\n\n`
    +`📹 Video: ${fpsLabel}\n`
    +`📅 ${new Date().toLocaleDateString('it-IT')}\n\n`
    +`_Analisi effettuata con VBJump Pro_`;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

// ─────────────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────────────
function resetState() {
  baselineY=null; baselineYSamples=[]; baselineBuffer=[];
  baselineAnkleY=null; baselineAnkleSamples=[];
  baselineHeadY=null; headYSamples=[]; athleteHeightNorm=null;
  hipYSmoothed=null; headYSmoothed=null; hipXHistory=[];
  maxJumpH=0; curJumpH=0; jumpPeakNorm=0; jumpCount=0;
  isInAir=false; jumpAirFrames=0; lostFrames=0;
  flightStartTime=null; lastFlightMs=0; maxFlightMs=0; lastApproachSpd=0;
  AIR_THRESH=AIR_THRESH_INIT;
  jumpHistory=[]; jumpListData=[]; frameCount=0;
  document.getElementById('jumpList').innerHTML =
    '<div style="text-align:center;padding:16px;font-family:\'JetBrains Mono\',monospace;font-size:0.65rem;color:var(--muted);">Nessun salto ancora</div>';
  ctx.clearRect(0,0,canvas.width,canvas.height);
  updateStats();
  document.getElementById('saveBtn').disabled=true;
  const wb=document.getElementById('waBtn'); if(wb) wb.disabled=true;
}

function resetAnalysis() {
  analyzing=false; cancelAnimationFrame(rafId);
  videoEl.pause(); videoEl.src=''; resetState();
  // Reset input file — senza questo il browser non triggera
  // il change event se si riseleziona lo stesso file
  const fi = document.getElementById('fileInput');
  if (fi) fi.value = '';
  // Libera memoria URL oggetto
  if (videoEl.src && videoEl.src.startsWith('blob:')) {
    URL.revokeObjectURL(videoEl.src);
  }
  videoEl.src = '';
  document.getElementById('uploadWrap').style.display='block';
  document.getElementById('videoWrap').style.display='none';
  document.getElementById('analyzeBtn').disabled=false;
  document.getElementById('dot2').classList.remove('live');
  // Reset barra calibrazione
  resetCalibrationBar();
  // Reset slider correzione
  const slider = document.getElementById('corrFactorInput');
  if (slider) { slider.value = '1.0'; setCorrectionFactor('1.0'); }
  setStatus('Pronto. Seleziona framerate e premi AVVIA.','');
}

function finishAnalysis() {
  analyzing=false; cancelAnimationFrame(rafId);
  document.getElementById('analyzeBtn').disabled=false;
  document.getElementById('dot2').classList.remove('live');
  const hasAth=document.getElementById('sessionAthlete').value;
  if(hasAth&&jumpListData.length) document.getElementById('saveBtn').disabled=false;
  const wb=document.getElementById('waBtn');
  if(wb&&jumpListData.length) wb.disabled=false;
  setStatus(`✓ Analisi completata — ${jumpCount} salti, max ${maxJumpH}cm`,'ok');
}

function setStatus(msg,cls) {
  const b=document.getElementById('statusBar');
  b.textContent=msg; b.className='status '+(cls||'');
}

// ─────────────────────────────────────────────────────────
// MEDIAPIPE
// ─────────────────────────────────────────────────────────
function loadMP() {
  return new Promise((resolve,reject)=>{
    if(poseLoaded){resolve();return;}
    document.getElementById('loadingOv').classList.add('show');
    const scripts=[
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
    ];
    let i=0;
    function next(){
      if(i>=scripts.length){
        initPose().then(()=>{
          document.getElementById('loadingOv').classList.remove('show');
          poseLoaded=true; resolve();
        }).catch(reject); return;
      }
      const s=document.createElement('script');
      s.src=scripts[i++]; s.onload=next;
      s.onerror=()=>reject(new Error('MediaPipe non caricato'));
      document.head.appendChild(s);
    }
    next();
  });
}

async function initPose(){
  pose=new Pose({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`});
  pose.setOptions({modelComplexity:1,smoothLandmarks:true,enableSegmentation:false,
    minDetectionConfidence:0.5,minTrackingConfidence:0.5});
  pose.onResults(onPoseResults);
  await pose.initialize();
}
