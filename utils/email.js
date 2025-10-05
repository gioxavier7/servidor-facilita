const formData = require('form-data');
const Mailgun = require('mailgun.js');

/**
 * função para enviar e-mail usando Mailgun
 */
const enviarEmail = async (destinatario, assunto, conteudo) => {
  try {
    //config mailgun
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });

    //dados do email
    const data = {
      from: process.env.MAILGUN_FROM || "Facilita <no-reply@facilita.site>",
      to: [destinatario],
      subject: assunto,
      text: conteudo.text,
      html: conteudo.html,
    };

    //envio via API do mailgun
    const result = await mg.messages.create("facilita.site", data);
    
    console.log("✅ E-mail enviado com sucesso via Mailgun! ID:", result.id);
    return result;
    
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail via Mailgun:", error);
    throw new Error("Erro ao enviar o e-mail de recuperação.");
  }
};

/**
 * template HTML para o código OTP
 */
const buildOtpHtml = (codigo) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #019D31; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { 
          background: #019D31; 
          color: white; 
          padding: 15px; 
          font-size: 32px; 
          font-weight: bold; 
          text-align: center; 
          letter-spacing: 8px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .warning { 
          background: #FEF3C7; 
          color: #92400E; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 20px 0;
          border-left: 4px solid #F59E0B;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #ddd; 
          color: #666; 
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Recuperação de Senha</h1>
      </div>
      <div class="content">
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Use o código abaixo para continuar:</p>
        
        <div class="code">${codigo}</div>
        
        <div class="warning">
          <strong>⚠️ Importante:</strong> 
          Este código é válido por <strong>15 minutos</strong>. 
          Não compartilhe este código com ninguém.
        </div>
        
        <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
        
        <div class="footer">
          <p>Equipe Facilita<br>
          <small>Este é um e-mail automático, por favor não responda.</small></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  enviarEmail,
  buildOtpHtml
};