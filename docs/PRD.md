# SOP Q&A Assistant PRD

## 1. Product Summary

SOP Q&A Assistant is a document-grounded chatbot for pharmaceutical and biotech teams who need fast, reliable answers from SOPs, batch records, and quality documents.

The current repository contains a static demo with embedded SOP content and keyword-based answer matching. The next product stage is an operational MVP that can ingest approved documents, retrieve relevant passages, generate grounded answers, and expose usage and quality signals through an admin dashboard.

## 2. Problem Statement

Shop-floor, QA, QC, and manufacturing users lose time searching for the right SOP section, interpreting procedure details, and confirming whether they are reading the latest approved version.

Current pain points:

- Users search across PDFs, folders, or EDMS manually.
- The same procedural questions are repeatedly asked to QA or senior staff.
- Wrong or outdated document references create compliance risk.
- Teams have no visibility into which questions the chatbot fails to answer.

## 3. Product Goal

Reduce time-to-answer for SOP questions while preserving trust through grounded responses, explicit citations, and document-version awareness.

## 4. Non-Goals

- Fully autonomous GMP decision-making without human review
- Replacing QP, QA approval, or formal deviation workflows
- Generating new regulated content without approval controls
- Broad open-domain chat outside the document corpus

## 5. Target Users

### Primary

- Manufacturing operators
- QA reviewers
- QC analysts
- Production supervisors

### Secondary

- Regulatory/document control staff
- Site leadership tracking knowledge and compliance trends

## 6. Core Use Cases

1. A manufacturing user asks for a cleaning validation limit or procedural step.
2. A QA reviewer asks how OOS handling is described in the approved SOP set.
3. A QC user asks for cleanroom monitoring limits by grade.
4. A new employee asks where in the SOP a task is documented.
5. An admin reviews failed questions and adds missing source documents.

## 7. User Stories

- As a manufacturing operator, I want to ask a procedure question in plain Korean so I can avoid opening multiple SOPs manually.
- As a QA reviewer, I want every answer to include document name, section, and version so I can trust the output.
- As a QC analyst, I want the assistant to say it does not know when no approved source exists so I can avoid fabricated answers.
- As an admin, I want to see unanswered or low-confidence questions so I can improve coverage.
- As a document controller, I want only approved document versions to be searchable so outdated procedures are not surfaced.

## 8. Product Principles

- Ground every answer in retrievable source text.
- Prefer abstention over hallucination.
- Make version and approval status visible.
- Log real user questions for iterative improvement.
- Keep the UX simple for non-technical GMP users.

## 9. Functional Requirements

### 9.1 Chat Experience

- Users can ask free-text questions in Korean first, with English support as a later phase.
- The assistant returns:
  - direct answer
  - concise supporting rationale
  - citation list with document ID, title, section, version
  - confidence band or answer status
- The assistant supports follow-up questions within the same session.
- The assistant provides refusal/abstain responses when evidence is insufficient.

### 9.2 Retrieval and Answering

- Only approved documents are indexed for retrieval.
- Documents are chunked by section and subsection.
- Retrieval returns top relevant chunks with metadata.
- Answer generation must use retrieved chunks only.
- If relevance is weak, the assistant asks a clarifying question or abstains.

### 9.3 Document Management

- Admin can upload source documents and metadata.
- Each document includes:
  - document ID
  - title
  - department
  - language
  - version
  - effective date
  - approval status
- Superseded documents are excluded from active retrieval.

### 9.4 Feedback and Quality

- Users can mark answers as helpful or not helpful.
- Users can report inaccurate answers.
- All chat sessions, retrieval results, and feedback are logged.

### 9.5 Dashboard

- Admin dashboard shows usage, answer quality, failed questions, and document coverage.
- Dashboard supports filtering by date, department, document, and answer status.

## 10. Non-Functional Requirements

- Response target: first answer within 5 seconds for normal questions
- Availability target for MVP: internal demo grade, not validated production
- Auditability: every answer stores prompt, retrieved chunks, model output, and citations
- Security: internal authenticated access only
- Localization: Korean-first interface

## 11. Success Metrics

### Primary

- Answered question rate
- Citation attachment rate
- Helpful feedback rate
- Median time-to-answer

### Quality

- Grounded answer rate
- Hallucination incident rate
- No-answer accuracy rate
- Citation correctness rate

### Operational

- Top failed intents
- Top missing documents
- Repeat question reduction
- Monthly active users

## 12. MVP Scope

### In Scope

- Web chat UI
- SOP upload and metadata registration
- Section-based chunking and vector retrieval
- LLM answer generation with citation output
- Conversation log storage
- Admin dashboard with core metrics

### Out of Scope

- Validation package for regulated deployment
- ERP/QMS/EDMS bi-directional integration
- Role-based workflow approvals inside the app
- Voice interface

## 13. Risks

- Source corpus is too small or too synthetic to prove value.
- Users may over-trust fluent answers without checking citations.
- Approval/version metadata may be missing in initial source files.
- Dashboard metrics can look healthy while answer quality is still weak unless reviewed against gold questions.

## 14. Release Phasing

### Phase 1: Foundation

- Replace keyword matching with RAG pipeline
- Store logs and feedback
- Add citation-enforced answer template

### Phase 2: Operations

- Launch admin dashboard
- Add document upload and version controls
- Add evaluation dataset and offline benchmark runs

### Phase 3: Enterprise Readiness

- SSO and access policies
- EDMS/QMS integration
- validation-oriented audit package and SOP for system operation

