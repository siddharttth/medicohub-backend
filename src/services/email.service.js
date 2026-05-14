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

exports.sendOtp = async (email, name, otp) => {
  await send(
    email,
    'Your MedicoHub OTP Code',
    `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a122b;color:#e1e3e4;padding:32px;border-radius:12px;">
      <h2 style="color:#cfbcff;margin-bottom:8px;">Verify Your Email</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Use the OTP below to complete your MedicoHub registration. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#1a2340;border:2px solid #cfbcff;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
        <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#cfbcff;">${otp}</span>
      </div>
      <p style="color:#948e9d;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`
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
