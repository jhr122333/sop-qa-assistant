# SOP Q&A Assistant — v1 → v2 변경 로그

> 작성일: 2026-03-20 | 기준 브랜치: `main`

---

## 변경 개요

| 구분 | v1 | v2 |
|------|----|----|
| 피드백 수집 | 없음 | 👍/👎 + 사유 선택 + 자유 텍스트 |
| 피드백 저장 | 없음 | `feedback-log.json` + localStorage fallback |
| 대시보드 데이터 | Mock 고정 | 실데이터 기반 (fallback: demo JSON) |
| 만족도 차트 | 없음 | 도넛 / 라인 / 막대 3종 (Chart.js) |
| 질문 분석 | 없음 | Top 5 SOP / 유형 분류 / 커버리지 히트맵 |
| 피드백 리뷰 큐 | chat-log 기반 Mock | 실 부정 피드백 + 검토 완료 체크 |
| 서비스 문서 | PRD, 아키텍처 문서 | 서비스 기획서 + 변경 로그 추가 |

---

## 상세 변경 항목

---

### [변경 1] 챗봇 UI — 피드백 버튼 추가

**변경 파일**: `sop-qa-demo.html`

**변경 내용**
- AI 답변 스트리밍 완료 후 답변 버블 하단에 피드백 UI 자동 표시
- 👍 (도움됨): 클릭 즉시 `positive` 피드백 제출 → 완료 메시지
- 👎 (개선필요): 클릭 시 사유 선택지 확장
  - 사유: `부정확한 답변` / `정보 부족` / `출처 불일치` / `기타`
  - `기타` 선택 시 자유 텍스트 입력 필드 표시
  - 제출 후 "✅ 피드백이 반영되었습니다. 감사합니다." 메시지

**변경 근거**
- v1 QA 테스트 중 답변 품질 저하를 외부에서 감지할 수단이 없음을 확인
- 사용자 만족도를 정량화해야 "기획 → 개발 → 피드백 → 개선" 사이클이 완성됨

**기대 효과**
- 답변 품질 저하를 조기 감지 가능
- 사용자 불만 사유를 구조화된 데이터로 수집

---

### [변경 2] 챗봇 UI — 피드백 CSS 스타일

**변경 파일**: `sop-qa-demo.html`

**변경 내용**
- `.feedback-wrap`, `.feedback-bar`, `.feedback-btn`, `.feedback-reasons`
- `.feedback-reason-btn`, `.feedback-comment`, `.feedback-submit-btn`, `.feedback-done`
- 기존 챗봇 색상(파란 계열)과 통일감 유지, 긍정(초록)/부정(빨강) 색상 구분

**변경 근거**
- 기존 UI 톤과 충돌 없이 자연스럽게 피드백 UI를 삽입하기 위함
- 답변 읽기를 방해하지 않도록 버블 하단 분리선(border-top) 아래 배치

**기대 효과**
- 사용자 피드백 참여율 향상 (눈에 띄되 부담 없는 위치)

---

### [변경 3] 챗봇 JS — `buildFeedbackEl` / `submitFeedback` 함수 추가

**변경 파일**: `sop-qa-demo.html`

**변경 내용**
```javascript
// 피드백 UI 요소 생성
function buildFeedbackEl(question, answerObj) { ... }

// 피드백 서버 제출 + localStorage fallback
async function submitFeedback(data) {
  // 1. POST /api/feedback 시도
  // 2. 실패 시 localStorage 'sop-feedback-log' 저장
}
```
- `appendAssistantMsg(answerObj, question)` — `question` 파라미터 추가
- 스트리밍 완료 콜백에서 `buildFeedbackEl` 호출

**변경 근거**
- GitHub Pages 정적 배포 시에도 피드백이 유실되지 않도록 localStorage fallback 필수
- 추후 서버가 없는 데모 환경에서도 피드백 데이터 보존

**기대 효과**
- 로컬 서버 / GitHub Pages 모두에서 피드백 저장 가능

---

### [변경 4] 서버 — `POST /api/feedback` 엔드포인트 추가

**변경 파일**: `server.mjs`

**변경 내용**
```javascript
// 피드백 저장 경로
const FEEDBACK_LOG_PATH = 'data/runtime/feedback-log.json';

// POST /api/feedback
async function handleFeedback(req, res) { ... }
```

저장 데이터 구조:
```json
{
  "id": "uuid-v4",
  "timestamp": "ISO 8601",
  "question": "사용자 질문 (최대 500자)",
  "answer": "AI 답변 요약 (앞 100자)",
  "referenced_sops": ["SOP-001"],
  "rating": "positive | negative",
  "negative_reason": "부정확한 답변 | 정보 부족 | 출처 불일치 | 기타 | null",
  "comment": "자유 텍스트 | null"
}
```

**변경 근거**
- 피드백 데이터를 서버에 영구 저장해야 대시보드에서 실데이터 분석 가능
- `uuid` 기반 ID로 개별 피드백 추적 및 리뷰 큐 상태 관리

**기대 효과**
- 피드백 데이터가 `feedback-log.json`에 누적 → 대시보드 실데이터 연동 기반 마련

---

### [변경 5] 서버 — `GET /api/feedback` 엔드포인트 추가

**변경 파일**: `server.mjs`

