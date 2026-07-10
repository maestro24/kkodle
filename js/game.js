// 게임 상태 머신 — DOM 없음, 순수 로직 (테스트 가능)
import { composeWord, evaluateGuess } from './hangul.js';

export const MAX_TRIES = 6;
export const WORD_LEN = 6;

export function createGame(answerJamo, puzzleNum) {
  return {
    puzzleNum,
    answer: answerJamo,
    rows: [],        // [{ jamos: [...], result: [...], word }]
    current: [],     // 입력 중인 자모
    status: 'playing', // playing | won | lost
  };
}

export function addJamo(game, jamo) {
  if (game.status !== 'playing') return { ok: false };
  if (game.current.length >= WORD_LEN) return { ok: false };
  game.current.push(jamo);
  return { ok: true };
}

export function removeJamo(game) {
  if (game.status !== 'playing') return { ok: false };
  if (game.current.length === 0) return { ok: false };
  game.current.pop();
  return { ok: true };
}

/** 제출. 실패 사유: short | invalid. 성공 시 row 반환 */
export function submitGuess(game) {
  if (game.status !== 'playing') return { ok: false, reason: 'done' };
  if (game.current.length < WORD_LEN) return { ok: false, reason: 'short' };
  const word = composeWord(game.current);
  if (!word) return { ok: false, reason: 'invalid' };
  const result = evaluateGuess(game.current, game.answer);
  const row = { jamos: [...game.current], result, word };
  game.rows.push(row);
  game.current = [];
  if (result.every((r) => r === 'correct')) game.status = 'won';
  else if (game.rows.length >= MAX_TRIES) game.status = 'lost';
  return { ok: true, row, status: game.status };
}

/** 키보드 색상 맵: jamo → correct > present > absent 우선순위 병합 */
export function keyboardStates(game) {
  const rank = { absent: 0, present: 1, correct: 2 };
  const map = {};
  for (const row of game.rows) {
    row.jamos.forEach((j, i) => {
      const s = row.result[i];
      if (!(j in map) || rank[s] > rank[map[j]]) map[j] = s;
    });
  }
  return map;
}

/** 공유 텍스트 생성 */
export function shareText(game, { url = '' } = {}) {
  const tries = game.status === 'won' ? String(game.rows.length) : 'X';
  const emoji = { correct: '🟩', present: '🟨', absent: '⬛' };
  const grid = game.rows.map((r) => r.result.map((s) => emoji[s]).join('')).join('\n');
  return `꼬들 #${game.puzzleNum} ${tries}/${MAX_TRIES}\n\n${grid}${url ? `\n\n${url}` : ''}`;
}
