# 꼬들 (KKODLE) — 매일 한 판, 한글 단어 퍼즐

여섯 번의 기회로 오늘의 두 글자 단어(자모 6칸)를 맞히는 한글 워들 게임.
**순수 정적 사이트** — 서버·빌드 도구·외부 API 없음. 총 용량 ~48KB.

## 실행

```bash
# 아무 정적 서버로 실행 (ES 모듈이라 file:// 직접 열기는 불가)
python -m http.server 8000
# → http://localhost:8000
```

## 테스트

```bash
node tests/hangul.test.mjs   # 자모 분해·조합·판정 (26 tests)
node tests/words.test.mjs    # 단어 리스트 전수 검증 + 퍼즐 결정성
node tests/game.test.mjs     # 게임 상태 머신 (10 tests)
```

## 배포

**GitHub Pages**: 저장소 푸시 → Settings → Pages → 브랜치 선택. 끝.
**Vercel**: `vercel` 명령 또는 저장소 연결. 프레임워크 프리셋 "Other", 빌드 명령 없음, 출력 디렉토리 `./`.

**운영 URL**: https://maestro24.github.io/kkodle/

> 커스텀 도메인으로 이전할 경우 SEO 파일의 URL 일괄 치환:
> ```bash
> grep -rl "maestro24.github.io/kkodle" --include="*.html" --include="*.txt" --include="*.xml" . | xargs sed -i 's|maestro24.github.io/kkodle|새도메인|g'
> ```
> 배포 후 할 일: Google Search Console 등록 → sitemap.xml 제출.

## 구조

```
index.html      게임 본체
archive.html    지난 문제 정답 아카이브
css/style.css   테마(다크/라이트/고대비) + 애니메이션
js/hangul.js    자모 분해·조합·워들 판정 (순수 함수)
js/words.js     정답 단어 188개 + KST 자정 기준 퍼즐 선택
js/game.js      게임 상태 머신 (DOM 없음)
js/storage.js   localStorage 영속화 (진행·통계·설정)
js/main.js      UI 렌더링·입력·모달·공유
tests/          Node 단위 테스트 (의존성 0)
docs/PLAN.md    기획서
```

## 게임 규칙

- 정답은 자모 분해 시 정확히 6낱자인 두 글자 명사 (예: 강물 = ㄱㅏㅇㅁㅜㄹ, 과일 = ㄱㅗㅏㅇㅣㄹ)
- 복합모음(ㅘ→ㅗ+ㅏ)·겹받침(ㄼ→ㄹ+ㅂ)은 기본 낱자로 분리, 쌍자음(ㄲㄸㅃㅆㅉ)은 한 낱자
- 매일 자정(KST) 새 문제, 전 세계 동일
- 입력: 화상 키보드(⇧로 쌍자음/ㅒㅖ) + 물리 키보드(두벌식)

## 기능

- 6×6 보드, 타일 뒤집기·팝·셰이크·승리 댄스·컨페티 애니메이션
- 통계(플레이·승률·연속·분포) + 이모지 결과 공유 (Web Share / 클립보드)
- 진행 상태 자동 저장·복원, 다크/라이트 테마, 고대비(색약) 모드
- 지난 문제 아카이브 페이지
