# SOP Q&A Assistant

문서 기반 제약·바이오 SOP Q&A 웹앱입니다.  
사용자는 SOP를 검색해 근거와 함께 답변을 받고, 운영자는 대시보드에서 질문 로그와 문서 커버리지를 확인할 수 있습니다.

## 바로 보기

- 메인 페이지: [https://jhr122333.github.io/sop-qa-assistant/](https://jhr122333.github.io/sop-qa-assistant/)
- 챗봇: [https://jhr122333.github.io/sop-qa-assistant/sop-qa-demo.html](https://jhr122333.github.io/sop-qa-assistant/sop-qa-demo.html)
- 관리자 대시보드: [https://jhr122333.github.io/sop-qa-assistant/admin-dashboard.html](https://jhr122333.github.io/sop-qa-assistant/admin-dashboard.html)

## 포함된 화면

- `index.html`: 제품 소개와 진입 화면
- `sop-qa-demo.html`: 사용자용 SOP Q&A 챗봇
- `admin-dashboard.html`: 운영자용 KPI / 리뷰 큐 / 문서 상태 화면

## 현재 기능

- 구조화된 SOP 문서 10종 검색
- OpenAI API 연동 서버 경유 호출
- 검색 디버그와 출처 표시
- 질문 로그 저장
- 관리자 대시보드 live data 우선 / mock fallback

## 로컬 실행

```bash
npm start
```

브라우저에서 `http://127.0.0.1:3000` 접속

## 파일 구조

```text
sop-qa-assistant/
├── index.html
├── sop-qa-demo.html
├── admin-dashboard.html
├── server.mjs
├── package.json
├── data/
│   ├── documents/sop-documents.json
│   ├── dashboard/dashboard-mock.json
│   └── runtime/chat-log.json
└── docs/
```

## 참고

- GitHub Pages에서는 정적 화면만 동작합니다.
- `/api/chat`, `/api/dashboard` 같은 서버 기능은 로컬 서버 또는 별도 백엔드 배포가 필요합니다.
