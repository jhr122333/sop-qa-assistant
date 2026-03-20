import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const CHAT_LOG_PATH = path.join(__dirname, 'data/runtime/chat-log.json');
const FEEDBACK_LOG_PATH = path.join(__dirname, 'data/runtime/feedback-log.json');

function parseDotEnv(raw) {
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value.replace(/^"(.*)"$/, '$1');
  }
  return env;
}

async function loadEnvFile() {
  try {
    const raw = await readFile(path.join(__dirname, '.env'), 'utf8');
    const parsed = parseDotEnv(raw);
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env is optional in repo state
  }
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function text(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

async function readJson(relativePath) {
  const raw = await readFile(path.join(__dirname, relativePath), 'utf8');
  return JSON.parse(raw);
}

async function ensureChatLogFile() {
  await mkdir(path.dirname(CHAT_LOG_PATH), { recursive: true });
  try {
    await readFile(CHAT_LOG_PATH, 'utf8');
  } catch {
    await writeFile(CHAT_LOG_PATH, JSON.stringify({ entries: [] }, null, 2));
  }
}

async function ensureFeedbackLogFile() {
  await mkdir(path.dirname(FEEDBACK_LOG_PATH), { recursive: true });
  try {
    await readFile(FEEDBACK_LOG_PATH, 'utf8');
  } catch {
    await writeFile(FEEDBACK_LOG_PATH, JSON.stringify({ entries: [] }, null, 2));
  }
}

async function appendFeedbackLog(entry) {
  await ensureFeedbackLogFile();
  const raw = await readFile(FEEDBACK_LOG_PATH, 'utf8');
  const payload = JSON.parse(raw);
  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  entries.push(entry);
  await writeFile(FEEDBACK_LOG_PATH, JSON.stringify({ entries }, null, 2));
}

async function readChatLog() {
  await ensureChatLogFile();
  const raw = await readFile(CHAT_LOG_PATH, 'utf8');
  const payload = JSON.parse(raw);
  return Array.isArray(payload.entries) ? payload.entries : [];
}

async function appendChatLog(entry) {
  const entries = await readChatLog();
  entries.push(entry);
  await writeFile(CHAT_LOG_PATH, JSON.stringify({ entries }, null, 2));
}

const SYNONYM_GROUPS = [
  ['swab', '스왑', 'swabtest', '표면시험', '면봉'],
  ['rinse', '린스', 'rinsetest', '헹굼수'],
  ['maco', '최대허용이월', '최대허용이월량', 'carryover'],
  ['oos', 'outofspecification', '규격외', '부적합'],
  ['oot', 'outoftrend', '이상추세'],
  ['capa', '시정및예방조치', '개선조치'],
  ['deviation', '이탈'],
  ['batchrecord', '배치기록', 'bmr', 'bpr'],
  ['coa', '시험성적서'],
  ['gradea', 'grade a', 'grade-a', 'gradea구역', 'gradea등급'],
  ['gradeb', 'grade b', 'grade-b'],
  ['gradec', 'grade c', 'grade-c'],
  ['graded', 'grade d', 'grade-d'],
  ['cleanroom', '청정구역', '클린룸'],
  ['environmentalmonitoring', '환경모니터링'],
  ['hvac', '압차', '환기', 'hepa', '풍속'],
  ['microbial', '미생물', 'cfu', 'settleplate', 'contactplate'],
  ['cleaningvalidation', '세척검증'],
  ['releaseapproval', '출하승인', '출하', '승인'],
  ['documentretention', '문서보관', '보관기간', '기록보관']
];

const STOPWORDS = new Set([
  '은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '로', '으로',
  '좀', '관련', '대한', '에서', '하면', '하는', '무엇', '뭐', '설명', '주세요',
  '알려', '정리', '기준', '절차', '방법', 'the', 'is', 'are', 'what', 'how',
  'for', 'and', 'with'
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[_/]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s.-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

function tokenize(value) {
  const normalized = normalizeText(value);
  if (!normalized) return [];

  const rawTokens = normalized
    .split(/[\s.-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const tokens = [];
  for (const token of rawTokens) {
    if (!STOPWORDS.has(token) && token.length >= 2) {
      tokens.push(token);
    }

    if (/^[a-z]+[0-9]+$/.test(token) || /^[0-9]+[a-z]+$/.test(token)) {
      tokens.push(token.replace(/([a-z]+)([0-9]+)/, '$1 $2'));
    }
  }

  return tokens.flatMap((token) => token.split(' ')).filter((token) => token && !STOPWORDS.has(token));
}

function expandTokens(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const compactToken = token.replace(/\s+/g, '');
    for (const group of SYNONYM_GROUPS) {
      const normalizedGroup = group.map((item) => compactText(item));
      if (normalizedGroup.includes(compactToken)) {
        for (const synonym of normalizedGroup) expanded.add(synonym);
      }
    }
  }
  return [...expanded];
}

function buildChunks(documents) {
  return documents.flatMap((doc) => {
    const titleTokens = tokenize(doc.title_ko);
    const departmentTokens = tokenize(doc.department);

    return (doc.sections || []).map((section) => {
      const sectionTokens = tokenize(section.section_title);
      const contentTokens = tokenize(section.content);

      return {
        document_id: doc.document_id,
        title: doc.title_ko,
        version: doc.version,
        department: doc.department,
        section_id: section.section_id,
        section_title: section.section_title,
        content: section.content,
        titleText: compactText(doc.title_ko),
        sectionText: compactText(section.section_title),
        contentText: compactText(section.content),
        tokens: [...titleTokens, ...departmentTokens, ...sectionTokens, ...contentTokens]
      };
    });
  });
}

function buildCorpusStats(chunks) {
  const docFreq = new Map();

  for (const chunk of chunks) {
    const seen = new Set(chunk.tokens);
    for (const token of seen) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  const avgDocLength = chunks.length
    ? chunks.reduce((sum, chunk) => sum + chunk.tokens.length, 0) / chunks.length
    : 0;

  return {
    totalDocs: chunks.length,
    avgDocLength,
    docFreq
  };
}

function computeTermFrequency(tokens) {
  const tf = new Map();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function bm25Score(queryTokens, chunk, corpusStats) {
  const tf = computeTermFrequency(chunk.tokens);
  const k1 = 1.2;
  const b = 0.75;
  const docLength = chunk.tokens.length || 1;
  const avgDocLength = corpusStats.avgDocLength || 1;
  let score = 0;

  for (const token of queryTokens) {
    const frequency = tf.get(token) || 0;
    if (!frequency) continue;

    const df = corpusStats.docFreq.get(token) || 0;
    const idf = Math.log(1 + (corpusStats.totalDocs - df + 0.5) / (df + 0.5));
    const numerator = frequency * (k1 + 1);
    const denominator = frequency + k1 * (1 - b + b * (docLength / avgDocLength));
    score += idf * (numerator / denominator);
  }

  return score;
}

function phraseBoost(questionText, chunk) {
  let boost = 0;

  if (chunk.sectionText.includes(questionText)) boost += 4;
  if (chunk.titleText.includes(questionText)) boost += 3;
  if (chunk.contentText.includes(questionText)) boost += 2;

  return boost;
}

function fieldBoost(queryTokens, chunk) {
  let score = 0;
  const titleSet = new Set(tokenize(chunk.title));
  const sectionSet = new Set(tokenize(chunk.section_title));
  const departmentSet = new Set(tokenize(chunk.department));

  for (const token of queryTokens) {
    if (titleSet.has(token)) score += 1.4;
    if (sectionSet.has(token)) score += 1.8;
    if (departmentSet.has(token)) score += 0.8;
    if (chunk.contentText.includes(token)) score += 0.25;
  }

  return score;
}

function docDiversityPenalty(selectedChunks, candidate) {
  const sameDocCount = selectedChunks.filter((item) => item.document_id === candidate.document_id).length;
  return sameDocCount * 1.2;
}

function formatRetrievalDebug(question, queryTokens, contextChunks) {
  return {
    question,
    query_tokens: queryTokens,
    selected_chunks: contextChunks.map((chunk) => ({
      score: chunk.score,
      document_id: chunk.document_id,
      title: chunk.title,
      version: chunk.version,
      section_id: chunk.section_id,
      section_title: chunk.section_title
    }))
  };
}

function formatTimestamp(date = new Date()) {
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

function toPercent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function lastSevenDays(entries) {
  const today = new Date();
  const labels = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    labels.push({
      key,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: 0
    });
  }

  for (const entry of entries) {
    const key = String(entry.timestamp || '').slice(0, 10);
    const target = labels.find((label) => label.key === key);
    if (target) target.value += 1;
  }

  return labels.map(({ day, value }) => ({ day, value }));
}

function buildDashboardSummary(entries, documents) {
  const total = entries.length;
  const answered = entries.filter((entry) => entry.answer_status === 'answered').length;
  const insufficient = entries.filter((entry) => entry.answer_status === 'insufficient_evidence').length;
  const negativeFeedback = entries.filter((entry) => entry.feedback === 'negative').length;
  const citationRate = toPercent(entries.filter((entry) => (entry.citations || []).length > 0).length, total);
  const groundedRate = toPercent(answered, total);
  const lowConfidenceCount = entries.filter((entry) => entry.confidence === 'low').length;
  const retrievalHitRate = toPercent(entries.filter((entry) => (entry.retrieval_debug?.selected_chunks || []).length > 0).length, total);

  const docStats = new Map(
    documents.map((doc) => [doc.document_id, {
      name: `${doc.document_id} ${doc.title_ko}`,
      version: `v${doc.version}`,
      citations: 0,
      failures: 0
    }])
  );

  for (const entry of entries) {
    for (const citation of entry.citations || []) {
      const target = docStats.get(citation.document_id);
      if (target) target.citations += 1;
    }

    if (entry.answer_status !== 'answered') {
      const firstChunk = entry.retrieval_debug?.selected_chunks?.[0];
      if (firstChunk && docStats.has(firstChunk.document_id)) {
        docStats.get(firstChunk.document_id).failures += 1;
      }
    }
  }

  const sortedDocs = [...docStats.entries()]
    .map(([documentId, stats]) => ({
      documentId,
      ...stats
    }))
    .sort((a, b) => (b.citations + b.failures) - (a.citations + a.failures))
    .slice(0, 3)
    .map((item, index) => ({
      name: item.name,
      badge: index === 0 ? 'Top Referenced' : item.failures > item.citations ? 'Needs Coverage' : 'Stable',
      tone: index === 0 ? 'good' : item.failures > item.citations ? 'warn' : 'neutral',
      citations: item.citations,
      failures: item.failures,
      version: item.version
    }));

  const reviewQueue = entries
    .filter((entry) => entry.answer_status !== 'answered' || entry.confidence === 'low' || entry.feedback === 'negative')
    .slice(-5)
    .reverse()
    .map((entry) => ({
      question: entry.question,
      status: entry.feedback === 'negative'
        ? 'Negative Feedback'
        : entry.answer_status === 'insufficient_evidence'
          ? '문서 추가 후보'
          : '리뷰 필요',
      severity: entry.feedback === 'negative'
        ? 'bad'
        : entry.answer_status === 'insufficient_evidence'
          ? 'warn'
          : 'review',
      meta: `${entry.timestamp} · ${entry.answer_status} · ${entry.retrieval_debug?.selected_chunks?.[0]?.document_id || 'No match'}`
    }));

  const indexStatus = documents.slice(0, 6).map((doc) => {
    const stats = docStats.get(doc.document_id);
    const needsCoverage = stats ? stats.failures > stats.citations : false;
    return {
      documentId: doc.document_id,
      title: doc.title_ko,
      state: 'Indexed',
      stateTone: needsCoverage ? 'warn' : 'indexed',
      version: `v${doc.version}`,
      nextAction: needsCoverage ? '검색 품질 보강 필요' : '정상 운영 중'
    };
  });

  return {
    lastUpdated: formatTimestamp(),
    mode: total > 0 ? 'live' : 'empty',
    kpis: [
      {
        label: '총 질문 수',
        value: String(total),
        delta: total > 0 ? '실제 로그 기반' : '아직 로그 없음',
        deltaTone: total > 0 ? 'up' : 'warn'
      },
      {
        label: '답변 성공률',
        value: `${groundedRate}%`,
        delta: `${answered} / ${total || 0} answered`,
        deltaTone: groundedRate >= 70 ? 'up' : 'warn'
      },
      {
        label: '근거 부족 비율',
        value: `${toPercent(insufficient, total)}%`,
        delta: `${insufficient}건 insufficient_evidence`,
        deltaTone: insufficient <= Math.max(1, Math.floor(total * 0.2)) ? 'up' : 'warn'
      },
      {
        label: '부정 피드백',
        value: `${toPercent(negativeFeedback, total)}%`,
        delta: negativeFeedback > 0 ? `${negativeFeedback}건 검토 필요` : '아직 없음',
        deltaTone: negativeFeedback > 0 ? 'warn' : 'up'
      }
    ],
    dailyQuestions: lastSevenDays(entries),
    qualityScores: [
      { label: 'Citation Attachment', value: citationRate },
      { label: 'Grounded Answer Rate', value: groundedRate },
      { label: 'Low Confidence Share', value: Math.max(0, 100 - toPercent(lowConfidenceCount, total)) },
      { label: 'Retrieval Hit Rate', value: retrievalHitRate }
    ],
    documentCoverage: sortedDocs,
    reviewQueue,
    indexStatus
  };
}

function retrieveContext(question, documents) {
  const chunks = buildChunks(documents);
  const corpusStats = buildCorpusStats(chunks);
  const questionText = compactText(question);
  const queryTokens = expandTokens(tokenize(question)).map((token) => compactText(token));
  const uniqueQueryTokens = [...new Set(queryTokens)].filter(Boolean);

  const ranked = chunks
    .map((chunk) => {
      const lexical = bm25Score(uniqueQueryTokens, chunk, corpusStats);
      const boosted = fieldBoost(uniqueQueryTokens, chunk);
      const phrase = phraseBoost(questionText, chunk);
      const score = lexical + boosted + phrase;

      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0.5)
    .sort((a, b) => b.score - a.score);

  const selected = [];
  for (const candidate of ranked) {
    const adjustedScore = candidate.score - docDiversityPenalty(selected, candidate);
    if (adjustedScore <= 0) continue;

    selected.push({
      score: Number(adjustedScore.toFixed(3)),
      document_id: candidate.document_id,
      title: candidate.title,
      version: candidate.version,
      department: candidate.department,
      section_id: candidate.section_id,
      section_title: candidate.section_title,
      content: candidate.content
    });

    if (selected.length >= 4) break;
  }

  return {
    queryTokens: uniqueQueryTokens,
    contextChunks: selected
  };
}

function buildMessages(question, contextChunks) {
  const context = contextChunks.map((chunk, index) => {
    return [
      `Context ${index + 1}`,
      `Document ID: ${chunk.document_id}`,
      `Title: ${chunk.title}`,
      `Version: ${chunk.version}`,
      `Section: ${chunk.section_title}`,
      `Content: ${chunk.content}`
    ].join('\n');
  }).join('\n\n');

  return [
    {
      role: 'system',
      content: [
        'You are a pharmaceutical SOP Q&A assistant.',
        'Answer only from the provided context.',
        'If the context is insufficient, say so clearly.',
        'Return concise Korean output in JSON with keys: answer_status, answer, evidence_summary, citations, confidence.',
        'Each citation item must include document_id, title, version, section_title.'
      ].join(' ')
    },
    {
      role: 'user',
      content: [
        `Question: ${question}`,
        '',
        'Context:',
        context || 'No relevant context found.'
      ].join('\n')
    }
  ];
}

async function callOpenAI(question, contextChunks) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing.');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: buildMessages(question, contextChunks)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response did not include message content.');
  }

  return JSON.parse(content);
}

async function handleGetFeedback(_req, res) {
  try {
    await ensureFeedbackLogFile();
    const raw = await readFile(FEEDBACK_LOG_PATH, 'utf8');
    const payload = JSON.parse(raw);
    return json(res, 200, payload);
  } catch (error) {
    return json(res, 500, { error: 'feedback_read_failed', message: error.message });
  }
}

async function handleFeedback(req, res) {
  try {
    const rawBody = await new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 100_000) {
          reject(new Error('Request body too large.'));
          req.destroy();
        }
      });
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });

    const payload = rawBody ? JSON.parse(rawBody) : {};

    const VALID_RATINGS = ['positive', 'negative'];
    const VALID_REASONS = ['부정확한 답변', '정보 부족', '출처 불일치', '기타', null];

    const rating = payload.rating;
    if (!VALID_RATINGS.includes(rating)) {
      return json(res, 400, { error: 'rating must be "positive" or "negative"' });
    }

    const negative_reason = payload.negative_reason ?? null;
    if (!VALID_REASONS.includes(negative_reason)) {
      return json(res, 400, { error: 'invalid negative_reason value' });
    }

    const entry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      question: String(payload.question || '').slice(0, 500),
      answer: String(payload.answer || '').slice(0, 100),
      referenced_sops: Array.isArray(payload.referenced_sops) ? payload.referenced_sops.slice(0, 20) : [],
      rating,
      negative_reason,
      comment: payload.comment ? String(payload.comment).slice(0, 1000) : null
    };

    await appendFeedbackLog(entry);
    return json(res, 200, { ok: true, id: entry.id });
  } catch (error) {
    return json(res, 500, { error: 'feedback_save_failed', message: error.message });
  }
}

