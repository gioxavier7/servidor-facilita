const nodemailer = require('nodemailer');

const enviarEmail = async (destinatario, link) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false, // porta 587 usa STARTTLS
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
      subject: 'Recuperação de senha',
      html: `<p>Clique <a href='${link}'>aqui</a> para redefinir sua senha.</p>`
    });

    console.log('E-mail enviado com sucesso:', info.messageId);
    return info;
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    return null
  }
};

module.exports = enviarEmail;
