const { analyzeMessage } = require('./gemini');
const db = require('./database');
const { formatCurrency, formatSummary, formatGoals, welcomeMessage } = require('../utils/formatters');

async function processMessage(phone, text, messageId) {
  // Busca ou cria usuário
  const user = await db.getOrCreateUser(phone);

  // Primeiro acesso: onboarding
  if (!user.onboarded) {
    await db.updateUser(phone, { onboarded: true });
    return welcomeMessage();
  }

  // Contexto para a IA
  const context = user.monthly_budget
    ? `Orçamento mensal do usuário: R$ ${user.monthly_budget}`
    : 'Usuário ainda não definiu orçamento mensal';

  // Interpreta a mensagem com IA
  const parsed = await analyzeMessage(text, context);
  const { intent, data } = parsed;

  switch (intent) {

    case 'REGISTER_EXPENSE': {
      if (!data.amount || data.amount <= 0) {
        return '⚠️ Não consegui identificar o valor. Tente: "gastei 45 no mercado"';
      }

      await db.saveExpense(phone, {
        amount: data.amount,
        category: data.category || 'outros',
        description: data.description || text,
      });

      // Verifica se está próximo do limite
      const totals = await db.getTotalByCategory(phone);
      const totalMes = Object.values(totals).reduce((a, b) => a + b, 0);
      let alerta = '';

      if (user.monthly_budget > 0) {
        const pct = (totalMes / user.monthly_budget) * 100;
        if (pct >= 100) {
          alerta = `\n\n🚨 *Atenção!* Você ultrapassou seu orçamento mensal de ${formatCurrency(user.monthly_budget)}. Total gasto: ${formatCurrency(totalMes)}`;
        } else if (pct >= 80) {
          alerta = `\n\n⚠️ Você já usou ${Math.round(pct)}% do seu orçamento. Restam ${formatCurrency(user.monthly_budget - totalMes)}.`;
        }
      }

      return `${parsed.response}${alerta}`;
    }

    case 'VIEW_SUMMARY': {
      const expenses = await db.getMonthExpenses(phone);
      const totals = await db.getTotalByCategory(phone);
      return formatSummary(totals, expenses, user.monthly_budget);
    }

    case 'SET_BUDGET': {
      if (!data.amount || data.amount <= 0) {
        return '⚠️ Valor inválido. Tente: "meu orçamento é 2500 reais"';
      }
      await db.updateUser(phone, { monthly_budget: data.amount });
      return `✅ Orçamento mensal definido: *${formatCurrency(data.amount)}*\n\nAgora vou te avisar quando você atingir 80% e 100% do limite. 💪`;
    }

    case 'SET_GOAL': {
      if (!data.target_amount || data.target_amount <= 0) {
        return '⚠️ Não entendi o valor da meta. Tente: "quero economizar 500 reais para viagem"';
      }
      await db.saveGoal(phone, {
        name: data.name || 'Meta de economia',
        target_amount: data.target_amount,
        deadline: data.deadline || null,
      });
      return parsed.response;
    }

    case 'VIEW_GOALS': {
      const goals = await db.getGoals(phone);
      return formatGoals(goals);
    }

    case 'FINANCIAL_TIP':
    case 'HELP':
    case 'UNKNOWN':
    default:
      return parsed.response;
  }
}

module.exports = { processMessage };
