// localStorage 영속화 — 진행 상태 + 통계 + 설정
const KEY_STATE = 'kkodle_state_v1';
const KEY_STATS = 'kkodle_stats_v1';
const KEY_PREFS = 'kkodle_prefs_v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 사파리 시크릿 등 */ }
}

/** 오늘 퍼즐 진행 상태 저장 */
export function saveGameState(game) {
  write(KEY_STATE, {
    puzzleNum: game.puzzleNum,
    rows: game.rows,
    status: game.status,
  });
}

/** 오늘 퍼즐이면 복원, 아니면 null */
export function loadGameState(puzzleNum) {
  const s = read(KEY_STATE, null);
  if (!s || s.puzzleNum !== puzzleNum) return null;
  if (!Array.isArray(s.rows)) return null;
  return s;
}

const EMPTY_STATS = {
  played: 0, wins: 0, streak: 0, maxStreak: 0,
  dist: [0, 0, 0, 0, 0, 0], lastPuzzle: 0,
};

export function loadStats() {
  const s = read(KEY_STATS, EMPTY_STATS);
  return { ...EMPTY_STATS, ...s, dist: s.dist || [...EMPTY_STATS.dist] };
}

/** 게임 종료 시 1회만 호출 */
export function recordResult(puzzleNum, won, tries) {
  const s = loadStats();
  if (s.lastPuzzle === puzzleNum) return s; // 중복 기록 방지
  s.played++;
  if (won) {
    s.wins++;
    s.streak = s.lastPuzzle === puzzleNum - 1 ? s.streak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.dist[tries - 1]++;
  } else {
    s.streak = 0;
  }
  s.lastPuzzle = puzzleNum;
  write(KEY_STATS, s);
  return s;
}

export function loadPrefs() {
  return read(KEY_PREFS, { theme: 'dark', contrast: false, seenHelp: false });
}
export function savePrefs(prefs) {
  write(KEY_PREFS, prefs);
}
