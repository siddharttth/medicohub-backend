require('dotenv').config();
const Groq = require('groq-sdk');
const cloudinary = require('../config/cloudinary');
const nodemailer = require('nodemailer');

const ok = (label) => console.log(`  ✓ ${label}`);
const fail = (label, err) => console.error(`  ✗ ${label}: ${err.message}`);

async function testGroq() {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 50,
    messages: [{ role: 'user', content: 'Reply with just: OK' }],
  });
  const reply = res.choices[0].message.content.trim();
  ok(`Groq — model: llama-3.3-70b-versatile, reply: "${reply}"`);
}

async function testCloudinary() {
  let result;
  try {
    result = await cloudinary.api.ping();
  } catch (e) {
    // Cloudinary SDK rejects with a plain object, not an Error
    const errObj = e?.error || e;
    throw new Error(errObj?.message || JSON.stringify(errObj));
  }
  ok(`Cloudinary — cloud: ${process.env.CLOUDINARY_CLOUD_NAME}, status: ${result.status}`);
}

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.verify();
  ok(`SMTP — host: ${process.env.SMTP_HOST}, user: ${process.env.SMTP_USER}`);
}

(async () => {
  console.log('\nTesting integrations...\n');

  await testGroq().catch(e => fail('Groq', e));
  await testCloudinary().catch(e => fail('Cloudinary', e));
  await testSMTP().catch(e => fail('SMTP', e));

  console.log('\nDone.\n');
  process.exit(0);
})();
