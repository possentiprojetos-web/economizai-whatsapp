const CATEGORY_EMOJI = {
  alimentação: '🍽️',
  transporte: '🚗',
  moradia: '🏠',
  saúde: '💊',
  lazer: '🎮',
  educação: '📚',
  vestuário: '👕',
  outros: '📦',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function welcomeMessage() {
  return `👋 Olá! Sou o *FinBot*, seu assistente financeiro pessoal!

Posso te ajudar a:
💰 Registrar gastos ("gastei 45 no mercado")
📊 Ver resumo mensal ("ver meus gastos")
🎯 Criar metas ("quero economizar 1000 para viagem")
📅 Definir orçamento ("meu orçamento é 3000 reais")
📚 Aprender sobre finanças ("como funciona juros compostos?")

Para começar, me diga: *qual é seu orçamento mensal?*
Exemplo: "meu orçamento é 2500 reais"`;
}

function formatSummary(totals, expenses, monthlyBudget) {
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const now = new Date();
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });

  if (expenses.length === 0) {
    return `📊 Nenhum gasto registrado em ${monthName} ainda.\n\nDigite "gastei [valor] em [descrição]" para começar!`;
  }

  let msg = `📊 *Resumo de ${monthName}*\n\n`;

  // Por categoria
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([cat, val]) => {
    const emoji = CATEGORY_EMOJI[cat] || '📦';
    const bar = buildBar(val, total);
    msg += `${emoji} ${capitalize(cat)}: *${formatCurrency(val)}* ${bar}\n`;
  });

  msg += `\n💸 *Total gasto: ${formatCurrency(total)}*`;

  if (monthlyBudget > 0) {
    const restante = monthlyBudget - total;
    const pct = Math.round((total / monthlyBudget) * 100);
    msg += `\n📋 Orçamento: ${formatCurrency(monthlyBudget)}`;
    if (restante >= 0) {
      msg += `\n✅ Disponível: *${formatCurrency(restante)}* (${pct}% usado)`;
    } else {
      msg += `\n🚨 Excedeu em: *${formatCurrency(Math.abs(restante))}*`;
    }
  }

  // Último gasto
  if (expenses.length > 0) {
    const last = expenses[0];
    const lastDate = new Date(last.date).toLocaleDateString('pt-BR');
    msg += `\n\n🕐 Último: ${CATEGORY_EMOJI[last.category] || '📦'} ${last.description} — ${formatCurrency(last.amount)} (${lastDate})`;
  }

  return msg;
}

function formatGoals(goals) {
  if (!goals || goals.length === 0) {
    return `🎯 Você ainda não tem metas criadas.\n\nCrie uma assim: "quero economizar 500 reais para viagem em dezembro"`;
  }

  let msg = `🎯 *Suas metas*\n\n`;
  goals.forEach((g, i) => {
    const pct = g.target_amount > 0
      ? Math.round((g.saved_amount / g.target_amount) * 100)
      : 0;
    const bar = buildBar(g.saved_amount, g.target_amount);
    msg += `${i + 1}. *${g.name}*\n`;
    msg += `   Meta: ${formatCurrency(g.target_amount)}\n`;
    msg += `   Guardado: ${formatCurrency(g.saved_amount)} ${bar} ${pct}%\n`;
    if (g.deadline) {
      msg += `   📅 Prazo: ${new Date(g.deadline).toLocaleDateString('pt-BR')}\n`;
    }
    msg += '\n';
  });

  return msg;
}

function buildBar(value, total) {
  if (!total || total === 0) return '░░░░░';
  const filled = Math.round((value / total) * 5);
  return '▓'.repeat(filled) + '░'.repeat(5 - filled);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { formatCurrency, formatSummary, formatGoals, welcomeMessage };
