const fetch = require('node-fetch');

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;

async function sendMessage(to, text) {
  try {
    const res = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Erro ao enviar mensagem:', JSON.stringify(data));
    }
    return data;
  } catch (err) {
    console.error('Falha no envio WhatsApp:', err.message);
  }
}

module.exports = { sendMessage };
