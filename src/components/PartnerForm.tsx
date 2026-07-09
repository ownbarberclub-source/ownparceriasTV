import { useState, useEffect } from 'react';
import type { Partner, Plan } from '../types';
import { supabase } from '../supabaseClient';
import { X, Save } from 'lucide-react';

interface PartnerFormProps {
  partner?: Partner | null;
  onClose: () => void;
  onSave: (data: Partial<Partner>) => Promise<void>;
}

export function PartnerForm({ partner, onClose, onSave }: PartnerFormProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({
    company_name: '',
    trade_name: '',
    cnpj_cpf: '',
    address: '',
    contact_name: '',
    email: '',
    phone: '',
    plan_name: '',
    monthly_price: 0,
    is_signed: false,
    drive_link: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_months: 12,
    status: 'pending' as 'active' | 'pending' | 'suspended',
    // Campos de permuta
    payment_type: 'financeiro' as 'financeiro' | 'permuta',
    barter_product_description: '',
    barter_product_quantity: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from('tv_plans').select('*').order('name');
      if (data && data.length > 0) {
        setPlans(data);
        if (!partner) {
          // Inicializa com o primeiro plano se for novo cadastro
          setForm(prev => ({
            ...prev,
            plan_name: data[0].name,
            monthly_price: data[0].default_price
          }));
        }
      }
    };
    fetchPlans();
  }, [partner]);

  useEffect(() => {
    if (partner) {
      setForm({
        company_name: partner.company_name,
        trade_name: partner.trade_name || '',
        cnpj_cpf: partner.cnpj_cpf,
        address: partner.address,
        contact_name: partner.contact_name,
        email: partner.email,
        phone: partner.phone,
        plan_name: partner.plan_name,
        monthly_price: partner.monthly_price,
        is_signed: partner.is_signed,
        drive_link: partner.drive_link || '',
        start_date: partner.start_date,
        duration_months: partner.duration_months,
        status: partner.status,
        payment_type: partner.payment_type || 'financeiro',
        barter_product_description: partner.barter_product_description || '',
        barter_product_quantity: partner.barter_product_quantity || 0,
      });
    }
  }, [partner]);

  const handlePlanChange = (planName: string) => {
    const plan = plans.find(p => p.name === planName);
    setForm(prev => ({
      ...prev,
      plan_name: planName,
      monthly_price: plan ? plan.default_price : prev.monthly_price,
      duration_months: plan ? plan.duration_months : prev.duration_months
    }));
  };

  const getExpirationDate = () => {
    if (!form.start_date) return '';
    try {
      const dt = new Date(form.start_date + 'T12:00:00');
      dt.setMonth(dt.getMonth() + form.duration_months);
      return dt.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Normaliza campos nulos/vazios
      const payload: Partial<Partner> = {
        ...form,
        trade_name: form.trade_name.trim() || null,
        drive_link: form.drive_link.trim() || null,
        barter_product_description: form.payment_type === 'permuta' ? form.barter_product_description.trim() || null : null,
        barter_product_quantity: form.payment_type === 'permuta' ? form.barter_product_quantity : 0,
      };
      await onSave(payload);
      onClose();
    } catch {
      alert('Erro ao salvar parceiro.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px',
    padding: '10px 14px', color: '#f4f4f5', fontSize: '0.8rem', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fadeIn" style={{ background: '#18181b', border: '1px solid #27272a', width: '100%', maxWidth: '720px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(24,24,27,0.5)' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f4f4f5' }}>
              {partner ? 'Editar Parceiro' : 'Novo Parceiro'}
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '4px' }}>
              {partner ? 'Modifique os dados do parceiro comercial' : 'Preencha os dados do novo parceiro comercial'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '8px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Razão Social */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Razão Social / Nome Completo *</label>
              <input required style={inputStyle} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Ex: Empresa XYZ Ltda." />
            </div>

            {/* Nome Fantasia */}
            <div>
              <label style={labelStyle}>Nome Fantasia</label>
              <input style={inputStyle} value={form.trade_name} onChange={e => setForm({ ...form, trade_name: e.target.value })} placeholder="Ex: Marca XYZ" />
            </div>

            {/* CNPJ/CPF */}
            <div>
              <label style={labelStyle}>CNPJ / CPF *</label>
              <input required style={inputStyle} value={form.cnpj_cpf} onChange={e => setForm({ ...form, cnpj_cpf: e.target.value })} placeholder="00.000.000/0000-00" />
            </div>

            {/* Endereço */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Endereço Completo *</label>
              <input required style={inputStyle} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Rua, Número, Bairro - Cidade/UF" />
            </div>

            {/* Contato */}
            <div>
              <label style={labelStyle}>Nome do Responsável *</label>
              <input required style={inputStyle} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Nome completo" />
            </div>

            {/* E-mail */}
            <div>
              <label style={labelStyle}>E-mail *</label>
              <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" />
            </div>

            {/* Telefone */}
            <div>
              <label style={labelStyle}>Telefone *</label>
              <input required style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>

            {/* Plano */}
            <div>
              <label style={labelStyle}>Plano Escolhido *</label>
              {plans.length === 0 ? (
                <div style={{ ...inputStyle, background: 'rgba(239,68,68,0.05)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                  Nenhum plano cadastrado. Por favor, crie planos na aba "Planos de Anúncio".
                </div>
              ) : (
                <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.plan_name} onChange={e => handlePlanChange(e.target.value)}>
                  <option value="">Selecione um plano...</option>
                  {plans.map(p => <option key={p.id} value={p.name}>{p.name} (Padrão: R$ {p.default_price})</option>)}
                </select>
              )}
            </div>

            {/* Tipo de Pagamento */}
            <div>
              <label style={labelStyle}>Tipo de Pagamento *</label>
              <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value as 'financeiro' | 'permuta' })}>
                <option value="financeiro">Financeiro (Dinheiro/PIX)</option>
                <option value="permuta">Permuta (Troca de Produtos/Prêmios)</option>
              </select>
            </div>

            {/* Valor Mensal */}
            <div>
              <label style={labelStyle}>Valor Mensal da Assinatura (R$) *</label>
              <input required type="number" min="0" step="0.01" style={inputStyle} value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: parseFloat(e.target.value) || 0 })} />
            </div>

            {/* Data de Início */}
            <div>
              <label style={labelStyle}>Data de Início *</label>
              <input required type="date" style={inputStyle} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>

            {/* Duração */}
            <div>
              <label style={labelStyle}>Duração (meses)</label>
              <input type="number" min="1" style={inputStyle} value={form.duration_months} onChange={e => setForm({ ...form, duration_months: parseInt(e.target.value) || 12 })} />
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--brand)', marginTop: '4px', fontWeight: 650 }}>
                Vencimento: {getExpirationDate()}
              </span>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'pending' | 'suspended' })}>
                <option value="pending">Pendente</option>
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>

            {/* Seção Condicional de Permuta */}
            {form.payment_type === 'permuta' && (
              <div style={{ gridColumn: 'span 2', background: 'rgba(200,169,126,0.03)', border: '1px solid rgba(200,169,126,0.1)', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Detalhes do Acordo de Permuta
                  </h4>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Descrição do Produto/Premio Prometido *</label>
                  <input required={form.payment_type === 'permuta'} style={inputStyle} value={form.barter_product_description} onChange={e => setForm({ ...form, barter_product_description: e.target.value })} placeholder="Ex: 5 vales-compras de R$ 50,00 ou 10 pomadas modeladoras" />
                </div>
                <div>
                  <label style={labelStyle}>Quantidade de Produtos Prometida (Qtd. Mensal) *</label>
                  <input required={form.payment_type === 'permuta'} type="number" min="0" style={inputStyle} value={form.barter_product_quantity} onChange={e => setForm({ ...form, barter_product_quantity: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            )}

            {/* Separador de Assinatura */}
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid #27272a', paddingTop: '16px', marginTop: '8px' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4d4d8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Controle de Assinatura
              </h3>
            </div>

            {/* Contrato Assinado? */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(9,9,11,0.4)', padding: '14px', border: '1px solid #27272a', borderRadius: '10px' }}>
              <input
                type="checkbox"
                id="isSigned"
                checked={form.is_signed}
                onChange={e => setForm({ ...form, is_signed: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--brand)', cursor: 'pointer' }}
              />
              <label htmlFor="isSigned" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d4d4d8', cursor: 'pointer' }}>
                Contrato Assinado
              </label>
            </div>

            {/* Link do Drive */}
            <div>
              <label style={labelStyle}>Link do Contrato (Google Drive)</label>
              <input style={inputStyle} value={form.drive_link} onChange={e => setForm({ ...form, drive_link: e.target.value })} placeholder="https://drive.google.com/..." />
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #27272a', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#27272a', color: '#d4d4d8', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--brand)', color: 'white', padding: '10px 24px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,169,126,0.15)', opacity: saving ? 0.6 : 1 }}>
              <Save size={16} />
              {saving ? 'Salvando...' : partner ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