**변경 내용**
- `GET /api/feedback` → `feedback-log.json` 전체 반환
- `ensureFeedbackLogFile()` — 파일 없을 시 `{ entries: [] }` 자동 생성

**변경 근거**
- 관리자 대시보드에서 실시간 피드백 데이터를 조회하기 위함

**기대 효과**
- 대시보드가 실데이터 기반으로 작동 (Mock 의존도 제거)

---

### [변경 6] 관리자 대시보드 — 응답 만족도 섹션 추가

**변경 파일**: `admin-dashboard.html`

**변경 내용**
- **도넛 차트** (`chartSatisfaction`): 전체 긍정/부정 비율 + 긍정% 뱃지
- **라인 차트** (`chartSatisfactionTrend`): 최근 7일 일별 긍정 비율 추이
- **가로 막대 차트** (`chartNegativeReasons`): 불만족 사유 4종 분포

**변경 근거**
- v1 대시보드는 Mock 데이터 고정으로 실운영 가치가 없었음
- 만족도 추이를 시계열로 보여줘야 "언제 품질이 떨어졌는지" 파악 가능

**기대 효과**
- 관리자가 주간 만족도 변화를 파악하고 SOP 보완 우선순위 결정 가능

---

### [변경 7] 관리자 대시보드 — 질문 분석 섹션 추가

**변경 파일**: `admin-dashboard.html`

**변경 내용**
- **가로 막대 차트** (`chartTopSops`): 참조 빈도 기준 SOP Top 5
- **도넛 차트** (`chartQuestionTypes`): 질문 유형 6종 자동 분류
  - 분류 기준: 세척 절차 / 일탈 처리 / 문서 관리 / 장비 운영 / 교육 관련 / 기타
  - 키워드 패턴 매칭으로 자동 분류 (`classifyQuestion()`)
- **커버리지 히트맵** (`coverageHeatmap`): SOP 10종 참조 빈도 색상 강도 표시

**변경 근거**
- 어떤 SOP가 자주 질문되는지 파악해야 문서 품질 개선 우선순위를 잡을 수 있음
- 참조 0회 SOP는 "미탑재 또는 사용자 필요성 낮음"으로 해석 가능

**기대 효과**
- SOP 커버리지 편차 가시화 → 문서 추가/개선 의사결정 속도 향상

---

### [변경 8] 관리자 대시보드 — 피드백 리뷰 큐 추가

**변경 파일**: `admin-dashboard.html`

**변경 내용**
- 부정 피드백 최신순 카드 목록 표시 (질문, 답변 요약, 사유, 참조 SOP, 시간, 코멘트)
- "검토 완료" 체크박스 → `localStorage 'sop-reviewed-feedback'`에 상태 영구 저장
- 검토 완료된 항목은 시각적으로 페이드 처리 (opacity 0.45)

**변경 근거**
- v1 리뷰 큐는 chat-log 기반 Mock으로 실제 부정 피드백 내용 미반영
- 운영자가 부정 피드백을 직접 확인하고 처리 완료 표시를 해야 개선 루프가 완결됨

**기대 효과**
- 운영자의 피드백 처리 가시성 확보
- "미처리 건수 ≤ 3건" 유지 목표 달성 가능

---

### [변경 9] 데모 데이터 — `feedback-demo.json` 추가

**변경 파일**: `data/dashboard/feedback-demo.json` (신규)

**변경 내용**
- 28건의 샘플 피드백 데이터 (2026-03-14~20)
- 긍정 21건 (75%) / 부정 7건 (25%)
- SOP 8종 참조, 부정 사유 4종 포함, 자유 코멘트 3건

**변경 근거**
- GitHub Pages 정적 배포 시 서버 없이도 대시보드가 의미 있게 작동해야 함
- 데모 환경에서 투자자/이해관계자에게 차트와 리뷰 큐를 시연 가능해야 함

**기대 효과**
- 로컬 서버 없이도 전체 대시보드 기능 시연 가능

---

### [변경 10] 서비스 기획 문서화

**변경 파일**: `docs/service-planning.md`, `docs/v1-to-v2-changelog.md` (신규)

**변경 내용**
- `service-planning.md`: 문제 정의 / 타겟 사용자 / 경쟁 분석 / 서비스 플로우 / v1→v2 근거 / KPI / v3 로드맵
- `v1-to-v2-changelog.md`: 10개 변경 항목별 내용 / 근거 / 기대 효과 구조화

**변경 근거**
- 서비스 개선 의사결정 근거를 문서화해야 이후 팀원 온보딩과 v3 기획에 활용 가능
- "기획 → 개발 → 피드백 → 분석 → 개선" 운영 사이클의 완결을 위해 문서 체계 필요

**기대 효과**
- 서비스 개선 히스토리 추적 가능
- 신규 팀원이 v2 변경 배경을 빠르게 이해 가능
- v3 기획 시 v2 KPI 달성 여부를 기준점으로 사용 가능

---

## 마이그레이션 가이드

로컬 서버 재시작 시 별도 마이그레이션 불필요. `feedback-log.json`은 서버 최초 실행 시 자동 생성된다.

```bash
# 서버 재시작
npm start

# 피드백 로그 확인
cat data/runtime/feedback-log.json
```

GitHub Pages 배포는 기존과 동일하게 정적 파일 push로 완료된다.
`feedback-demo.json`이 자동 fallback으로 작동하므로 추가 설정 불필요.
