# SOP Q&A Assistant Source Data Spec

## 1. Purpose

Define how source documents should be stored outside the HTML demo so the same corpus can be used for UI rendering, retrieval indexing, and evaluation.

## 2. Current Problem

The current demo embeds all document content directly in [sop-qa-demo.html](/Users/hyerijang/Desktop/ax_project/sop-qa/sop-qa-demo.html), which makes it hard to:

- reuse the corpus in another UI
- build ingestion scripts
- track document versions cleanly
- evaluate retrieval against structured metadata

## 3. Recommended Directory Layout

```text
data/
  documents/
    sop-documents.json
  eval/
    eval-set.v1.json
```

For a later production version, each document can move to its own file, but one aggregated JSON file is enough for the MVP migration.

## 4. Document Schema

```json
{
  "documents": [
    {
      "document_id": "SOP-MFG-001",
      "title_ko": "제조 설비 세척 및 세척 검증 절차",
      "department": "제조",
      "document_type": "SOP",
      "version": "3.2",
      "effective_date": "2024-01-15",
      "approval_status": "APPROVED",
      "language": "ko",
      "sections": [
        {
          "section_id": "SOP-MFG-001-sec-1",
          "section_title": "1. 목적",
          "content": "..."
        }
      ]
    }
  ]
}
```

## 5. Required Fields

At document level:

- `document_id`
- `title_ko`
- `department`
- `document_type`
- `version`
- `effective_date`
- `approval_status`
- `language`
- `sections`

At section level:

- `section_id`
- `section_title`
- `content`

## 6. Optional Fields

- `title_en`
- `owner_team`
- `supersedes_document_id`
- `keywords`
- `tags`
- `source_file_name`

## 7. Design Rules

- Keep source text close to original approved wording.
- Preserve numbering in section titles.
- Store one logical section per entry.
- Avoid mixing answer templates into source data.
- Keep approval/version metadata explicit.

## 8. Chunking Relationship

The source JSON is not yet the retrieval chunk file. It is the canonical document store for the MVP.

Transformation flow:

```text
source document JSON
  -> ingestion script
  -> chunk records
  -> embeddings
  -> vector index
```

## 9. Migration Rule From Current Demo

Current `DOCS` in the HTML should be migrated into `data/documents/sop-documents.json`.

Field mapping:

- `id` -> `document_id`
- `title` -> `title_ko`
- `category` -> `department`
- `version` -> `version` without UI prefix handling changes
- `date` -> `effective_date`
- `sections[].title` -> `section_title`
- `sections[].content` -> `content`

UI-only fields like `badgeClass` should not live in source data.

## 10. Validation Checks

The ingestion step should fail fast when:

- document ID is missing
- version is missing
- approval status is missing
- section array is empty
- section content is blank
- duplicate document/version pairs exist

## 11. Next Code Step

Refactor the frontend to load document data from `data/documents/sop-documents.json` instead of embedding `DOCS` in the HTML file.

