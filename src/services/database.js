const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ─── USUÁRIOS ──────────────────────────────────────────────

async function getOrCreateUser(phone) {
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ phone, onboarded: false, monthly_budget: 0 })
      .select()
      .single();
    user = newUser;
  }
  return user;
}

async function updateUser(phone, fields) {
  const { data } = await supabase
    .from('users')
    .update(fields)
    .eq('phone', phone)
    .select()
    .single();
  return data;
}

// ─── GASTOS ────────────────────────────────────────────────

async function saveExpense(phone, { amount, category, description, date }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ phone, amount, category, description, date: date || new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getMonthExpenses(phone) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { data } = await supabase
    .from('expenses')
    .select('*')
    .eq('phone', phone)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });

  return data || [];
}

async function getTotalByCategory(phone) {
  const expenses = await getMonthExpenses(phone);
  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount);
  });
  return totals;
}

// ─── METAS ─────────────────────────────────────────────────

async function saveGoal(phone, { name, target_amount, deadline }) {
  const { data } = await supabase
    .from('goals')
    .insert({ phone, name, target_amount, saved_amount: 0, deadline })
    .select()
    .single();
  return data;
}

async function getGoals(phone) {
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('phone', phone)
    .order('created_at', { ascending: false });
  return data || [];
}

module.exports = {
  getOrCreateUser,
  updateUser,
  saveExpense,
  getMonthExpenses,
  getTotalByCategory,
  saveGoal,
  getGoals,
};
