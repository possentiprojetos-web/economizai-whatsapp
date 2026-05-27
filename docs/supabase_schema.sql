-- Execute este SQL no Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  onboarded BOOLEAN DEFAULT FALSE,
  monthly_budget DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL REFERENCES users(phone),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL REFERENCES users(phone),
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  saved_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_expenses_phone ON expenses(phone);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_goals_phone ON goals(phone);

-- Row Level Security (segurança: cada usuário só vê seus dados)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Política: service_role (backend) tem acesso total
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (true);

CREATE POLICY "Service role full access expenses" ON expenses
  FOR ALL USING (true);

CREATE POLICY "Service role full access goals" ON goals
  FOR ALL USING (true);
