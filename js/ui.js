// ══════════════════════════════════════════════════════════
// ui.js — Shared UI utilities
// ══════════════════════════════════════════════════════════

// ── Modal ─────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal on backdrop click
document.querySelectorAll('.modal-ov').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); })
);

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── FPS selector ─────────────────────────────────────────
function selectFps(btn, factor) {
  // Deseleziona tutti
  [1,2,4,8].forEach(f => {
    const b = document.getElementById('fps-'+f);
    if (b) {
      b.style.background = 'transparent';
      b.style.color = 'var(--muted)';
      b.style.borderColor = 'var(--brd)';
    }
  });
  // Seleziona quello cliccato
  btn.style.background = 'rgba(79,142,255,0.15)';
  btn.style.color = 'var(--blue)';
  btn.style.borderColor = 'var(--blue)';
  // Aggiorna hidden input
  const sel = document.getElementById('videoFpsSelect');
  if (sel) sel.value = factor;
}

// ── Calibration bar ───────────────────────────────────────
function updateCalibrationBar(pct) {
  let bar = document.getElementById('calibBar');
  if (!bar) return;
  bar.style.width = pct + '%';
  // Colore progressivo
  bar.style.background = pct < 50
    ? 'var(--red)'
    : pct < 80
    ? 'var(--yellow)'
    : 'var(--green)';
}

function showCalibrationBanner() {
  // Nascondi barra calibrazione
  const wrap = document.getElementById('calibBarWrap');
  if (wrap) {
    wrap.style.background = 'rgba(0,232,176,0.1)';
    wrap.style.borderColor = 'rgba(0,232,176,0.4)';
    setTimeout(() => { wrap.style.display = 'none'; }, 2500);
  }
  // Vibrazione breve su mobile
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function resetCalibrationBar() {
  const wrap = document.getElementById('calibBarWrap');
  if (wrap) {
    wrap.style.display = 'block';
    wrap.style.background = 'rgba(0,0,0,0.3)';
    wrap.style.borderColor = 'var(--brd)';
  }
  const bar = document.getElementById('calibBar');
  if (bar) { bar.style.width = '0%'; bar.style.background = 'var(--blue)'; }
}
