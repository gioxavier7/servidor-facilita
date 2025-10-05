// services/email.js
const formData = require('form-data');     // v4
const Mailgun = require('mailgun.js');     // v11

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net', // use https://api.eu.mailgun.net se seu domínio for EU
});

function buildOtpHtml(codigo) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <h2 style="margin:0 0 12px;color:#990410">FACILITA</h2>
    <p>Use o código abaixo para redefinir sua senha (válido por 15 minutos):</p>
    <div style="font-size:28px;letter-spacing:4px;font-weight:700;text-align:center;margin:16px 0">${codigo}</div>
    <p style="color:#666;font-size:12px">Se você não solicitou, ignore este email.</p>
  </div>`;
}

async function enviarEmail(to, subject, { text, html }) {
  const domain = process.env.MAILGUN_DOMAIN; // sandbox ou seu domínio verificado
  if (!domain) throw new Error('MAILGUN_DOMAIN não definido');
  return mg.messages.create(domain, {
    from: `FACILITA <no-reply@${domain}>`,   // no sandbox você pode usar o postmaster do sandbox
    to,
    subject,
    text,
    html,
  });
}

module.exports = { enviarEmail, buildOtpHtml };
