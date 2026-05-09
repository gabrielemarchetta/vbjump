// ══════════════════════════════════════════════════════════
// db.js — Database & localStorage
// ══════════════════════════════════════════════════════════

const DB_KEY = 'vbjump3';

let db = JSON.parse(localStorage.getItem(DB_KEY) || '{"athletes":[],"sessions":[]}');

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ── Athlete helpers ──────────────────────────────────────
function getAllAthletes() {
  return db.athletes;
}

function getAthleteById(id) {
  return db.athletes.find(a => a.id === id) || null;
}

function addAthlete(data) {
  const athlete = { id: Date.now().toString(), ...data };
  db.athletes.push(athlete);
  saveDB();
  return athlete;
}

function updateAthlete(id, data) {
  const idx = db.athletes.findIndex(a => a.id === id);
  if (idx < 0) return false;
  db.athletes[idx] = { ...db.athletes[idx], ...data };
  saveDB();
  return true;
}

function deleteAthlete(id) {
  db.athletes  = db.athletes.filter(a => a.id !== id);
  db.sessions  = db.sessions.filter(s => s.athleteId !== id);
  saveDB();
}

// ── Session helpers ──────────────────────────────────────
function getSessionsByAthlete(athleteId) {
  return db.sessions
    .filter(s => s.athleteId === athleteId)
    .sort((a, b) => a.dateSort - b.dateSort);
}

function addSession(data) {
  const session = { id: Date.now().toString(), ...data };
  db.sessions.push(session);
  saveDB();
  return session;
}

function deleteSession(id) {
  db.sessions = db.sessions.filter(s => s.id !== id);
  saveDB();
}

function getAthleteMaxHeight(athleteId) {
  const sessions = getSessionsByAthlete(athleteId);
  return sessions.length ? Math.max(...sessions.map(s => s.maxHeight)) : 0;
}
