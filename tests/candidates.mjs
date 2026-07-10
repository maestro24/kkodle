// 신규 단어 후보 필터 — 6자모 & 재조합 검증 & 기존 리스트 중복 제거
import { wordToJamo, composeWord } from '../js/hangul.js';
import { getAnswerWords } from '../js/words.js';

const CANDIDATES = `
몸통 손등 발등 발끝 손끝 콧등 눈썹 입술 입김 손님 몸짓 손짓 발짓 눈짓 뱃살 팔뚝 팔목
갈증 심술 몸집 살결 숨결 물결 반찬 젓갈 국물 전골 곰탕 족발 꿀떡 찰떡 식빵 단팥 밥솥
컵밥 덮밥 쌀밥 잡곡 찹쌀 멥쌀 무침 조림 백숙 목살 앞발 강산 산속 물속 땅속 숲속 절벽
협곡 샘물 냇물 빗물 산골 들길 철새 텃새 벌집 등불 촛불 장작 숯불 눈발 빗발 화산 용암
암석 넝쿨 덩굴 새싹 꽃잎 곶감 참외 은행 밤톨 황소 수달 박쥐 황새 전복 홍합 거북 전갈
황태 볼펜 철봉 볼링 등산 권투 육상 걸상 평상 온돌 장판 달력 액자 선반 세탁 칼날 못질
톱질 삽질 멍석 뚜껑 남방 털옷 솜옷 장화 샌들 헬멧 옷깃 밑단 칠판 분필 급식 복습 채점
반장 회장 과장 사원 신입 경력 면접 출근 퇴근 특근 출장 회식 월차 명절 주말 평일 새벽
낮잠 밤잠 늦잠 단잠 꿀잠 선잠 쪽잠 꿈속 악몽 길몽 첫눈 첫날 끝말 끝장 결말 결과 변명
험담 칭찬 축하 존경 함성 탄식 한탄 설움 슬픔 통증 약방 진찰 독감 복통 골절 화상 동상
백신 면역 건강 체력 근육 영양 식단 과식 폭식 간식 공복 식욕 입맛 손맛 물맛 밥맛 꿀맛
단맛 쓴맛 신맛 짠맛 열차 전철 트럭 화물 선박 함선 군함 항공 공항 터널 찻길 뱃길 철길
쪽문 창살 담장 난간 콧김 목청 목젖 잇몸 송곳 부품 설비 건설 강철 백금 보석 식칼 화덕
굴뚝 앞뜰 뒤뜰 텃밭 논밭 상인 군인 훈련 전쟁 항복 평화 평등 법률 죄인 감옥 형벌 벌금
살인 목격 범인 경찰 탐정 간첩 총알 화약 폭탄 갑옷 칼집 겁쟁 목표 언덕 정상 절정 정점
막상 막판 초반 중반 종반 전반 후반 상반 하반 접시 접견 결승 준결 예선 본선 결선 필승
연승 연패 완승 완패 역전 득점 실점 만루 안타 홈런 병살 도루 출루 타율 볼넷 삼진 선발
불펜 마무 등판 강판 완투 완봉 노히 퍼펙 필드 코트 링크 트랙 레인 바통 계주 릴레 왕복
편도 직진 좌회 우회 유턴 후진 주차 정차 발차 급발 급정 과속 감속 신용 현찰 잔돈 거스
용돈 세뱃 상금 벌점 감점 만점 백점 영점 학점 학번 학년 학기 개강 종강 방학 개학 중간
기말 논술 실기 필기 면허 자격 급수 단수 진급 승진 발령 전근 사표 해고 정년 은퇴 연금
보험 적금 예금 출금 입금 송금 이자 원금 대출 상환 연체 담보 보증 계약 해지 갱신 약정
`.trim().split(/\s+/);

const existing = new Set(getAnswerWords());
const valid = [];
const invalid = [];
const dup = [];

for (const w of CANDIDATES) {
  if (w.length !== 2) { invalid.push(`${w}(길이)`); continue; }
  if (existing.has(w)) { dup.push(w); continue; }
  let jamo;
  try { jamo = wordToJamo(w); } catch { invalid.push(`${w}(분해불가)`); continue; }
  if (jamo.length !== 6) { invalid.push(`${w}(${jamo.length})`); continue; }
  if (composeWord(jamo) !== w) { invalid.push(`${w}(재조합)`); continue; }
  if (valid.includes(w)) continue;
  valid.push(w);
}

console.log(`후보 ${CANDIDATES.length} | 통과 ${valid.length} | 기존중복 ${dup.length} | 탈락 ${invalid.length}`);
console.log('\n=== 통과 (기존 188 + 신규) ===');
for (let i = 0; i < valid.length; i += 10) {
  console.log("  '" + valid.slice(i, i + 10).join("', '") + "',");
}
console.log('\n=== 탈락 ===');
console.log(invalid.join(' '));
console.log('\n=== 중복 ===');
console.log(dup.join(' '));
