// 꼬들 UI 엔트리 — DOM 렌더링, 입력 처리, 모달, 공유
import { getTodayAnswer, msUntilNextPuzzle } from './words.js';
import {
  createGame, addJamo, removeJamo, submitGuess, keyboardStates, shareText,
  MAX_TRIES, WORD_LEN,
} from './game.js';
import { composeWord, evaluateGuess, wordToJamo } from './hangul.js';
import {
  saveGameState, loadGameState, loadStats, recordResult, loadPrefs, savePrefs,
} from './storage.js';

const FLIP_MS = 280;          // 타일 1개 뒤집기 시간
const FLIP_STAGGER = 200;     // 타일 간 지연
const WIN_MESSAGES = ['천재!', '대단해요!', '굉장해요!', '멋져요!', '잘했어요!', '휴, 아슬아슬!'];

// ── 상태 ──────────────────────────────────────────
const firstVisit = localStorage.getItem('kkodle_prefs_v1') === null;
const prefs = loadPrefs();
if (firstVisit && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
  prefs.theme = 'light';
}
const today = getTodayAnswer();
let game = createGame(today.jamo, today.num);
let shiftOn = false;
let animating = false;

// 저장된 진행 복원
const saved = loadGameState(today.num);
if (saved) {
  for (const row of saved.rows) {
    game.rows.push({
      jamos: row.jamos,
      result: evaluateGuess(row.jamos, game.answer),
      word: row.word,
    });
  }
  game.status = saved.status;
}

// ── DOM 참조 ──────────────────────────────────────
const $board = document.getElementById('board');
const $keyboard = document.getElementById('keyboard');
const $preview = document.getElementById('preview');
const $toastWrap = document.getElementById('toast-wrap');

// ── 테마 ──────────────────────────────────────────
function applyPrefs() {
  document.documentElement.dataset.theme = prefs.theme;
  document.documentElement.dataset.contrast = prefs.contrast ? 'high' : '';
  document.getElementById('btn-theme').textContent = prefs.theme === 'dark' ? '☀' : '🌙';
}
applyPrefs();

// ── 보드 렌더 ─────────────────────────────────────
function buildBoard() {
  $board.innerHTML = '';
  for (let r = 0; r < MAX_TRIES; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.row = r;
    for (let c = 0; c < WORD_LEN; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.col = c;
      row.appendChild(tile);
    }
    $board.appendChild(row);
  }
}

function renderRows({ animateLast = false } = {}) {
  const rows = $board.children;
  for (let r = 0; r < MAX_TRIES; r++) {
    const rowEl = rows[r];
    const submitted = game.rows[r];
    for (let c = 0; c < WORD_LEN; c++) {
      const tile = rowEl.children[c];
      if (submitted) {
        tile.textContent = submitted.jamos[c];
        if (animateLast && r === game.rows.length - 1) continue; // 애니메이션으로 처리
        tile.className = `tile ${submitted.result[c]}`;
      } else if (r === game.rows.length) {
        const j = game.current[c];
        tile.textContent = j || '';
        tile.className = j ? 'tile filled' : 'tile';
      } else {
        tile.textContent = '';
        tile.className = 'tile';
      }
    }
  }
  renderPreview();
}

function renderPreview() {
  if (game.status !== 'playing') {
    if (game.status === 'lost') {
      $preview.innerHTML = `정답 <span class="answer-reveal">${composeWord(game.answer)}</span>`;
    } else {
      $preview.innerHTML = '&nbsp;';
    }
    return;
  }
  if (game.current.length === 0) {
    $preview.innerHTML = '&nbsp;';
    return;
  }
  const word = game.current.length === WORD_LEN ? composeWord(game.current) : null;
  $preview.innerHTML = word
    ? `<strong>${word}</strong>`
    : game.current.join(' ');
}

/** 마지막 제출 행 타일 순차 뒤집기 */
function animateReveal(rowIdx, result, done) {
  animating = true;
  const rowEl = $board.children[rowIdx];
  result.forEach((state, c) => {
    setTimeout(() => {
      const tile = rowEl.children[c];
      tile.style.transition = `transform ${FLIP_MS / 2}ms ease-in`;
      tile.style.transform = 'rotateX(90deg)';
      setTimeout(() => {
        tile.className = `tile ${state}`;
        tile.style.transition = `transform ${FLIP_MS / 2}ms ease-out`;
        tile.style.transform = 'rotateX(0)';
      }, FLIP_MS / 2);
    }, c * FLIP_STAGGER);
  });
  setTimeout(() => {
    animating = false;
    done && done();
  }, WORD_LEN * FLIP_STAGGER + FLIP_MS);
}

