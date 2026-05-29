const express = require('express');
const { handleWebhook, verifyWebhook } = require('./handlers/webhook');
const { analyzeMessage } = require('./services/gemini');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/webhook', verifyWebhook);
app.post('/webhook', handleWebhook);

app.post('/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });
    const result = await analyzeMessage(message, '');
    return res.json({ response: result.response });
  } catch (err) {
    console.error('Erro no chat IA:', err.message);
    return res.status(500).json({ response: 'Desculpe, ocorreu um erro. Tente novamente.' });
  }
});

app.get('/', (req, res) => res.json({ status: 'Economiz.ai backend online' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Backend rodando na porta ' + PORT));
