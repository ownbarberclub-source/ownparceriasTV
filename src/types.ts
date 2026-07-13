export interface Partner {
  id: string;
  company_name: string;
  trade_name: string | null;
  cnpj_cpf: string;
  address: string;
  contact_name: string;
  email: string;
  phone: string;
  plan_name: string;
  monthly_price: number;
  is_signed: boolean;
  drive_link: string | null;
  start_date: string;
  duration_months: number;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  
  // Novos campos para permuta
  payment_type: 'financeiro' | 'permuta' | 'misto';
  barter_product_description: string | null;
  barter_product_quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface Plan {
  id: string;
  name: string;
  default_price: number;
  description: string | null;
  duration_months: number;
  created_at: string;
}

export interface Prize {
  id: string;
  partner_id: string;
  description: string;
  quantity_received: number;
  quantity_used: number;
  received_date: string;
  last_used_date: string | null;
  notes: string | null;
  created_at: string;
  // Relacionamento (Join)
  tv_partners?: {
    company_name: string;
  };
}

export interface Payment {
  id: string;
  partner_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'paid' | 'pending' | 'overdue';
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  // Relacionamento (Join)
  tv_partners?: {
    company_name: string;
  };
}
