# 꼬들 SEO/GEO 최적화 보고서

> 2026-07-10 적용 완료. 기준: Google AI Optimization Guide — "GEO는 결국 SEO 기본기".

## 적용 내역

### 기술 SEO
| 항목 | 상태 | 구현 |
|------|------|------|
| title/description | ✅ | 키워드("한글 워들") 포함, 페이지별 고유 |
| canonical | ✅ | index, archive 각각 |
| OG/Twitter 카드 | ✅ | og-image.png 1200×630 자체 생성 |
| theme-color | ✅ | 라이트/다크 미디어쿼리 분리 |
| robots.txt | ✅ | 전체 허용 + AI 크롤러(GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) 명시 허용 |
| sitemap.xml | ✅ | 2 URL, robots.txt에서 참조 |
| manifest | ✅ | PWA 설치 지원 (아이콘 192/512) |
| 페이지 속도 | ✅ | 총 ~60KB, 외부 요청 0, 프레임워크 0 → LCP/CLS 우수 |

### 구조화 데이터 (JSON-LD)
- `WebSite` + `WebApplication`(GameApplication, 무료 Offer, datePublished) + `FAQPage`(4문항) — index
- `BreadcrumbList` — archive
- 브라우저에서 파싱 검증 완료

### GEO (AI 검색 대응)
핵심 근거: **AI 크롤러는 JS를 실행하지 않는다** → 게임 UI(JS 렌더)만으로는 AI에 인용 불가.

| 항목 | 구현 |
|------|------|
| 정적 크롤러블 콘텐츠 | index.html에 순수 HTML 섹션 추가 — "꼬들이란?" 정의가 첫 60단어 내 등장, 자기완결형 답변 블록(~130단어) |
| 질문형 헤딩 | "어떻게 플레이하나요?", "자주 묻는 질문" (H2) |
| FAQ Q&A | `<dl>` 마크업 + FAQPage 스키마 동기화 |
| llms.txt | 게임 규칙·가격·페이지 목록 구조화 (인용 가중치 낮음을 인지하되 비용 0이라 적용) |
| noscript | JS 꺼진 환경 설명문 |

## 남은 항목 (배포 후)

1. **도메인 치환** — `maestro24.github.io/kkodle` 플레이스홀더 → 실제 URL (README에 일괄 치환 명령 있음)
2. Google Search Console 등록 + sitemap 제출, Bing 웹마스터(IndexNow) 등록
3. **브랜드 멘션 구축** — Ahrefs 연구: AI 인용은 백링크보다 멘션 상관 3배. 커뮤니티 시딩(에브리타임·디시·트위터)이 SEO 겸 GEO
4. 아카이브 회차별 개별 페이지화("꼬들 N번째 정답" 롱테일) — 문제 수 쌓인 후 검토
5. 콘텐츠 신선도 — AI 인용은 3개월 내 콘텐츠 선호. 시즌 단어 이벤트 등으로 페이지 갱신 유지
