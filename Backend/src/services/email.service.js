const nodemailer = require('nodemailer');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

async function sendRegistrationOtp(email, otp) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    throw new AppError(
      503,
      'Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in Backend/.env.',
      'EMAIL_NOT_CONFIGURED'
    );
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Your Student Feedback registration code',
      text: `Your one-time registration code is ${otp}. It expires in ${env.REGISTRATION_OTP_MINUTES} minutes. If you did not request this, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#263746"><h2>Verify your email</h2><p>Use this one-time code to complete your Student Feedback account registration:</p><div style="font-size:30px;font-weight:bold;letter-spacing:8px;padding:18px;background:#EAE0C8;text-align:center;border-radius:8px">${otp}</div><p>This code expires in ${env.REGISTRATION_OTP_MINUTES} minutes and can only be used once.</p><p>If you did not request this, ignore this email.</p></div>`
    });
  } catch (error) {
    console.error('Registration OTP email delivery failed:', error.message);
    throw new AppError(503, 'Could not send the email code. Check SMTP settings and try again.', 'EMAIL_DELIVERY_FAILED');
  } finally {
    transporter.close();
  }
}

module.exports = { sendRegistrationOtp };
