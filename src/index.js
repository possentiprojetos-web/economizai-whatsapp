const express = require('express');
const { createClient } = require('@supabase/supabase-js');
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

// ─── Chat de IA com contexto dos gastos do usuário ────────
app.post('/ai/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });

    let context = '';

    // Busca gastos do usuário se tiver userId
    if (userId && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, category, description, date')
          .eq('phone', userId)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false });

        const { data: user } = await supabase
          .from('users')
          .select('monthly_budget')
          .eq('phone', userId)
          .single();

        if (expenses && expenses.length > 0) {
          const total = expenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
          const byCategory = {};
          expenses.forEach(e => {
            byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
          });

          const categorySummary = Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, val]) => `  - ${cat}: R$ ${val.toFixed(2)}`)
            .join('\n');

          const recentExpenses = expenses.slice(0, 10)
            .map(e => `  - ${e.description} (${e.category}): R$ ${parseFloat(e.amount).toFixed(2)}`)
            .join('\n');

          const budget = user?.monthly_budget || 0;

          context = `Mês atual: ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
Total gasto no mês: R$ ${total.toFixed(2)}
${budget > 0 ? `Orçamento mensal: R$ ${budget.toFixed(2)}\nSaldo restante: R$ ${(budget - total).toFixed(2)}` : 'Orçamento: não definido'}

Gastos por categoria:
${categorySummary}

Últimos gastos registrados:
${recentExpenses}

Total de transações no mês: ${expenses.length}`;
        } else {
          context = 'O usuário ainda não registrou gastos este mês no app.';
        }
      } catch (e) {
        console.error('Erro ao buscar gastos:', e.message);
      }
    }

    const result = await analyzeMessage(message, context, 'chat');
    return res.json({ response: result.response });

  } catch (err) {
    console.error('Erro no chat IA:', err.message);
    return res.status(500).json({ response: 'Desculpe, ocorreu um erro. Tente novamente.' });
  }
});

app.get('/', (req, res) => res.json({ status: 'Economiz.ai backend online' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Backend rodando na porta ' + PORT));
