// 단어 리스트 전수 검증: 모든 정답 후보는 (1) 두 글자 (2) 정확히 6자모 (3) 재조합 가능해야 함
import { strict as assert } from 'node:assert';
import { wordToJamo, composeWord } from '../js/hangul.js';
import { getAnswerWords, getPuzzleNumber, getAnswerForPuzzle, msUntilNextPuzzle } from '../js/words.js';

let failed = 0;
const words = getAnswerWords();

console.log(`# 단어 검증 (${words.length}개)`);
const bad = [];
for (const w of words) {
  if (w.length !== 2) { bad.push(`${w}: 두 글자 아님`); continue; }
  let jamo;
  try { jamo = wordToJamo(w); } catch (e) { bad.push(`${w}: 분해 불가`); continue; }
  if (jamo.length !== 6) { bad.push(`${w}: ${jamo.length}자모 (${jamo.join('')})`); continue; }
  const recomposed = composeWord(jamo);
  if (recomposed !== w) { bad.push(`${w}: 재조합 실패 → ${recomposed}`); }
}
if (bad.length) {
  failed++;
  console.error(`  FAIL - 부적합 단어 ${bad.length}개:`);
  bad.forEach((b) => console.error(`    ${b}`));
} else {
  console.log(`  ok - 전체 ${words.length}개 단어 6자모·재조합 검증 통과`);
}

// 중복 검사
const dup = words.filter((w, i) => words.indexOf(w) !== i);
if (dup.length) { failed++; console.error(`  FAIL - 중복: ${dup.join(', ')}`); }
else console.log('  ok - 중복 없음');

console.log('# 퍼즐 번호/정답 결정성');
{
  // 2026-07-10 12:00 KST → 퍼즐 #1
  const t1 = Date.UTC(2026, 6, 10, 3, 0, 0);
  assert.equal(getPuzzleNumber(t1), 1);
  // 2026-07-11 00:00:01 KST → 퍼즐 #2
  const t2 = Date.UTC(2026, 6, 10, 15, 0, 1);
  assert.equal(getPuzzleNumber(t2), 2);
  console.log('  ok - KST 자정 경계 퍼즐 번호');

  // 같은 번호는 항상 같은 정답
  assert.equal(getAnswerForPuzzle(5), getAnswerForPuzzle(5));
  // 연속 퍼즐이 같은 단어면 셔플 문제
  const seen = new Set();
  for (let n = 1; n <= words.length; n++) seen.add(getAnswerForPuzzle(n));
  assert.equal(seen.size, words.length, `셔플 주기 내 전 단어 등장해야 함 (${seen.size}/${words.length})`);
  console.log('  ok - 셔플이 전 단어를 순회');

  const ms = msUntilNextPuzzle(t1);
  assert.ok(ms > 0 && ms <= 86400000);
  console.log('  ok - 다음 퍼즐 카운트다운 범위');
}

if (failed > 0) { console.error(`\n${failed} FAILED`); process.exit(1); }
console.log('\nall passed');
