// 게임 상태 머신 테스트
import { strict as assert } from 'node:assert';
import { wordToJamo } from '../js/hangul.js';
import {
  createGame, addJamo, removeJamo, submitGuess, keyboardStates, shareText, MAX_TRIES,
} from '../js/game.js';

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ok - ${name}`); }
  catch (e) { failed++; console.error(`  FAIL - ${name}\n    ${e.message}`); }
}

const ANSWER = wordToJamo('강물'); // ㄱㅏㅇㅁㅜㄹ

function typeWord(game, word) {
  for (const j of wordToJamo(word)) addJamo(game, j);
}

console.log('# 입력');
test('6자모 초과 입력 무시', () => {
  const g = createGame(ANSWER, 1);
  for (let i = 0; i < 8; i++) addJamo(g, 'ㄱ');
  assert.equal(g.current.length, 6);
});
test('백스페이스', () => {
  const g = createGame(ANSWER, 1);
  addJamo(g, 'ㄱ'); addJamo(g, 'ㅏ');
  removeJamo(g);
  assert.deepEqual(g.current, ['ㄱ']);
});

console.log('# 제출');
test('부족한 입력 → short', () => {
  const g = createGame(ANSWER, 1);
  addJamo(g, 'ㄱ');
  assert.equal(submitGuess(g).reason, 'short');
});
test('조합 불가 → invalid, 행 소비 안 함', () => {
  const g = createGame(ANSWER, 1);
  ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ'].forEach((j) => addJamo(g, j));
  const r = submitGuess(g);
  assert.equal(r.reason, 'invalid');
  assert.equal(g.rows.length, 0);
  assert.equal(g.current.length, 6); // 입력 유지 → 사용자가 수정 가능
});
test('정답 → won', () => {
  const g = createGame(ANSWER, 1);
  typeWord(g, '강물');
  const r = submitGuess(g);
  assert.equal(r.ok, true);
  assert.equal(g.status, 'won');
});
test('6회 실패 → lost', () => {
  const g = createGame(ANSWER, 1);
  for (let i = 0; i < MAX_TRIES; i++) {
    typeWord(g, '손톱');
    assert.equal(submitGuess(g).ok, true);
  }
  assert.equal(g.status, 'lost');
});
test('종료 후 입력 차단', () => {
  const g = createGame(ANSWER, 1);
  typeWord(g, '강물');
  submitGuess(g);
  assert.equal(addJamo(g, 'ㄱ').ok, false);
});

console.log('# 키보드 상태');
test('correct가 present보다 우선', () => {
  const g = createGame(ANSWER, 1);
  typeWord(g, '물감'); // ㅁㅜㄹㄱㅏㅁ — 전부 위치 불일치(present) 예상
  submitGuess(g);
  typeWord(g, '강물'); // 전부 correct
  submitGuess(g);
  const ks = keyboardStates(g);
  assert.equal(ks['ㄱ'], 'correct');
  assert.equal(ks['ㅁ'], 'correct');
});

console.log('# 공유 텍스트');
test('승리 공유 형식', () => {
  const g = createGame(ANSWER, 42);
  typeWord(g, '강물');
  submitGuess(g);
  const t = shareText(g, { url: 'https://example.com' });
  assert.ok(t.startsWith('꼬들 #42 1/6'));
  assert.ok(t.includes('🟩🟩🟩🟩🟩🟩'));
  assert.ok(t.includes('https://example.com'));
});
test('패배 공유는 X/6', () => {
  const g = createGame(ANSWER, 7);
  for (let i = 0; i < MAX_TRIES; i++) { typeWord(g, '손톱'); submitGuess(g); }
  assert.ok(shareText(g).startsWith('꼬들 #7 X/6'));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
