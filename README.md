# SOP Q&A Assistant

> 제약·바이오 현장 SOP를 즉시 검색하고 근거 기반 답변을 제공하는 웹 Q&A 서비스

---

## 버전 히스토리

| 버전 | 주요 목표 | 상태 |
|------|-----------|------|
| **v1** | SOP 문서 검색 + AI 답변 기본기 구축 | ✅ 완료 |
| **v2** | 피드백 루프 · 운영 대시보드 · UX 고도화 | ✅ 완료 |

---

## 바로 보기

- 메인 페이지: [https://jhr122333.github.io/sop-qa-assistant/](https://jhr122333.github.io/sop-qa-assistant/)
- 챗봇: [sop-qa-demo.html](https://jhr122333.github.io/sop-qa-assistant/sop-qa-demo.html)
- 관리자 대시보드: [admin-dashboard.html](https://jhr122333.github.io/sop-qa-assistant/admin-dashboard.html)

---

## v1 — 기본 Q&A 엔진

> **목표:** SOP 문서를 기반으로 질문하면 근거와 함께 답변하는 챗봇 구축

### 챗봇 (`sop-qa-demo.html`)

- SOP 문서 10종 탑재 (제조·QA·QC·ENG 분야)
- BM25 키워드 검색으로 관련 문서 청크 검색
- OpenAI API 연동 — 검색 결과를 컨텍스트로 삼아 답변 생성
- 답변마다 출처 표시 (Document ID / Section / Version)
- OpenAI API 미연결 시 사전 정의 키워드 Q&A(25건)로 자동 fallback
- 사이드바에 탑재 SOP 문서 목록 표시

### 관리자 대시보드 (`admin-dashboard.html`)

- KPI 카드 4종 (총 질문 수 / 답변 성공률 / 근거 부족 비율 / 부정 피드백)
- 최근 7일 질문량 추이 바 차트

---

## v2 — 피드백 루프 & 운영 고도화

> **목표:** 사용자 반응을 수집하고, 운영자가 데이터 기반으로 서비스를 개선할 수 있는 구조 완성

### 챗봇 신규 기능

#### 피드백 루프
- 답변마다 **👍 도움됨 / 👎 개선필요** 버튼 표시
- 👎 클릭 시 사유 선택: `부정확한 답변` / `정보 부족` / `출처 불일치` / `기타`
- `기타` 선택 시 자유 텍스트 입력 가능
- 로컬 서버: `POST /api/feedback` → `data/runtime/feedback-log.json` 저장
- GitHub Pages: `localStorage` 자동 fallback

#### 채팅 히스토리
- 사이드바 탭 전환 — 문서 목록 / 대화 기록
- 과거 대화 클릭 시 질문·답변 전체 복원
- 최근 20개 세션 `localStorage` 자동 저장

#### UX 개선
- **새 대화 버튼(+)** — 헤더·사이드바 두 곳 배치, 히스토리 유지한 채 새 세션 시작
- 아바타 이모지 → **SVG 아이콘** 교체 (사용자: 인물 아이콘 / AI: 별 아이콘)
- 버튼 텍스트 제거 — 아이콘 전용 UI (전송: 종이비행기 SVG)

### 관리자 대시보드 신규 기능

#### 응답 만족도 분석 (Chart.js)
- 전체 긍정/부정 비율 도넛 차트
- 최근 7일 만족도 추이 라인 차트
- 불만족 사유 분포 가로 막대 차트

#### 질문 분석
- 가장 많이 질문된 SOP Top 5
- 질문 유형 자동 분류 도넛 차트 (절차·기준·담당·정의·기타 6종)
- SOP 커버리지 히트맵 (10종 문서별 참조 빈도)

#### 피드백 리뷰 큐
- 최신 부정 피드백 카드 목록 (질문 / 사유 / 참조 SOP / 코멘트)
- 검토 완료 체크박스 (상태 `localStorage` 저장)

#### 탑재 Q&A 목록
- 오프라인 키워드 Q&A DB 전체 항목 테이블 (25건)
- 출처 SOP 배지 / 인식 키워드 태그 / 답변 미리보기
- 키워드·SOP ID 실시간 검색 필터

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 서버 시작 (포트 3000)
npm start
```

브라우저에서 `http://127.0.0.1:3000` 접속

환경 변수 설정 (`.env` 파일 생성):

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini   # 생략 시 기본값
```

---

## 파일 구조

```text
sop-qa/
├── index.html                             # 제품 소개 진입 화면
├── sop-qa-demo.html                       # 사용자용 챗봇
├── admin-dashboard.html                   # 운영자용 대시보드
├── server.mjs                             # Node.js HTTP 서버
├── package.json
├── .env.example
├── data/
│   ├── documents/sop-documents.json       # SOP 문서 10종
│   ├── dashboard/dashboard-mock.json      # 대시보드 mock 데이터
│   ├── dashboard/feedback-demo.json       # v2: 피드백 샘플 데이터 (28건)
│   └── runtime/
│       ├── chat-log.json                  # 질문 로그 (자동 생성)
│       └── feedback-log.json              # v2: 피드백 로그 (자동 생성)
└── docs/
    ├── service-planning.md                # v2: 서비스 기획서
    ├── v1-to-v2-changelog.md              # v2: 변경 상세 로그
    ├── PRD.md
    ├── RAG-ARCHITECTURE.md
    ├── DASHBOARD-SPEC.md
    ├── EVAL-PLAN.md
    └── SOURCE-DATA-SPEC.md
```

---

## API 엔드포인트

| 메서드 | 경로 | 버전 | 설명 |
|--------|------|------|------|
| `POST` | `/api/chat` | v1 | SOP Q&A 답변 생성 |
| `GET`  | `/api/dashboard` | v1 | 대시보드 집계 데이터 |
| `POST` | `/api/feedback` | **v2** | 피드백 저장 |
| `GET`  | `/api/feedback` | **v2** | 피드백 목록 조회 |

---

## GitHub Pages vs 로컬 서버

GitHub Pages에서는 서버 없이 정적 파일만 동작합니다.

| 기능 | 로컬 서버 | GitHub Pages |
|------|-----------|--------------|
| 챗봇 답변 생성 | OpenAI API 연동 | 사전 정의 Q&A (키워드 매칭) |
| 피드백 저장 | `feedback-log.json` | `localStorage` |
| 대시보드 데이터 | 실데이터 (`chat-log` + `feedback-log`) | `feedback-demo.json` fallback |

---

## 관련 문서

- [서비스 기획서](./docs/service-planning.md)
- [v1 → v2 변경 로그](./docs/v1-to-v2-changelog.md)
- [RAG 아키텍처](./docs/RAG-ARCHITECTURE.md)
- [대시보드 스펙](./docs/DASHBOARD-SPEC.md)
