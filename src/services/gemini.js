const fetch = require('node-fetch');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Você é o Economiz.ai, assistente financeiro pessoal inteligente e empático. Seu objetivo é ajudar o usuário a melhorar sua vida financeira de forma prática e motivadora.

Você é especialista em:
- Análise de gastos e orçamento pessoal
- Educação financeira (juros compostos, CDI, Selic, inflação, IPCA)
- Investimentos (Tesouro Direto, CDB, LCI/LCA, ações, FIIs, ETFs, criptomoedas)
- Planejamento de metas e aposentadoria
- Estratégias de economia e corte de gastos
- Regra 50/30/20, método envelope, reserva de emergência

REGRAS IMPORTANTES:
1. Sempre responda em português do Brasil
2. Seja direto, prático e use exemplos numéricos reais
3. Quando tiver dados de gastos do usuário, analise-os profundamente e dê conselhos PERSONALIZADOS
4. Se o usuário pedir para analisar gastos, identifique padrões, excessos e sugestões de corte específicas
5. Use emojis com moderação para tornar a conversa amigável
6. Máximo 6 parágrafos por resposta, seja objetivo
7. Nunca invente dados que o usuário não forneceu
8. Mencione as abas do app quando relevante: "Gastos", "Metas", "Investimentos"`;

async function analyzeMessage(userMessage, context = '', mode = 'chat') {
  let fullPrompt = SYSTEM_PROMPT;

  if (context) {
    fullPrompt += `\n\nDADOS FINANCEIROS DO USUÁRIO:\n${context}`;
  }

  fullPrompt += `\n\nMensagem do usuário: ${userMessage}`;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = raw.replace(/```json|```/g, '').trim();

  if (mode === 'whatsapp') {
    try {
      return JSON.parse(clean);
    } catch {
      return {
        intent: 'FINANCIAL_TIP',
        data: {},
        response: clean || 'Desculpe, ocorreu um erro. Tente novamente!'
      };
    }
  }

  return {
    intent: 'FINANCIAL_TIP',
    data: {},
    response: clean || 'Desculpe, não consegui processar sua pergunta. Tente novamente!'
  };
}

module.exports = { analyzeMessage };
