const Groq = require('groq-sdk');

let _client = null;
const getClient = () => {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
};

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are MedicoHub AI, a precise medical exam coach for MBBS students.
You generate strictly topic-specific, exam-oriented content.
Never produce generic textbook content. Always stay within the provided topics.
Simulate real university/professional exam patterns (university-style MCQs, viva style of an examiner, etc).
Return ONLY valid JSON — no markdown, no explanation, no extra text.`;

const chat = (messages, maxTokens = 2048) =>
  getClient().chat.completions.create({ model: MODEL, max_tokens: maxTokens, messages });

const parseJSON = (raw) => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI did not return valid JSON');
  return JSON.parse(match[0]);
};

// ── Full Pack (100-mark exam style) ─────────────────────────────────────────
const generateFullPack = async (subject, topics) => {
  const topicList = topics.join(', ');
  const prompt = `Generate a 100-mark university exam pack for ${subject}.
ONLY cover these topics: ${topicList}

Return JSON with exactly this structure:
{
  "mcqs": [
    { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A" }
  ],
  "shortQuestions": [
    { "question": "...", "answer": "..." }
  ],
  "longQuestions": ["question text only, no answer"]
}

Rules:
- mcqs: exactly 10 items, each 1 mark, real MCQ style
- shortQuestions: exactly 10 items, each 5 marks, concise answers (3-5 lines)
- longQuestions: exactly 10 items, each 10 marks, question text only (student self-practices)
- Every question must come directly from one of these topics: ${topicList}
- No generic questions — must feel like real university paper`;

  const res = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 3000);
  return parseJSON(res.choices[0].message.content);
};

// ── Quick Review Pack ────────────────────────────────────────────────────────
const generateQuickReview = async (subject, topics) => {
  const topicList = topics.join(', ');
  const prompt = `Generate a quick revision pack for ${subject} exam.
ONLY cover these topics: ${topicList}

Return JSON:
{
  "reviewQuestions": [
    { "question": "...", "answer": "..." }
  ]
}

Rules:
- exactly 15 short questions with concise answers (2-3 lines each)
- Focus on high-yield, frequently asked points
- Questions must come strictly from: ${topicList}`;

  const res = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 2500);
  return parseJSON(res.choices[0].message.content);
};

// ── Viva Only Pack ───────────────────────────────────────────────────────────
const generateVivaPack = async (subject, topics) => {
  const topicList = topics.join(', ');
  const prompt = `Generate a viva voce pack for ${subject}.
ONLY cover these topics: ${topicList}

Return JSON:
{
  "vivaQuestions": [
    { "question": "...", "answer": "..." }
  ]
}

Rules:
- exactly 15 viva-style questions (direct, short, examiner-style)
- Answers must be crisp (1-3 lines, as a student would answer in a viva)
- Questions must come strictly from: ${topicList}
- Simulate what an MBBS examiner would ask face-to-face`;

  const res = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 2500);
  return parseJSON(res.choices[0].message.content);
};

// ── Single Viva Practice Question ────────────────────────────────────────────
const generateVivaQA = async (subject, topics) => {
  const topicContext = topics && topics.length > 0
    ? `Topics: ${topics.join(', ')}`
    : `Subject: ${subject}`;

  const prompt = `Generate one viva voce question and answer for ${subject}.
${topicContext}

Return JSON: { "question": "...", "answer": "..." }

Rules:
- One direct examiner-style question
- Answer in 2-4 lines as a student would say in a viva
- Must come strictly from the given topics`;

  const res = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 512);
  return parseJSON(res.choices[0].message.content);
};

// ── Drops AI chat ────────────────────────────────────────────────────────────
const askQuestion = async (question, subject, history = []) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).flatMap((h) => [
      { role: 'user', content: h.aiMessage },
      { role: 'assistant', content: h.aiResponse },
    ]),
    { role: 'user', content: subject ? `[${subject}] ${question}` : question },
  ];
  const res = await chat(messages, 1024);
  return res.choices[0].message.content;
};

// ── Legacy wrapper (kept for any old callers) ────────────────────────────────
const generateExamPack = async (subject, packType, topics = []) => {
  if (packType === 'full-pack') return generateFullPack(subject, topics);
  if (packType === 'quick-review') return generateQuickReview(subject, topics);
  if (packType === 'viva-only') return generateVivaPack(subject, topics);
  return generateFullPack(subject, topics);
};

module.exports = {
  generateExamPack,
  generateFullPack,
  generateQuickReview,
  generateVivaPack,
  generateVivaQA,
  askQuestion,
};
