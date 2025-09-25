const nodemailer = require('nodemailer');

const enviarEmail = async (destinatario, codigo) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587, // porta padrão STARTTLS
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `'Suporte Facilita' <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: 'Recuperação de senha - OTP',
      html: `
        <p>Seu código de recuperação de senha é:</p>
        <h2>${codigo}</h2>
        <p>Este código expira em 15 minutos e só pode ser usado uma vez.</p>
      `
    });

    console.log('E-mail enviado com sucesso:', info.messageId);
    return info;
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    return null;
  }
};

module.exports = enviarEmail;
