# 🔬 SOP Q&A Assistant

> AI-powered pharmaceutical document Q&A chatbot
> 제약·바이오 SOP 문서 기반 AI Q&A 챗봇

---

## 🚀 Live Demo

| Version | Link | 설명 |
|--------|------|------|
| 🎯 데모  | [sop-qa-demo.html](https://jhr122333.github.io/sop-qa-assistant/sop-qa-demo.html) | API 키 불필요 |
---

## 📌 프로젝트 개요

제약·바이오 현장에서 SOP 문서 관련 내용을 검색하고 답변을 확인하는 Q&A 챗봇 데모입니다.

SOP 관련 질문을 입력하면 AI가 관련 문서를 참조해 정확한 답변과 출처 섹션을 함께 제공합니다.

---

## ✨ 주요 기능

- 📄 SOP 문서 3종 내장 (GMP 세척 검증 / 배치 기록 검토 / 환경 모니터링)
- 💬 문서 기반 AI 답변 생성 (출처 섹션 자동 표시)
- 🔍 샘플 질문으로 빠른 시작
- 🌐 한국어 / 영어 버전 제공
- 🎯 데모 버전: API 없이 바로 실행 가능

---

## 🛠 기술 스택

- HTML / CSS / JavaScript (Single Page, 빌드 도구 없음)
- Claude API (`claude-sonnet-4-0`) 연동
- GitHub Pages 배포

---

## 💡 기획 배경

> **AI 평가 경험 × 품질 프레임워크 × 제약 도메인**

쿠팡에서 AI 콘텐츠 품질 평가(accuracy, conciseness) 업무를 하며,
품질 평가 프레임워크(정확성·자연스러움·일관성)를 AI 평가에 적용하는 방식을 연구해왔습니다.

이 프로젝트는 그 경험을 제약·바이오 AX(AI Transformation) 환경에 적용한 PoC입니다.
SOP 문서처럼 **정확성이 중요한 문서**일수록, AI 답변의 품질 기준과 출처 명시가 핵심이라는 점에서 출발했습니다.

---

## 📂 파일 구조

```
sop-qa-assistant/
├── sop-qa-demo.html          # 데모 버전 (API 불필요, 바로 실행)
├── sop-qa-assistant-ko.html  # 한국어 버전 (Claude API 연동)
├── sop-qa-assistant-en.html  # 영어 버전 (Claude API 연동)
└── README.md
```

---

## 👤 만든 사람

**장혜리 Hyeri Jang**
AI Content Specialist | Translation Studies | AX Portfolio
