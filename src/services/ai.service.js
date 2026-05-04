const Groq = require('groq-sdk');

// Lazy client
let _client = null;
const getClient = () => {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Missing GROQ_API_KEY');
    }
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
};

// Model
const MODEL = 'llama-3.3-70b-versatile';

// Improved system prompt (focused on clarity + exams)
const MEDICAL_SYSTEM_PROMPT = `
You are MedicoHub AI, an expert MBBS-level medical assistant.

Guidelines:
- Explain in simple, clear language
- Be concise but complete
- Use bullet points when helpful
- Highlight high-yield exam points clearly
- Structure answers when relevant:
  Definition → Cause → Mechanism → Symptoms → Diagnosis → Treatment
- Avoid unnecessary complexity
`;

// Core chat function
const chat = async (messages, maxTokens = 1024, temperature = 0.3) => {
  try {
    const res = await getClient().chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    if (!res?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Groq API');
    }

    return res.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq Error:', err.message);
    throw new Error('AI service temporarily unavailable');
  }
};


// =========================
// FEATURES
// =========================

// 1. Exam Pack (now plain text)
const generateExamPack = async (subject, packType) => {
  const prompt = `
Create a ${packType} exam preparation guide for ${subject}.

Include:
- Important topics (mark high-yield clearly)
- Easy mnemonics
- Previous year question patterns
- Practical exam tips

Keep it structured and easy to revise.
`;

  return await chat([
    { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 1200);
};


// 2. Viva Question (plain text)
const generateVivaQA = async (subject) => {
  const prompt = `
Give one high-yield viva question from ${subject} and a clear, examiner-level answer.

Keep it crisp and structured.
`;

  return await chat([
    { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 600);
};


// 3. Ask Question (main chatbot)
const askQuestion = async (question, subject, history = []) => {
  const messages = [
    { role: 'system', content: MEDICAL_SYSTEM_PROMPT },

    // Correct history mapping
    ...history.slice(-10).flatMap(h => [
      { role: 'user', content: h.userMessage },
      { role: 'assistant', content: h.aiResponse },
    ]),

    {
      role: 'user',
      content: subject ? `[${subject}] ${question}` : question,
    },
  ];

  return await chat(messages, 1000);
};


// Export
module.exports = {
  generateExamPack,
  generateVivaQA,
  askQuestion,
};