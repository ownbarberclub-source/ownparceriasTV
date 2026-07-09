import { useState, useEffect } from 'react';
import type { Partner } from '../types';
import { X, Save } from 'lucide-react';

interface PartnerFormProps {
  partner?: Partner | null;
  onClose: () => void;
  onSave: (data: Partial<Partner>) => Promise<void>;
}

const PLANS = ['Bronze', 'Prata', 'Ouro', 'Diamante', 'Personalizado'];

export function PartnerForm({ partner, onClose, onSave }: PartnerFormProps) {
  const [form, setForm] = useState({
    company_name: '',
    trade_name: '',
    cnpj_cpf: '',
    address: '',
    contact_name: '',
    email: '',
    phone: '',
    plan_name: 'Bronze',
    monthly_price: 0,
    is_signed: false,
    drive_link: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_months: 12,
    status: 'pending' as 'active' | 'pending' | 'suspended',
  });
  const [saving, setSaving] = useState(false);

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
      });
    }
  }, [partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
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
              <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })}>
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Valor Mensal */}
            <div>
              <label style={labelStyle}>Valor Mensal (R$) *</label>
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
