const nodemailer = require('nodemailer');

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    family: 4, // force IPv4 — Render does not support IPv6 outbound
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

const send = async (to, subject, html) => {
  if (process.env.NODE_ENV === 'test') return;
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"MedicoHub" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

exports.sendWelcome = async (user) => {
  await send(
    user.email,
    'Welcome to MedicoHub!',
    `<h2>Hi ${user.name}!</h2>
     <p>Welcome to <strong>MedicoHub</strong> — your medical study companion.</p>
     <p>Start exploring notes, generate exam packs, and join the community drops.</p>
     <p>Happy studying!</p>`
  );
};

exports.sendPasswordReset = async (user, rawToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  await send(
    user.email,
    'Reset Your MedicoHub Password',
    `<h2>Password Reset Request</h2>
     <p>Hi ${user.name},</p>
     <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
     <a href="${resetUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
       Reset Password
     </a>
     <p>If you did not request this, ignore this email.</p>`
  );
};

exports.sendNoteApproved = async (user, note) => {
  await send(
    user.email,
    'Your note has been approved!',
    `<h2>Note Approved</h2>
     <p>Hi ${user.name},</p>
     <p>Great news! Your note <strong>"${note.title}"</strong> has been approved and is now live on MedicoHub.</p>
     <p>Thank you for contributing to the community!</p>`
  );
};

exports.sendNoteRequest = async (user, noteRequest) => {
  await send(
    user.email,
    'New Note Request on MedicoHub',
    `<h2>Note Request</h2>
     <p>Hi ${user.name},</p>
     <p>A student has requested a note: <strong>${noteRequest.topic}</strong> (${noteRequest.subject})</p>
     <p>If you can help, please upload on MedicoHub!</p>`
  );
};

exports.sendDailyReminder = async (user) => {
  await send(
    user.email,
    `Don't break your ${user.streakDays}-day streak! 🔥`,
    `<h2>Keep your streak alive!</h2>
     <p>Hi ${user.name},</p>
     <p>You have a <strong>${user.streakDays}-day streak</strong> going. Don't let it end today!</p>
     <p>Log in to MedicoHub, complete a topic, or join the drops to keep it going.</p>
     <a href="${process.env.FRONTEND_URL}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
       Study Now
     </a>
     <p style="margin-top:16px;font-size:12px;color:#888;">
       To turn off reminders, update your notification settings in the app.
     </p>`
  );
};
