const { processMessage } = require('../services/messageProcessor');
const { sendMessage } = require('../services/whatsapp');

// Meta exige essa verificação ao configurar o webhook
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function handleWebhook(req, res) {
  // Responde 200 imediatamente (Meta exige resposta rápida)
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Ignora status de entrega (só processa mensagens)
    if (!value?.messages) return;

    const message = value.messages[0];
    const phone = message.from; // Número do usuário (ex: 5511999999999)
    const messageId = message.id;

    // Só processa texto por enquanto
    if (message.type !== 'text') {
      await sendMessage(phone, '⚠️ Por enquanto só entendo mensagens de texto. Digite sua dúvida ou gasto em palavras.');
      return;
    }

    const text = message.text.body.trim();
    console.log(`📩 Mensagem de ${phone}: ${text}`);

    // Processa e responde
    const response = await processMessage(phone, text, messageId);
    if (response) {
      await sendMessage(phone, response);
    }

  } catch (err) {
    console.error('Erro no webhook:', err.message);
  }
}

module.exports = { verifyWebhook, handleWebhook };
