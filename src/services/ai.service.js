const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// llama-3.3-70b-versatile is Groq's best general model — fast and accurate
const MODEL = 'llama-3.3-70b-versatile';

const MEDICAL_SYSTEM_PROMPT = `You are MedicoHub AI, an expert medical education assistant for MBBS students.
You provide accurate, evidence-based answers about medical subjects including Anatomy, Physiology,
Biochemistry, Pathology, Pharmacology, Microbiology, and clinical subjects.
Format responses clearly with bullet points where appropriate.
Keep answers concise but thorough. Always mention if a topic is high-yield for exams.`;

const chat = (messages, maxTokens = 1024) =>
  client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages,
  });

const generateExamPack = async (subject, packType) => {
  const prompt = `Generate a comprehensive ${packType} exam preparation pack for ${subject}.
Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "topics": [{"id": "1", "title": "Topic name", "yield": "high|medium|low"}],
  "mnemonics": ["mnemonic1", "mnemonic2"],
  "pyqs": [{"year": 2023, "marks": 10, "type": "long answer|short answer|MCQ"}],
  "tips": "General exam tips for this subject"
}
Include 10-15 topics, 5-8 mnemonics, and 5-10 PYQs.`;

  const res = await chat([
    { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 2048);

  const raw = res.choices[0].message.content;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Groq did not return valid JSON for exam pack');
  return JSON.parse(jsonMatch[0]);
};

const generateVivaQA = async (subject) => {
  const prompt = `Generate one high-yield viva voce question and a comprehensive answer for ${subject}.
Return ONLY valid JSON (no markdown): {"question": "...", "answer": "..."}`;

  const res = await chat([
    { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 512);

  const raw = res.choices[0].message.content;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Groq did not return valid JSON for viva');
  return JSON.parse(jsonMatch[0]);
};

const askQuestion = async (question, subject, history = []) => {
  const messages = [
    { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
    ...history.slice(-10).flatMap(h => [
      { role: 'user', content: h.aiMessage },
      { role: 'assistant', content: h.aiResponse },
    ]),
    { role: 'user', content: subject ? `[${subject}] ${question}` : question },
  ];

  const res = await chat(messages, 1024);
  return res.choices[0].message.content;
};

module.exports = { generateExamPack, generateVivaQA, askQuestion };
