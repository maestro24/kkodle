// 자모 분해/조합/판정 단위 테스트 — node tests/hangul.test.mjs 로 실행
import { strict as assert } from 'node:assert';
import {
  decomposeSyllable,
  wordToJamo,
  composeWord,
  evaluateGuess,
  isConsonant,
  isVowel,
} from '../js/hangul.js';

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL - ${name}\n    ${e.message}`);
  }
}

console.log('# decomposeSyllable');
test('단순 CVC: 강 → ㄱㅏㅇ', () => {
  assert.deepEqual(decomposeSyllable('강'), ['ㄱ', 'ㅏ', 'ㅇ']);
});
test('CV: 가 → ㄱㅏ', () => {
  assert.deepEqual(decomposeSyllable('가'), ['ㄱ', 'ㅏ']);
});
test('복합모음 분리: 과 → ㄱㅗㅏ', () => {
  assert.deepEqual(decomposeSyllable('과'), ['ㄱ', 'ㅗ', 'ㅏ']);
});
test('복합모음 ㅢ: 의 → ㅇㅡㅣ', () => {
  assert.deepEqual(decomposeSyllable('의'), ['ㅇ', 'ㅡ', 'ㅣ']);
});
test('겹받침 분리: 닭 → ㄷㅏㄹㄱ', () => {
  assert.deepEqual(decomposeSyllable('닭'), ['ㄷ', 'ㅏ', 'ㄹ', 'ㄱ']);
});
test('쌍자음 초성 유지: 꽃 → ㄲㅗㅊ', () => {
  assert.deepEqual(decomposeSyllable('꽃'), ['ㄲ', 'ㅗ', 'ㅊ']);
});
test('쌍자음 종성 유지: 볶 → ㅂㅗㄲ', () => {
  assert.deepEqual(decomposeSyllable('볶'), ['ㅂ', 'ㅗ', 'ㄲ']);
});
test('복합모음+받침: 왕 → ㅇㅗㅏㅇ', () => {
  assert.deepEqual(decomposeSyllable('왕'), ['ㅇ', 'ㅗ', 'ㅏ', 'ㅇ']);
});

console.log('# wordToJamo');
test('강물 → 6자모', () => {
  assert.deepEqual(wordToJamo('강물'), ['ㄱ', 'ㅏ', 'ㅇ', 'ㅁ', 'ㅜ', 'ㄹ']);
});
test('과일 → 6자모', () => {
  assert.deepEqual(wordToJamo('과일'), ['ㄱ', 'ㅗ', 'ㅏ', 'ㅇ', 'ㅣ', 'ㄹ']);
});
test('여왕 → 6자모', () => {
  assert.deepEqual(wordToJamo('여왕'), ['ㅇ', 'ㅕ', 'ㅇ', 'ㅗ', 'ㅏ', 'ㅇ']);
});

console.log('# composeWord (6자모 → 2음절)');
test('ㄱㅏㅇㅁㅜㄹ → 강물', () => {
  assert.equal(composeWord(['ㄱ', 'ㅏ', 'ㅇ', 'ㅁ', 'ㅜ', 'ㄹ']), '강물');
});
test('ㄱㅗㅏㅇㅣㄹ → 과일', () => {
  assert.equal(composeWord(['ㄱ', 'ㅗ', 'ㅏ', 'ㅇ', 'ㅣ', 'ㄹ']), '과일');
});
test('ㅇㅕㅇㅗㅏㅇ → 여왕', () => {
  assert.equal(composeWord(['ㅇ', 'ㅕ', 'ㅇ', 'ㅗ', 'ㅏ', 'ㅇ']), '여왕');
});
test('겹받침 조합: ㅇㅕㄷㅓㄹㅂ → 여덟', () => {
  assert.equal(composeWord(['ㅇ', 'ㅕ', 'ㄷ', 'ㅓ', 'ㄹ', 'ㅂ']), '여덟');
});
test('조합 불가 (모음 시작) → null', () => {
  assert.equal(composeWord(['ㅏ', 'ㄱ', 'ㅏ', 'ㅇ', 'ㅁ', 'ㅜ']), null);
});
test('조합 불가 (자음만) → null', () => {
  assert.equal(composeWord(['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ']), null);
});
test('조합 불가 (모음 3연속) → null', () => {
  assert.equal(composeWord(['ㄱ', 'ㅏ', 'ㅏ', 'ㅏ', 'ㅁ', 'ㅜ']), null);
});
test('유효하지 않은 복합모음 ㅏ+ㅗ → null', () => {
  assert.equal(composeWord(['ㄱ', 'ㅏ', 'ㅗ', 'ㅁ', 'ㅜ', 'ㄹ']), null);
});

console.log('# evaluateGuess');
test('전부 정답', () => {
  const a = wordToJamo('강물');
  assert.deepEqual(evaluateGuess(a, a), ['correct', 'correct', 'correct', 'correct', 'correct', 'correct']);
});
test('전부 오답', () => {
  const guess = wordToJamo('첫해'); // ㅊㅓㅅㅎㅐ — 5자모라 안됨. 직접 배열로.
  assert.deepEqual(
    evaluateGuess(['ㅊ', 'ㅔ', 'ㅅ', 'ㅎ', 'ㅐ', 'ㅍ'], wordToJamo('강물')),
    ['absent', 'absent', 'absent', 'absent', 'absent', 'absent']
  );
});
test('위치 다른 포함(present) + 중복 소진', () => {
  // 정답 강물(ㄱㅏㅇㅁㅜㄹ)에 ㅁ 1개, 추측 물감(ㅁㅜㄹㄱㅏㅁ)에 ㅁ 2개
  // → 앞의 ㅁ만 present, 마지막 ㅁ은 absent
  const result = evaluateGuess(wordToJamo('물감'), wordToJamo('강물'));
  assert.deepEqual(result, ['present', 'present', 'present', 'present', 'present', 'absent']);
});
test('중복 자모 처리: 정답에 1개뿐이면 present 1개만', () => {
  // 정답: ㄱㅏㅇㅁㅜㄹ (ㅏ 1개), 추측: ㅏ가 2번 위치 모두 오답 자리에
  const result = evaluateGuess(['ㅅ', 'ㅏ', 'ㄴ', 'ㅂ', 'ㅏ', 'ㅁ'], wordToJamo('강물'));
  // 첫 ㅏ는 정답 위치(index1) → correct, 둘째 ㅏ는 absent (정답에 ㅏ 1개)
  assert.equal(result[1], 'correct');
  assert.equal(result[4], 'absent');
});
test('correct 우선 소진 후 present 판정', () => {
  // 정답: ㄱㅏㅇㄱㅏㅇ 형태 가정 (강강 아님, 테스트용 배열)
  const answer = ['ㄱ', 'ㅏ', 'ㅇ', 'ㄱ', 'ㅏ', 'ㅇ'];
  const guess = ['ㄱ', 'ㄱ', 'ㄱ', 'ㄱ', 'ㅏ', 'ㅏ'];
  const r = evaluateGuess(guess, answer);
  assert.equal(r[0], 'correct'); // 위치 일치
  assert.equal(r[3], 'correct'); // 위치 일치
  // 남은 ㄱ 없음 → index1,2는 absent
  assert.equal(r[1], 'absent');
  assert.equal(r[2], 'absent');
});

console.log('# isConsonant / isVowel');
test('ㄱ은 자음, ㅏ는 모음', () => {
  assert.equal(isConsonant('ㄱ'), true);
  assert.equal(isVowel('ㅏ'), true);
  assert.equal(isConsonant('ㅏ'), false);
  assert.equal(isVowel('ㄱ'), false);
});
test('쌍자음도 자음', () => {
  assert.equal(isConsonant('ㄲ'), true);
  assert.equal(isConsonant('ㅆ'), true);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
