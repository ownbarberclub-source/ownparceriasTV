-- ============================================================
-- OWN TV & PARCERIAS - Setup do Banco de Dados
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de Parceiros e Assinaturas
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

-- 2. RLS (Row Level Security)
ALTER TABLE tv_partners ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
CREATE POLICY "Leitura Todos - Parceiros" ON tv_partners FOR SELECT USING (true);
CREATE POLICY "Insert Todos - Parceiros" ON tv_partners FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Todos - Parceiros" ON tv_partners FOR UPDATE USING (true);
CREATE POLICY "Delete Todos - Parceiros" ON tv_partners FOR DELETE USING (true);