async function handleDashboard(_req, res) {
  try {
    const [entries, docPayload] = await Promise.all([
      readChatLog(),
      readJson('data/documents/sop-documents.json')
    ]);

    return json(res, 200, buildDashboardSummary(entries, docPayload.documents || []));
  } catch (error) {
    return json(res, 500, {
      error: 'dashboard_summary_failed',
      message: error.message
    });
  }
}

async function handleChat(req, res) {
  try {
    const rawBody = await new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1_000_000) {
          reject(new Error('Request body too large.'));
          req.destroy();
        }
      });
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });

    const payload = rawBody ? JSON.parse(rawBody) : {};
    const question = String(payload.question || '').trim();
    if (!question) {
      return json(res, 400, { error: 'question is required' });
    }

    const docPayload = await readJson('data/documents/sop-documents.json');
    const documents = docPayload.documents || [];
    const retrieval = retrieveContext(question, documents);
    const { queryTokens, contextChunks } = retrieval;
    const retrievalDebug = formatRetrievalDebug(question, queryTokens, contextChunks);

    if (contextChunks.length === 0) {
      const noAnswerPayload = {
        answer_status: 'insufficient_evidence',
        answer: '현재 탑재된 SOP 문서에서 질문과 직접 연결되는 근거를 찾지 못했습니다. 질문을 더 구체화하거나 관련 SOP를 추가해 주세요.',
        evidence_summary: '검색된 관련 문서 구간이 없습니다.',
        citations: [],
        confidence: 'low',
        retrieval_debug: retrievalDebug
      };
      await appendChatLog({
        timestamp: new Date().toISOString(),
        question,
        answer_status: noAnswerPayload.answer_status,
        confidence: noAnswerPayload.confidence,
        citations: noAnswerPayload.citations,
        retrieval_debug: noAnswerPayload.retrieval_debug,
        feedback: null
      });
      return json(res, 200, noAnswerPayload);
    }

    const result = await callOpenAI(question, contextChunks);
    await appendChatLog({
      timestamp: new Date().toISOString(),
      question,
      answer_status: result.answer_status || 'answered',
      confidence: result.confidence || 'medium',
      citations: result.citations || [],
      retrieval_debug: retrievalDebug,
      feedback: null
    });
    return json(res, 200, {
      ...result,
      retrieval_debug: retrievalDebug
    });
  } catch (error) {
    return json(res, 500, {
      error: 'chat_request_failed',
      message: error.message
    });
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(__dirname, pathname);
  if (!filePath.startsWith(__dirname)) {
    return text(res, 403, 'Forbidden');
  }

  try {
    const content = await readFile(filePath);
    const ext = path.extname(filePath);
    text(res, 200, content, MIME_TYPES[ext] || 'application/octet-stream');
  } catch {
    text(res, 404, 'Not Found');
  }
}

await loadEnvFile();

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    return handleChat(req, res);
  }

  if (req.method === 'GET' && req.url === '/api/feedback') {
    return handleGetFeedback(req, res);
  }

  if (req.method === 'POST' && req.url === '/api/feedback') {
    return handleFeedback(req, res);
  }

  if (req.method === 'GET' && req.url === '/api/dashboard') {
    return handleDashboard(req, res);
  }

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  return text(res, 405, 'Method Not Allowed');
});

server.listen(PORT, HOST, () => {
  console.log(`SOP Q&A server running at http://${HOST}:${PORT}`);
});
