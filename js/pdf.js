// ══════════════════════════════════════════════════════════
// pdf.js — PDF report export
// ══════════════════════════════════════════════════════════

function exportPDF(athId) {
  const ath = getAthleteById(athId);
  if (!ath) { showToast('Atleta non trovato'); return; }

  const sessions = getSessionsByAthlete(athId);
  const maxEver  = sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
  const avgAll   = sessions.length
    ? Math.round(sessions.map(s => s.maxHeight).reduce((a, b) => a + b, 0) / sessions.length) : 0;
  const trend    = sessions.length >= 2
    ? sessions[sessions.length - 1].maxHeight - sessions[0].maxHeight : 0;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;

  // ── Backgrounds ──────────────────────────────────────
  doc.setFillColor(7, 8, 13);   doc.rect(0, 0, W, 40,  'F');
  doc.setFillColor(13, 15, 26); doc.rect(0, 40, W, 257, 'F');
  doc.setFillColor(79, 142, 255); doc.rect(0, 0, 4, 297, 'F'); // accent bar

  // ── Logo ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
  doc.setTextColor(79, 142, 255);
  doc.text('VBJUMP', margin, 22);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.setTextColor(74, 80, 128);
  doc.text('VOLLEYBALL ANALYTICS PRO', margin, 29);
  doc.setFontSize(9); doc.setTextColor(79, 142, 255);
  doc.text('REPORT ATLETA', W - margin, 22, { align: 'right' });
  doc.setFontSize(7); doc.setTextColor(74, 80, 128);
  doc.text(new Date().toLocaleDateString('it-IT'), W - margin, 29, { align: 'right' });

  // ── Athlete info ──────────────────────────────────────
  let y = 52;
  doc.setFillColor(18, 21, 42);
  doc.roundedRect(margin, y, W - margin * 2, 32, 3, 3, 'F');
  doc.setDrawColor(37, 40, 80);
  doc.roundedRect(margin, y, W - margin * 2, 32, 3, 3, 'S');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.setTextColor(221, 226, 245);
  doc.text(ath.name, margin + 8, y + 11);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.setTextColor(74, 80, 128);
  const age2 = ath.birth ? new Date().getFullYear() - ath.birth : null;
  doc.text(ath.role + (age2 ? ' · ' + age2 + ' anni' : ''), margin + 8, y + 19);

  const bmi2 = (ath.height && ath.weight)
    ? (ath.weight / ((ath.height / 100) ** 2)).toFixed(1) : null;
  const physLine = [
    ath.height ? 'Altezza: ' + ath.height + 'cm' : '',
    ath.weight ? 'Peso: '    + ath.weight + 'kg' : '',
    bmi2       ? 'IMC: '     + bmi2             : '',
  ].filter(Boolean).join('  ·  ');
  if (physLine) doc.text(physLine, margin + 8, y + 26);
  doc.text(
    sessions.length + ' sessioni' + (ath.goal ? '  ·  Obiettivo: ' + ath.goal + 'cm' : ''),
    margin + 8, y + 32
  );

  // ── Key stats ─────────────────────────────────────────
  y += 40;
  const statW = (W - margin * 2 - 12) / 3;
  [
    { label: 'RECORD PERSONALE', val: maxEver + 'cm', color: [79, 142, 255] },
    { label: 'MEDIA SESSIONI',   val: avgAll  + 'cm', color: [255, 209, 102] },
    { label: 'TREND TOTALE',     val: (trend >= 0 ? '+' : '') + trend + 'cm',
      color: trend >= 0 ? [0, 232, 176] : [255, 95, 126] },
  ].forEach((s, i) => {
    const x = margin + i * (statW + 6);
    doc.setFillColor(13, 15, 26); doc.roundedRect(x, y, statW, 24, 2, 2, 'F');
    doc.setFillColor(...s.color); doc.rect(x, y, statW, 2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.setTextColor(74, 80, 128); doc.text(s.label, x + 6, y + 9);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.setTextColor(...s.color); doc.text(s.val, x + 6, y + 21);
  });

  // ── Sessions table ────────────────────────────────────
  y += 32;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.setTextColor(74, 80, 128);
  doc.text('STORICO SESSIONI', margin, y);
  doc.setDrawColor(28, 32, 64); doc.line(margin, y + 3, W - margin, y + 3);
  y += 9;

  doc.setFillColor(13, 15, 26); doc.rect(margin, y, W - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
  doc.setTextColor(74, 80, 128);
  ['DATA', 'MAX', 'MEDIA', 'SALTI', 'VOLO', 'NOTE'].forEach((t, i) => {
    const cols = [4, 52, 75, 98, 116, 132];
    doc.text(t, margin + cols[i], y + 5.5);
  });
  y += 9;

  sessions.slice().reverse().forEach((s, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(12, 14, 22); doc.rect(margin, y, W - margin * 2, 7, 'F'); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.setTextColor(221, 226, 245); doc.text(s.date, margin + 4, y + 5);
    doc.setTextColor(79, 142, 255); doc.setFont('helvetica', 'bold');
    doc.text(s.maxHeight + 'cm', margin + 52, y + 5);
    doc.setTextColor(221, 226, 245); doc.setFont('helvetica', 'normal');
    doc.text(s.avgHeight + 'cm', margin + 75, y + 5);
    doc.text(String(s.jumpCount), margin + 102, y + 5);
    doc.text(s.maxFlightMs ? s.maxFlightMs + 'ms' : '—', margin + 116, y + 5);
    doc.setTextColor(74, 80, 128);
    doc.text((s.note || '—').substring(0, 20), margin + 132, y + 5);

    if (maxEver > 0) {
      const bx = margin + 165, bw = 25, bh = 2.5;
      doc.setFillColor(28, 32, 64); doc.roundedRect(bx, y + 2.5, bw, bh, 1, 1, 'F');
      doc.setFillColor(79, 142, 255);
      doc.roundedRect(bx, y + 2.5, bw * (s.maxHeight / maxEver), bh, 1, 1, 'F');
    }
    y += 7;
  });

  if (!sessions.length) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(74, 80, 128);
    doc.text('Nessuna sessione registrata.', margin + 4, y + 6);
    y += 14;
  }

  // ── Footer ────────────────────────────────────────────
  doc.setFillColor(13, 15, 26); doc.rect(0, 285, W, 12, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.setTextColor(74, 80, 128);
  doc.text('VBJump Pro — Volleyball Analytics — ' + new Date().toLocaleDateString('it-IT'), margin, 292);
  doc.setTextColor(79, 142, 255);
  doc.text('CONFIDENZIALE', W - margin, 292, { align: 'right' });

  const filename = 'VBJump_' + ath.name.replace(/\s+/g, '_') + '_'
    + new Date().toLocaleDateString('it-IT').replace(/\//g, '-') + '.pdf';
  doc.save(filename);
  showToast('📄 PDF scaricato!');
}