// ── 키보드 ────────────────────────────────────────
const KB_ROWS = [
  ['⇧', 'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['입력', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', '⌫'],
];
const SHIFT_MAP = { 'ㅂ': 'ㅃ', 'ㅈ': 'ㅉ', 'ㄷ': 'ㄸ', 'ㄱ': 'ㄲ', 'ㅅ': 'ㅆ', 'ㅐ': 'ㅒ', 'ㅔ': 'ㅖ' };

function buildKeyboard() {
  $keyboard.innerHTML = '';
  for (const rowKeys of KB_ROWS) {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    for (const key of rowKeys) {
      const btn = document.createElement('button');
      btn.className = 'key';
      btn.textContent = key;
      btn.dataset.key = key;
      if (key === '입력' || key === '⌫' || key === '⇧') btn.classList.add('wide');
      btn.addEventListener('click', () => handleKey(key));
      rowEl.appendChild(btn);
    }
    $keyboard.appendChild(rowEl);
  }
}

function renderKeyboard() {
  const states = keyboardStates(game);
  for (const btn of $keyboard.querySelectorAll('.key')) {
    const base = btn.dataset.key;
    if (base === '입력' || base === '⌫') continue;
    if (base === '⇧') {
      btn.classList.toggle('shift-on', shiftOn);
      continue;
    }
    const label = shiftOn && SHIFT_MAP[base] ? SHIFT_MAP[base] : base;
    btn.textContent = label;
    btn.classList.remove('correct', 'present', 'absent');
    if (states[label]) btn.classList.add(states[label]);
  }
}

function handleKey(key) {
  if (animating) return;
  if (key === '⇧') {
    shiftOn = !shiftOn;
    renderKeyboard();
    return;
  }
  if (key === '입력') return handleSubmit();
  if (key === '⌫') {
    removeJamo(game);
    renderRows();
    return;
  }
  const jamo = shiftOn && SHIFT_MAP[key] ? SHIFT_MAP[key] : key;
  if (addJamo(game, jamo).ok) {
    if (shiftOn) { shiftOn = false; renderKeyboard(); }
    renderRows();
  }
}

function handleSubmit() {
  const rowIdx = game.rows.length;
  const res = submitGuess(game);
  if (!res.ok) {
    if (res.reason === 'short') toast('낱자 6개를 입력하세요');
    else if (res.reason === 'invalid') toast('만들 수 없는 단어예요');
    shakeRow(rowIdx);
    return;
  }
  renderRows({ animateLast: true });
  animateReveal(rowIdx, res.row.result, () => {
    renderKeyboard();
    renderPreview();
    saveGameState(game);
    if (game.status === 'won') {
      toast(WIN_MESSAGES[game.rows.length - 1]);
      danceRow(rowIdx);
      throwConfetti();
      finishGame(true);
    } else if (game.status === 'lost') {
      toast(`정답: ${composeWord(game.answer)}`, 3000);
      finishGame(false);
    }
  });
  saveGameState(game);
}

/** 승리 행 웨이브 댄스 */
function danceRow(rowIdx) {
  const rowEl = $board.children[rowIdx];
  [...rowEl.children].forEach((tile, i) => {
    setTimeout(() => tile.classList.add('dance'), i * 90);
  });
}

function finishGame(won) {
  recordResult(game.puzzleNum, won, game.rows.length);
  setTimeout(() => openStats(), 1600);
}

function shakeRow(rowIdx) {
  const rowEl = $board.children[rowIdx];
  if (!rowEl) return;
  rowEl.classList.add('shake');
  setTimeout(() => rowEl.classList.remove('shake'), 550);
}

/** 승리 컨페티 — DOM 파티클, 라이브러리 없음 */
function throwConfetti() {
  const colors = ['#43a047', '#d4a72c', '#4d9be6', '#e6564d', '#9b59d0'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    const size = 5 + Math.random() * 6;
    p.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `width:${size}px`,
      `height:${size * (0.6 + Math.random())}px`,
      `background:${colors[i % colors.length]}`,
      `animation-duration:${1.6 + Math.random() * 1.6}s`,
      `animation-delay:${Math.random() * 0.5}s`,
    ].join(';');
    frag.appendChild(p);
  }
  document.body.appendChild(frag);
  setTimeout(() => document.querySelectorAll('.confetti').forEach((p) => p.remove()), 4200);
}

// ── 물리 키보드 (두벌식) ──────────────────────────
const DUBEOL = {
  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
  Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ',
};
const ALL_JAMO = new Set([
  ...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ',
  ...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣ',
]);

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!document.getElementById('modal-help').classList.contains('hidden')) return;
  if (!document.getElementById('modal-stats').classList.contains('hidden')) return;
  if (e.key === 'Enter') return handleKey('입력');
  if (e.key === 'Backspace') return handleKey('⌫');
  if (DUBEOL[e.key]) {
    if (addJamo(game, DUBEOL[e.key]).ok) renderRows();
    return;
  }
  // 한글 IME가 자모를 직접 주는 경우
  if (ALL_JAMO.has(e.key)) {
    if (addJamo(game, e.key).ok) renderRows();
  }
});

