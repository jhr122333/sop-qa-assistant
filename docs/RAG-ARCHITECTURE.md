# SOP Q&A Assistant RAG Architecture

## 1. Objective

Move the current static demo from hardcoded keyword matching to a retrieval-augmented generation system that answers only from approved SOP content and exposes enough metadata for quality review.

## 2. Current State

Current implementation characteristics:

- source data is embedded directly in the HTML file
- answers are selected by keyword overlap
- there is no document ingestion pipeline
- there is no retrieval scoring, logging, or evaluation layer
- there is no distinction between approved and superseded content

This is acceptable for a portfolio demo, but not for a product MVP.

## 3. Target Architecture

```text
Document Upload
  -> Text extraction
  -> Section parsing
  -> Chunking
  -> Metadata enrichment
  -> Embedding generation
  -> Vector index / document store

User Question
  -> Query preprocessing
  -> Retrieval
  -> Re-ranking
  -> Answer prompt assembly
  -> LLM generation
  -> Citation formatting
  -> Logging + feedback capture
```

## 4. System Components

### 4.1 Document Ingestion

Input sources:

- SOP PDFs
- controlled Word exports
- structured HTML or markdown

Required outputs per chunk:

- `document_id`
- `title`
- `department`
- `version`
- `effective_date`
- `approval_status`
- `section_id`
- `section_title`
- `chunk_id`
- `chunk_text`
- `language`

Ingestion rules:

- only `APPROVED` documents are searchable by default
- `SUPERSEDED` documents remain in storage but are excluded from active retrieval
- extraction failures must be flagged for admin review

### 4.2 Chunking Strategy

Preferred chunk unit:

- section or subsection aligned chunk

Guidelines:

- target 300 to 800 tokens per chunk
- preserve headings and numbering
- overlap lightly only when sections are long
- keep tables and acceptance criteria intact when possible

Recommended chunk example:

```json
{
  "document_id": "SOP-MFG-001",
  "version": "3.2",
  "section_title": "6. Cleaning Validation",
  "chunk_text": "Validation completion criteria: three consecutive successful runs..."
}
```

### 4.3 Retrieval Layer

Recommended retrieval flow:

1. Normalize user question.
2. Generate embedding for the query.
3. Retrieve top `k` chunks from vector search.
4. Apply metadata filtering:
   - approved only
   - selected language
   - optional department filter
5. Re-rank retrieved chunks using lexical + semantic score.
6. Pass top 3 to 5 chunks into the answer prompt.

Why this matters:

- vector retrieval handles paraphrased questions better than keyword matching
- metadata filtering reduces outdated or irrelevant answers
- re-ranking improves citation precision

### 4.4 Generation Layer

System prompt requirements:

- answer only from supplied context
- if context is insufficient, say so explicitly
- cite document and section for each substantive answer
- do not invent thresholds, limits, or procedural steps
- separate answer from evidence

Target answer schema:

```json
{
  "answer_status": "answered | insufficient_evidence | clarification_needed",
  "answer": "string",
  "evidence_summary": "string",
  "citations": [
    {
      "document_id": "SOP-MFG-001",
      "title": "Cleaning Validation Procedure",
      "version": "3.2",
      "section_title": "6. Cleaning Validation"
    }
  ],
  "confidence": "high | medium | low"
}
```

### 4.5 Logging Layer

Every chat turn should store:

- question text
- conversation/session ID
- retrieved chunk IDs
- retrieval scores
- final prompt version
- model name
- answer payload
- latency
- user feedback if provided

This data is required for the dashboard and future evaluation.

## 5. Guardrails

### 5.1 Answer Guardrails

- abstain if no chunk passes relevance threshold
- abstain if retrieved chunks conflict materially
- do not answer using model prior knowledge alone
- surface version and section every time

### 5.2 Document Guardrails

- active corpus excludes draft, obsolete, and unapproved documents
- each uploaded file must have explicit metadata before indexing
- duplicate versions should be blocked or flagged

### 5.3 Product Guardrails

- the UI should label the product as an assistant, not an approval authority
- answers should include a note to follow site SOP and QA escalation pathways for critical decisions

## 6. Evaluation Design

### 6.1 Offline Evaluation Set

Create a gold question set with:

- direct factual questions
- procedure questions
- threshold/limit questions
- exception handling questions
- unanswerable questions

Label each item with:

- expected answer points
- required citation
- acceptable abstain status

### 6.2 Online Metrics

- retrieval hit rate
- answer helpfulness rate
- no-answer rate
- citation click/open rate
- feedback-based error rate

## 7. Suggested MVP Stack

This repo is currently static HTML, so the practical MVP stack should separate frontend and backend concerns.

### Frontend

- simple web chat UI
- chat history
- citation cards
- admin dashboard

### Backend

- API for chat
- document ingestion worker
- vector database
- relational database for metadata and logs

### Core services

- embedding model
- answer model
- storage for uploaded documents

## 8. Suggested Data Model

Minimum entities:

- `documents`
- `document_versions`
- `chunks`
- `chat_sessions`
- `chat_messages`
- `retrieval_events`
- `user_feedback`

## 9. Proposed Request Flow

```text
User submits question
  -> API validates auth/session
  -> Query embedding generated
  -> Retrieve top chunks
  -> Re-rank and threshold
  -> Build grounded prompt
  -> Generate answer
  -> Persist logs
  -> Return answer + citations + confidence
```

## 10. Migration Plan From Current Demo

### Step 1

Extract embedded SOP content from the HTML into structured JSON or markdown source files.

### Step 2

Build a small ingestion script that converts source documents into chunks with metadata.

### Step 3

Replace `findAnswer()` style keyword matching with an API-backed retrieval call.

### Step 4

Store chat logs and feedback.

### Step 5

Add dashboard views over answer outcomes and failed questions.

## 11. Open Decisions

- Which embedding provider and vector store to use
- Whether multilingual retrieval is needed from day one
- Whether citation granularity should be section-level or paragraph-level
- Whether admins need manual chunk review before indexing

