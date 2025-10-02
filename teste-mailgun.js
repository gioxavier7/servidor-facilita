require('dotenv').config(); // <-- garante que as ENVs do .env são carregadas
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mg = new Mailgun(formData).client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY, // precisa estar definido no .env
  url: process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net',
});

(async () => {
  try {
    const res = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `FACILITA <postmaster@${process.env.MAILGUN_DOMAIN}>`,
      to: 'devgioxavier@gmail.com', // teste: sem "Nome <...>"
      subject: `Teste local ${Date.now()}`,
      text: 'Funcionou local!',
    });
    console.log('OK:', res);
  } catch (e) {
    console.error('ERR:', e.status, e.message, e.details);
  }
})();
