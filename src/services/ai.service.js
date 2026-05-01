const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MEDICAL_SYSTEM_PROMPT = `You are MedicoHub AI, an expert medical education assistant for MBBS students.
You provide accurate, evidence-based answers about medical subjects including Anatomy, Physiology,
Biochemistry, Pathology, Pharmacology, Microbiology, and clinical subjects.
Format responses clearly with bullet points where appropriate.
Keep answers concise but thorough. Always mention if a topic is high-yield for exams.`;

const generateExamPack = async (subject, packType) => {
  const prompt = `Generate a comprehensive ${packType} exam preparation pack for ${subject}.
Return a JSON object with this exact structure:
{
  "topics": [{"id": "1", "title": "Topic name", "yield": "high|medium|low"}],
  "mnemonics": ["mnemonic1", "mnemonic2"],
  "pyqs": [{"year": 2023, "marks": 10, "type": "long answer|short answer|MCQ"}],
  "tips": "General exam tips for this subject"
}
Include 10-15 topics, 5-8 mnemonics, and 5-10 PYQs.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: MEDICAL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
};

const generateVivaQA = async (subject) => {
  const prompt = `Generate one high-yield viva voce question and a comprehensive answer for ${subject}.
Return JSON: {"question": "...", "answer": "..."}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: MEDICAL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
};

const askQuestion = async (question, subject, history = []) => {
  const messages = [
    ...history.slice(-10).flatMap(h => [
      { role: 'user', content: h.aiMessage },
      { role: 'assistant', content: h.aiResponse },
    ]),
    { role: 'user', content: subject ? `[${subject}] ${question}` : question },
  ];

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: MEDICAL_SYSTEM_PROMPT,
    messages,
  });

  return message.content[0].text;
};

module.exports = { generateExamPack, generateVivaQA, askQuestion };
