# SOP Q&A Assistant Evaluation Plan

## 1. Objective

Define how the product will be evaluated before and after the RAG migration so that improvement is measured by grounded answer quality, not just fluent output.

## 2. Evaluation Principles

- Measure groundedness before fluency.
- Reward correct abstention when evidence is missing.
- Score retrieval and generation separately.
- Use both offline benchmark questions and online usage signals.

## 3. What To Evaluate

### 3.1 Retrieval Quality

- Did the system retrieve the correct document?
- Did it retrieve the correct section?
- Did it retrieve enough evidence to answer?

### 3.2 Answer Quality

- Is the answer factually supported by retrieved text?
- Is the answer complete enough for the question type?
- Are citations correct and specific?
- Did the assistant abstain when it should have?

### 3.3 Product Quality

- Is latency acceptable?
- Are users finding the answer useful?
- Are repeated failures concentrated in certain intents or documents?

## 4. Gold Evaluation Set

Build an initial benchmark set of 50 to 100 questions from the approved corpus.

Recommended composition:

- 15 definition questions
- 20 procedure questions
- 10 threshold or limit questions
- 10 exception handling questions
- 10 unanswerable or out-of-scope questions

Each eval item should include:

- `question_id`
- `question`
- `intent_type`
- `expected_answer_points`
- `required_document_id`
- `required_section_title`
- `expected_status`

## 5. Scoring Framework

### 5.1 Retrieval Scoring

- `document_hit`: correct document retrieved in top 3
- `section_hit`: correct section retrieved in top 3
- `evidence_sufficiency`: enough relevant evidence present

### 5.2 Answer Scoring

Use a 0 to 2 scale.

- `2`: correct, grounded, complete enough, proper citation
- `1`: partially correct or incomplete, but still grounded
- `0`: unsupported, incorrect, or misleading

### 5.3 Abstention Scoring

- `pass`: abstained on truly unanswerable question
- `fail`: answered despite insufficient evidence

### 5.4 Citation Scoring

- correct document ID
- correct section title
- correct version when applicable

## 6. Pass Criteria For MVP

Initial target thresholds:

- document hit rate: at least 85%
- section hit rate: at least 75%
- grounded answer rate: at least 80%
- unanswerable abstention accuracy: at least 90%
- citation correctness: at least 95%

These are product gates for iteration, not regulatory validation thresholds.

## 7. Online Monitoring Metrics

Track after launch:

- answered rate
- insufficient evidence rate
- helpful feedback rate
- negative feedback rate
- citation attachment rate
- repeat-question rate
- escalation/review queue volume

## 8. Failure Taxonomy

Every failed or low-quality answer should be tagged into one primary bucket:

- missing document
- wrong document retrieved
- wrong section retrieved
- insufficient chunking
- prompt formatting failure
- hallucinated detail
- vague user question
- outdated source metadata

This taxonomy feeds dashboard review queues and roadmap decisions.

## 9. Review Workflow

1. Pull recent low-confidence and negative-feedback cases.
2. Check retrieved chunks.
3. Determine whether failure came from retrieval, source data, or generation.
4. Tag root cause.
5. Decide action:
   - add document
   - fix metadata
   - adjust chunking
   - refine prompt
   - add eval case

## 10. Example Eval Item Format

```json
{
  "question_id": "eval-ko-001",
  "question": "Swab Test의 합격 기준은 무엇인가요?",
  "intent_type": "threshold_limit",
  "expected_status": "answered",
  "required_document_id": "SOP-MFG-001",
  "required_section_title": "6. 세척 검증",
  "expected_answer_points": [
    "Swab 기준은 4 ug/cm2 이하",
    "시각적 검사 또는 추가 기준이 함께 제시될 수 있다"
  ]
}
```

## 11. MVP Deliverables

- gold evaluation dataset
- evaluator rubric
- benchmark run template
- weekly quality review checklist
- dashboard linkage to failure taxonomy

## 12. Recommended Cadence

- before each major release: offline benchmark run
- weekly: review top failure cases
- monthly: update gold set with newly observed real questions

