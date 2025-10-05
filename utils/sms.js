// services/smsService.js
const twilio = require('twilio');

/**
 * Função para enviar SMS usando Twilio
 */
const enviarSMS = async (destinatario, codigo) => {
  try {
    // Validação das variáveis de ambiente
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Variáveis de ambiente do Twilio não configuradas');
    }

    // Configuração do cliente Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Mensagem do SMS
    const mensagem = `Seu código de recuperação Facilita é: ${codigo}. Válido por 15 minutos.`;

    // Envio do SMS
    const result = await client.messages.create({
      body: mensagem,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: destinatario
    });

    console.log("✅ SMS enviado com sucesso via Twilio! SID:", result.sid);
    return result;

  } catch (error) {
    console.error("❌ Erro ao enviar SMS via Twilio:", error);
    throw new Error("Erro ao enviar o código de recuperação por SMS.");
  }
};

module.exports = {
  enviarSMS
};