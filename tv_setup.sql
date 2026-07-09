-- ============================================================
-- OWN TV & PARCERIAS - Setup Completo do Banco de Dados
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Criar Tabela de Planos
CREATE TABLE IF NOT EXISTS tv_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  default_price NUMERIC DEFAULT 0,
  description TEXT,
  duration_months INT DEFAULT 1, -- Duração padrão em meses
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS e criar políticas para Planos
ALTER TABLE tv_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura Todos - Planos" ON tv_plans;
DROP POLICY IF EXISTS "Insert Todos - Planos" ON tv_plans;
DROP POLICY IF EXISTS "Update Todos - Planos" ON tv_plans;
DROP POLICY IF EXISTS "Delete Todos - Planos" ON tv_plans;
CREATE POLICY "Leitura Todos - Planos" ON tv_plans FOR SELECT USING (true);
CREATE POLICY "Insert Todos - Planos" ON tv_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Todos - Planos" ON tv_plans FOR UPDATE USING (true);
CREATE POLICY "Delete Todos - Planos" ON tv_plans FOR DELETE USING (true);

-- 2. Tabela de Parceiros e Assinaturas
CREATE TABLE IF NOT EXISTS tv_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj_cpf TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  monthly_price NUMERIC DEFAULT 0,
  is_signed BOOLEAN DEFAULT false,
  drive_link TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  duration_months INT DEFAULT 12,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expandir Tabela de Parceiros para Permuta se as colunas não existirem
ALTER TABLE tv_partners ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'financeiro' CHECK (payment_type IN ('financeiro', 'permuta'));
ALTER TABLE tv_partners ADD COLUMN IF NOT EXISTS barter_product_description TEXT;
ALTER TABLE tv_partners ADD COLUMN IF NOT EXISTS barter_product_quantity INT DEFAULT 0;

-- Habilitar RLS e políticas para Parceiros
ALTER TABLE tv_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura Todos - Parceiros" ON tv_partners;
DROP POLICY IF EXISTS "Insert Todos - Parceiros" ON tv_partners;
DROP POLICY IF EXISTS "Update Todos - Parceiros" ON tv_partners;
DROP POLICY IF EXISTS "Delete Todos - Parceiros" ON tv_partners;
CREATE POLICY "Leitura Todos - Parceiros" ON tv_partners FOR SELECT USING (true);
CREATE POLICY "Insert Todos - Parceiros" ON tv_partners FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Todos - Parceiros" ON tv_partners FOR UPDATE USING (true);
CREATE POLICY "Delete Todos - Parceiros" ON tv_partners FOR DELETE USING (true);

-- 3. Criar Tabela de Controle de Prêmios (Estoque de Doações)
CREATE TABLE IF NOT EXISTS tv_prizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES tv_partners(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity_received INT DEFAULT 1,
  quantity_used INT DEFAULT 0,
  received_date DATE DEFAULT CURRENT_DATE,
  last_used_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS e criar políticas para Prêmios
ALTER TABLE tv_prizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura Todos - Premios" ON tv_prizes;
DROP POLICY IF EXISTS "Insert Todos - Premios" ON tv_prizes;
DROP POLICY IF EXISTS "Update Todos - Premios" ON tv_prizes;
DROP POLICY IF EXISTS "Delete Todos - Premios" ON tv_prizes;
CREATE POLICY "Leitura Todos - Premios" ON tv_prizes FOR SELECT USING (true);
CREATE POLICY "Insert Todos - Premios" ON tv_prizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Todos - Premios" ON tv_prizes FOR UPDATE USING (true);
CREATE POLICY "Delete Todos - Premios" ON tv_prizes FOR DELETE USING (true);

-- Adicionar coluna last_used_date se não existir
ALTER TABLE tv_prizes ADD COLUMN IF NOT EXISTS last_used_date DATE;

-- 4. Criar Tabela de Controle de Pagamentos (Financeiro)
CREATE TABLE IF NOT EXISTS tv_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES tv_partners(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS e políticas para Pagamentos
ALTER TABLE tv_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura Todos - Pagamentos" ON tv_payments;
DROP POLICY IF EXISTS "Insert Todos - Pagamentos" ON tv_payments;
DROP POLICY IF EXISTS "Update Todos - Pagamentos" ON tv_payments;
DROP POLICY IF EXISTS "Delete Todos - Pagamentos" ON tv_payments;
CREATE POLICY "Leitura Todos - Pagamentos" ON tv_payments FOR SELECT USING (true);
CREATE POLICY "Insert Todos - Pagamentos" ON tv_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Todos - Pagamentos" ON tv_payments FOR UPDATE USING (true);
CREATE POLICY "Delete Todos - Pagamentos" ON tv_payments FOR DELETE USING (true);
