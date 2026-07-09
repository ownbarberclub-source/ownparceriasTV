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
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}
