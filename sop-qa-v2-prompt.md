# SOP Q&A Assistant v2 고도화 — Claude Code 프롬프트

## 프로젝트 개요
기존 SOP Q&A Assistant(https://github.com/jhr122333/sop-qa-assistant)를 v2로 고도화합니다.
제약·바이오 SOP 문서 기반 Q&A 챗봇에 **사용자 피드백 루프**를 추가하여,
"기획 → 개발 → 피드백 수집 → 데이터 분석 → 개선"의 서비스 운영 사이클을 완성하는 것이 목표입니다.

## 현재 구조 (v1)
```
sop-qa-assistant/
├── index.html              # 제품 소개 페이지
├── sop-qa-demo.html        # 사용자용 Q&A 챗봇
├── admin-dashboard.html    # 관리자 대시보드
├── server.mjs              # OpenAI API 연동 Express 서버
├── package.json
├── data/
│   ├── documents/sop-documents.json   # SOP 문서 10종
│   ├── dashboard/dashboard-mock.json  # 대시보드 mock 데이터
│   └── runtime/chat-log.json          # 질문 로그
├── assets/
└── docs/
```

- 로컬에서 `npm start`로 서버 실행 (포트 3000)
- OpenAI API 연동으로 SOP 문서 검색 후 답변 생성
- 답변에 출처(SOP 섹션) 표시
- 질문 로그를 chat-log.json에 저장
- 관리자 대시보드에 mock 데이터 기반 KPI 표시
- GitHub Pages에서는 정적 화면만 동작 (API 기능은 로컬 서버 필요)

---

## 작업 1: 피드백 루프 추가 (sop-qa-demo.html + server.mjs)

### 챗봇 UI에 피드백 기능 추가
- AI가 답변을 생성할 때마다, 답변 하단에 피드백 UI를 표시해줘:
  - 👍 (도움됨) / 👎 (개선필요) 버튼
  - 👎 클릭 시 추가 선택지 표시: "부정확한 답변" / "정보 부족" / "출처 불일치" / "기타"
  - "기타" 선택 시 자유 텍스트 입력 필드 표시
  - 피드백 제출 후 "피드백이 반영되었습니다. 감사합니다." 메시지 표시
- 피드백 UI 디자인은 기존 챗봇 UI 톤에 맞춰 깔끔하게

### 서버에 피드백 저장 API 추가
- `POST /api/feedback` 엔드포인트 추가
- 저장 데이터 구조:
```json
{
  "id": "uuid",
  "timestamp": "ISO 8601",
  "question": "사용자 질문 원문",
  "answer": "AI 답변 요약 (앞 100자)",
  "referenced_sops": ["SOP-001", "SOP-003"],
  "rating": "positive" | "negative",
  "negative_reason": "부정확한 답변" | "정보 부족" | "출처 불일치" | "기타" | null,
  "comment": "자유 텍스트" | null
}
```
- `data/runtime/feedback-log.json`에 저장
- GitHub Pages 배포 시에는 localStorage fallback으로 동작하게 처리

---

## 작업 2: 관리자 대시보드 고도화 (admin-dashboard.html)

### 기존 mock 데이터 외에 피드백 데이터 기반 실제 지표 추가
대시보드에 다음 섹션들을 추가해줘:

#### 2-1. 응답 만족도 섹션
- 전체 긍정/부정 비율 도넛 차트
- 최근 7일간 만족도 추이 라인 차트
- 불만족 사유 분포 막대 차트 (부정확 / 정보부족 / 출처불일치 / 기타)

#### 2-2. 질문 분석 섹션
- 가장 많이 질문된 SOP Top 5 (막대 차트)
- 질문 유형 분류: 자동 카테고리 (세척 절차 / 일탈 처리 / 문서 관리 / 장비 운영 / 교육 관련 / 기타)
- SOP 커버리지 히트맵: 전체 SOP 10종 중 참조된 빈도 시각화

#### 2-3. 최근 피드백 리뷰 큐
- 최신 부정 피드백 목록 (질문, 답변 요약, 사유, 코멘트)
- 각 항목에 "검토 완료" 체크 기능

### 데이터 소스 우선순위
- 로컬 서버 실행 시: `/api/feedback`, `/api/dashboard` 실제 데이터 사용
- GitHub Pages 시: localStorage 또는 내장 demo 데이터로 fallback
- fallback용 demo 데이터는 `data/dashboard/feedback-demo.json`에 미리 20~30건의 샘플 피드백을 넣어둬

### 차트 라이브러리
- Chart.js CDN 사용 (이미 HTML 기반 프로젝트이므로)

---

## 작업 3: 서비스 기획 문서 작성 (docs/ 폴더)

### docs/service-planning.md
다음 구조로 작성해줘:
```
# SOP Q&A Assistant — 서비스 기획서

## 1. 문제 정의
- 제약·바이오 현장에서 SOP 관련 질문이 발생했을 때의 기존 프로세스 문제점
- 문서가 많고, 검색이 어렵고, 담당자에게 직접 물어봐야 하는 비효율

## 2. 타겟 사용자
- Primary: 제약·바이오 품질관리(QA/QC) 담당자
- Secondary: 신규 입사자, 교육 담당자

## 3. 경쟁/유사 서비스 분석
- 기존 사내 문서 검색 시스템의 한계
- 일반 ChatGPT 사용의 한계 (SOP 특화 아님, 출처 추적 불가, 할루시네이션)
- 본 서비스의 차별점: SOP 특화 RAG + 출처 표시 + 피드백 기반 고도화

## 4. 핵심 기능 & 서비스 플로우
- 사용자 질문 → SOP 문서 검색 → 관련 섹션 추출 → AI 답변 생성 → 출처 표시 → 피드백 수집
- 관리자: 대시보드에서 질문 패턴, 만족도, SOP 커버리지 모니터링

## 5. v1 → v2 변경 사항 및 근거
- v1: 기본 Q&A + 출처 표시 + 질문 로그
- v2: 피드백 루프 + 대시보드 고도화 + 서비스 기획 문서화
- 변경 근거: v1 QA 테스트 중 발견된 문제점 (구체적으로 기술)

## 6. 핵심 지표 (KPI)
- 응답 만족도 (긍정 비율 목표: 80% 이상)
- SOP 커버리지율 (10종 중 참조된 비율)
- 평균 응답 시간
- 불만족 사유 Top 3 변화 추이

## 7. 향후 로드맵 (v3)
- 멀티 SOP 비교 질문 지원
- 후속 질문 자동 추천
- SOP 버전 관리 및 변경 알림
```

### docs/v1-to-v2-changelog.md
v1에서 v2로의 변경 사항을 구조적으로 정리해줘.
변경 항목마다 "변경 내용 / 변경 근거 / 기대 효과"를 명시.

---

## 디자인 가이드라인
- 기존 sop-qa-demo.html과 admin-dashboard.html의 디자인 톤을 유지해줘
- 색상, 폰트, 레이아웃 스타일을 크게 바꾸지 말고, 기존 UI에 자연스럽게 녹여줘
- 피드백 버튼은 눈에 잘 띄되, 답변 읽기를 방해하지 않는 위치에
- 대시보드 차트는 깔끔하고 읽기 쉽게 (과도한 장식 지양)

## 기술 제약
- HTML + Vanilla JS + CSS 기반 (React 미사용)
- 서버: Node.js Express (server.mjs)
- 차트: Chart.js CDN
- AI: OpenAI API (기존 연동 유지)
- 데이터 저장: JSON 파일 기반 (DB 미사용)
- GitHub Pages 배포 시 정적 fallback 필수

## 완료 기준
- [ ] 챗봇에서 답변마다 피드백 UI가 표시되고, 피드백이 저장됨
- [ ] 관리자 대시보드에 만족도, 질문 분석, 피드백 리뷰 큐가 표시됨
- [ ] demo용 피드백 샘플 데이터 20~30건이 포함됨
- [ ] docs/ 폴더에 서비스 기획서와 변경 로그가 작성됨
- [ ] 로컬 서버와 GitHub Pages 모두에서 정상 동작
- [ ] README.md가 v2 변경사항을 반영하여 업데이트됨
