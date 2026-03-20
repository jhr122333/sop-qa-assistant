# SOP Q&A Assistant Dashboard Spec

## 1. Purpose

The dashboard is an operational layer for the chatbot. Its job is not just reporting usage, but exposing whether the assistant is trustworthy, where it fails, and which documents or intents need improvement.

## 2. Primary Users

- Product owner
- QA lead
- Document control/admin
- Engineering team

## 3. Dashboard Goals

- Measure adoption
- Measure answer quality
- Detect coverage gaps
- Track source-document health
- Prioritize improvement work

## 4. Dashboard Sections

### 4.1 Executive Overview

Top KPIs:

- total questions
- active users
- answered rate
- insufficient evidence rate
- helpful feedback rate
- median response time

Date filters:

- today
- last 7 days
- last 30 days
- custom range

### 4.2 Answer Quality

Widgets:

- answer status distribution
- helpful vs not helpful trend
- low-confidence answer count
- reported inaccuracy count
- citation attachment rate

Recommended charts:

- stacked bar by answer status
- daily trend line for feedback
- table of lowest-rated answers

### 4.3 Retrieval Health

Widgets:

- average retrieval score
- low-relevance retrieval count
- top failed queries with no strong match
- top mismatched citations

Why it matters:

- many failures will come from retrieval, not the model itself

### 4.4 Document Coverage

Widgets:

- top referenced documents
- documents never retrieved
- documents with high failure association
- approved vs superseded document counts
- newly uploaded documents awaiting index

Recommended admin actions:

- add missing document
- fix metadata
- re-index document
- retire outdated version

### 4.5 User Intent Insights

Intent buckets:

- definition
- procedural step
- threshold or limit
- exception handling
- document lookup

Widgets:

- question volume by intent
- failure rate by intent
- repeat questions by intent

### 4.6 Review Queue

This is the most operationally important section.

Queue items:

- unanswered questions
- low-confidence answers
- negative feedback answers
- potential hallucination reports

Columns:

- timestamp
- user question
- answer status
- cited document
- confidence
- feedback
- assigned reviewer

## 5. Core Metrics Definitions

### Answered Rate

Percentage of questions returned with `answer_status = answered`.

### Insufficient Evidence Rate

Percentage of questions returned with `answer_status = insufficient_evidence`.

### Helpful Feedback Rate

Percentage of feedback events marked positive.

### Citation Attachment Rate

Percentage of answered responses that include at least one citation.

### Retrieval Failure Rate

Percentage of questions where no chunk passed minimum relevance threshold.

## 6. Filters

The dashboard should support filtering by:

- date range
- department
- document ID
- answer status
- confidence band
- language

## 7. Required Data Inputs

The dashboard depends on these backend events:

- chat message logs
- retrieval result logs
- answer payload logs
- feedback events
- document metadata
- indexing status events

## 8. Recommended MVP Screens

### Screen 1: Overview

- KPI cards
- daily volume chart
- answer status trend

### Screen 2: Quality

- feedback trend
- low-confidence table
- reported inaccuracies

### Screen 3: Coverage

- top documents
- unretrieved documents
- failed questions by document gap

### Screen 4: Review Queue

- sortable table of questions requiring review

## 9. Alert Conditions

The dashboard should highlight warnings when:

- insufficient evidence rate exceeds threshold
- helpful feedback drops week-over-week
- one document generates repeated inaccuracies
- a newly approved document has not been indexed
- citation attachment rate drops unexpectedly

## 10. Example KPI Targets For MVP

- answered rate: at least 70%
- citation attachment rate: at least 95% on answered responses
- helpful feedback rate: at least 70%
- low-confidence answer share: under 20%
- median response time: under 5 seconds

These are operating targets, not validation thresholds.

## 11. UX Notes

- Default to simple tables and trend charts rather than dense BI visuals.
- Make every KPI drill down into actual chat examples.
- Show exact document version in all detail views.
- Keep Korean labels first if the user base is domestic GMP teams.

## 12. Phase 2 Extensions

- reviewer assignment workflow
- root-cause tagging for failures
- monthly evaluation report export
- department-level adoption comparisons
- document freshness and renewal reminders

