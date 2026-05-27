const express = require('express');
const { handleWebhook, verifyWebhook } = require('./handlers/webhook');

const app = express();
app.use(express.json());

// Verificação do webhook (Meta exige isso na configuração)
app.get('/webhook', verifyWebhook);

// Recebe mensagens do WhatsApp
app.post('/webhook', handleWebhook);

// Health check
app.get('/', (req, res) => res.json({ status: 'FinBot online ✅' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FinBot rodando na porta ${PORT}`));
