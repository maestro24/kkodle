// 한글 자모 분해·조합·판정 코어 로직 (의존성 없음, 브라우저/Node 겸용)

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 복합모음 → 기본모음 2개
const VOWEL_SPLIT = {
  'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ'],
};
// 겹받침 → 자음 2개
const JONG_SPLIT = {
  'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
};
// 역방향 조합 맵
const VOWEL_JOIN = Object.fromEntries(
  Object.entries(VOWEL_SPLIT).map(([k, [a, b]]) => [a + b, k])
);
const JONG_JOIN = Object.fromEntries(
  Object.entries(JONG_SPLIT).map(([k, [a, b]]) => [a + b, k])
);

// 게임 키보드에서 쓰는 기본 자모 집합
const BASIC_CONSONANTS = new Set(CHO); // 쌍자음 포함 19개
const BASIC_VOWELS = new Set(['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']);

export function isConsonant(j) { return BASIC_CONSONANTS.has(j); }
export function isVowel(j) { return BASIC_VOWELS.has(j); }

const HANGUL_BASE = 0xac00;

/** 음절 1자 → 기본 자모 배열 (복합모음·겹받침 분리) */
export function decomposeSyllable(ch) {
  const code = ch.codePointAt(0) - HANGUL_BASE;
  if (code < 0 || code > 11171) throw new Error(`한글 음절 아님: ${ch}`);
  const cho = CHO[Math.floor(code / 588)];
  const jung = JUNG[Math.floor((code % 588) / 28)];
  const jong = JONG[code % 28];
  const out = [cho];
  out.push(...(VOWEL_SPLIT[jung] || [jung]));
  if (jong) out.push(...(JONG_SPLIT[jong] || [jong]));
  return out;
}

/** 단어 → 기본 자모 배열 */
export function wordToJamo(word) {
  return [...word].flatMap(decomposeSyllable);
}

/** 자모 부분열 1개 → 음절 1자 (불가하면 null) */
function composeSyllable(part) {
  if (part.length < 2 || part.length > 5) return null;
  let i = 0;
  const cho = part[i++];
  if (!isConsonant(cho)) return null;
  if (!isVowel(part[i])) return null;
  let jung = part[i++];
  if (i < part.length && isVowel(part[i])) {
    const joined = VOWEL_JOIN[jung + part[i]];
    if (!joined) return null;
    jung = joined;
    i++;
  }
  let jong = '';
  if (i < part.length) {
    if (!isConsonant(part[i])) return null;
    jong = part[i++];
    if (i < part.length) {
      if (!isConsonant(part[i])) return null;
      const joined = JONG_JOIN[jong + part[i]];
      if (!joined) return null;
      jong = joined;
      i++;
    }
  }
  if (i !== part.length) return null;
  const choIdx = CHO.indexOf(cho);
  const jungIdx = JUNG.indexOf(jung);
  const jongIdx = JONG.indexOf(jong);
  if (choIdx < 0 || jungIdx < 0 || jongIdx < 0) return null;
  // 종성 자리에 못 오는 자음(ㄸㅃㅉ) 방어
  if (jong && jongIdx < 0) return null;
  return String.fromCodePoint(HANGUL_BASE + choIdx * 588 + jungIdx * 28 + jongIdx);
}

/** 6자모 → 2음절 단어 (구조상 불가하면 null) */
export function composeWord(jamos) {
  if (jamos.length !== 6) return null;
  for (let split = 2; split <= 4; split++) {
    const first = composeSyllable(jamos.slice(0, split));
    if (!first) continue;
    const second = composeSyllable(jamos.slice(split));
    if (second) return first + second;
  }
  return null;
}

/** 워들 판정: 2-pass (correct 먼저 소진 → present/absent) */
export function evaluateGuess(guess, answer) {
  const n = answer.length;
  const result = new Array(n).fill('absent');
  const remaining = {};
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
    } else {
      remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === 'correct') continue;
    if (remaining[guess[i]] > 0) {
      result[i] = 'present';
      remaining[guess[i]]--;
    }
  }
  return result;
}