// ── 토스트 ────────────────────────────────────────
function toast(msg, duration = 1400) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  $toastWrap.prepend(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  }, duration);
}

// ── 모달 공통 ─────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
for (const backdrop of document.querySelectorAll('.modal-backdrop')) {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop || e.target.closest('[data-close]')) {
      backdrop.classList.add('hidden');
    }
  });
}

// ── 게임 방법 모달 ────────────────────────────────
function buildHelpExamples() {
  const make = (id, word, states) => {
    const el = document.getElementById(id);
    el.innerHTML = '';
    wordToJamo(word).forEach((j, i) => {
      const t = document.createElement('div');
      t.className = `ex-tile ${states[i] || ''}`;
      t.textContent = j;
      el.appendChild(t);
    });
  };
  make('ex-row-1', '강물', ['correct', '', '', '', '', '']);
  make('ex-row-2', '손톱', ['', '', 'present', '', '', '']);
  make('ex-row-3', '과일', ['', '', '', '', 'absent', '']);
}
document.getElementById('btn-help').addEventListener('click', () => openModal('modal-help'));

// ── 통계 모달 ─────────────────────────────────────
let countdownTimer = null;
function openStats() {
  const s = loadStats();
  document.getElementById('st-played').textContent = s.played;
  document.getElementById('st-winrate').textContent = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  document.getElementById('st-streak').textContent = s.streak;
  document.getElementById('st-max').textContent = s.maxStreak;

  const $dist = document.getElementById('dist');
  $dist.innerHTML = '';
  const max = Math.max(1, ...s.dist);
  const lastTries = game.status === 'won' ? game.rows.length : -1;
  s.dist.forEach((n, i) => {
    const row = document.createElement('div');
    row.className = 'dist-row';
    row.innerHTML = `<span>${i + 1}</span>`;
    const track = document.createElement('div');
    track.className = 'dist-track';
    const bar = document.createElement('div');
    bar.className = 'dist-bar' + (i + 1 === lastTries ? ' best' : '');
    bar.style.width = '8%';
    bar.textContent = n;
    track.appendChild(bar);
    row.appendChild(track);
    $dist.appendChild(row);
    requestAnimationFrame(() => {
      bar.style.width = `${Math.max(8, (n / max) * 100)}%`;
    });
  });

  document.getElementById('btn-share').style.display = game.status === 'playing' ? 'none' : '';
  openModal('modal-stats');

  clearInterval(countdownTimer);
  const tick = () => {
    const ms = msUntilNextPuzzle();
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    document.getElementById('countdown').textContent = `${h}:${m}:${sec}`;
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}
document.getElementById('btn-stats').addEventListener('click', openStats);

// ── 공유 ──────────────────────────────────────────
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 폴백: 임시 textarea + execCommand (구형/권한 제한 환경)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

document.getElementById('btn-share').addEventListener('click', async () => {
  const text = shareText(game, { url: location.origin + location.pathname });
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // 사용자가 공유 취소
    }
  }
  toast((await copyText(text)) ? '결과가 복사되었어요 📋' : '복사에 실패했어요');
});

// ── 테마 토글 ─────────────────────────────────────
document.getElementById('btn-theme').addEventListener('click', () => {
  prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark';
  savePrefs(prefs);
  applyPrefs();
});

// ── 고대비(색약) 모드 ─────────────────────────────
const $contrast = document.getElementById('chk-contrast');
$contrast.checked = !!prefs.contrast;
$contrast.addEventListener('change', () => {
  prefs.contrast = $contrast.checked;
  savePrefs(prefs);
  applyPrefs();
});

// ── 초기화 ────────────────────────────────────────
{
  const kstNow = new Date(Date.now() + 9 * 3600000);
  document.getElementById('puzzle-caption').textContent =
    `#${today.num} · ${kstNow.getUTCMonth() + 1}월 ${kstNow.getUTCDate()}일`;
}
buildBoard();
$board.classList.add('enter');
setTimeout(() => $board.classList.remove('enter'), 800);
buildKeyboard();
buildHelpExamples();
renderRows();
renderKeyboard();

if (!prefs.seenHelp) {
  openModal('modal-help');
  prefs.seenHelp = true;
  savePrefs(prefs);
}
if (game.status !== 'playing') {
  renderPreview();
  setTimeout(() => openStats(), 400);
}
