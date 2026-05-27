const fetch = require('node-fetch');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Você é o FinBot, assistente financeiro pessoal via WhatsApp. Seu tom é amigável, direto e motivador. Você ajuda pessoas a controlar gastos, criar metas e aprender sobre finanças.

Ao receber uma mensagem do usuário, responda APENAS com JSON válido no formato abaixo. Não adicione texto fora do JSON.

{
  "intent": "INTENT",
  "data": { ... },
  "response": "Resposta amigável em português para o usuário"
}

Intents possíveis:
- "REGISTER_EXPENSE": usuário registrou um gasto. data: { amount: número, category: string, description: string }
  Categorias possíveis: alimentação, transporte, moradia, saúde, lazer, educação, vestuário, outros
  
- "VIEW_SUMMARY": usuário quer ver resumo dos gastos do mês. data: {}

- "SET_BUDGET": usuário quer definir orçamento mensal. data: { amount: número }

- "SET_GOAL": usuário quer criar uma meta de economia. data: { name: string, target_amount: número, deadline: string }

- "VIEW_GOALS": usuário quer ver suas metas. data: {}

- "FINANCIAL_TIP": usuário quer dica financeira ou fez pergunta educacional. data: {}

- "HELP": usuário quer saber o que o bot faz. data: {}

- "UNKNOWN": não entendeu. data: {}

Exemplos:
- "gastei 45 reais no ifood" → REGISTER_EXPENSE, amount: 45, category: "alimentação"
- "paguei uber 12" → REGISTER_EXPENSE, amount: 12, category: "transporte"
- "quanto gastei esse mês" → VIEW_SUMMARY
- "meu orçamento é 3000 reais" → SET_BUDGET, amount: 3000
- "quero economizar 1000 reais para viagem em dezembro" → SET_GOAL
- "como funciona juros compostos" → FINANCIAL_TIP

Para FINANCIAL_TIP, escreva uma resposta educativa, prática e com exemplo numérico quando aplicável. Máximo 4 parágrafos.`;

async function analyzeMessage(userMessage, context = '') {
  const prompt = context
    ? `Contexto do usuário: ${context}\n\nMensagem: ${userMessage}`
    : userMessage;

  const body = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT + '\n\n' + prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    }
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Remove possíveis markdown code blocks
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    return {
      intent: 'UNKNOWN',
      data: {},
      response: 'Não entendi bem. Tente: "gastei 50 no mercado", "ver resumo" ou "dica financeira" 😊'
    };
  }
}

module.exports = { analyzeMessage };
