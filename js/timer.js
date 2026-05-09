// ══════════════════════════════════════════════════════════
// timer.js — Timer integrato per esercizi scheda
// ══════════════════════════════════════════════════════════

let timerInterval = null;
let timerSeconds  = 0;
let timerRunning  = false;

// ── Show timer modal ──────────────────────────────────────
function openTimer(seconds, label) {
  timerSeconds = seconds;
  timerRunning = false;
  clearInterval(timerInterval);

  document.getElementById('timerLabel').textContent = label || 'RECUPERO';
  document.getElementById('timerModal').classList.add('open');
  updateTimerDisplay();
}

function closeTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('timerModal').classList.remove('open');
}

function startPauseTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timerStartBtn').textContent = '▶ RIPRENDI';
  } else {
    timerRunning = true;
    document.getElementById('timerStartBtn').textContent = '⏸ PAUSA';
    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timerStartBtn').textContent = '▶ START';
        // Vibrazione se supportata
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        showToast('⏱ Recupero completato!');
        // Suono beep
        playBeep();
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('timerStartBtn').textContent = '▶ START';
  updateTimerDisplay();
}

function addTimerSeconds(s) {
  timerSeconds = Math.max(0, timerSeconds + s);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  const display = m + ':' + String(s).padStart(2, '0');
  document.getElementById('timerDisplay').textContent = display;

  // Cambio colore quando mancano pochi secondi
  const el = document.getElementById('timerDisplay');
  if (timerSeconds <= 5)       el.style.color = 'var(--red)';
  else if (timerSeconds <= 15) el.style.color = 'var(--yellow)';
  else                         el.style.color = 'var(--green)';

  // Progress ring
  const maxSec = parseInt(document.getElementById('timerMaxSec').value || timerSeconds + 1);
  const pct = Math.max(0, timerSeconds / maxSec);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct);
  const ring = document.getElementById('timerRing');
  if (ring) {
    ring.style.strokeDasharray  = circumference;
    ring.style.strokeDashoffset = offset;
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.2, 0.4].forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch(e) {}
}

// ── Parse rest string to seconds ─────────────────────────
function parseRestToSeconds(restStr) {
  // es. "2min" → 120, "90s" → 90, "3min" → 180
  if (!restStr) return 60;
  const min = restStr.match(/(\d+)\s*min/);
  const sec = restStr.match(/(\d+)\s*s/);
  if (min) return parseInt(min[1]) * 60;
  if (sec) return parseInt(sec[1]);
  return 60;
}
