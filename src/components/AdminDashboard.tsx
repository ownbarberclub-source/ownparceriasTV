import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Partner, Plan, Prize } from '../types';
import { PartnerForm } from './PartnerForm';
import { ContractViewer } from './ContractViewer';
import {
  Plus, Search, RefreshCw, DollarSign, Users, FileWarning,
  FileText, Edit2, Trash, ExternalLink, CheckCircle2, Clock, XCircle,
  Gift, Info
} from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'partners' | 'plans' | 'prizes'>('partners');
  
  // Estados de dados
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Estados dos Modais / Formulários
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [contractPartner, setContractPartner] = useState<Partner | null>(null);

  // Estados de Gerenciamento de Planos
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', default_price: 0, description: '' });

  // Estados de Gerenciamento de Prêmios
  const [isPrizeFormOpen, setIsPrizeFormOpen] = useState(false);
  const [editPrize, setEditPrize] = useState<Prize | null>(null);
  const [prizeForm, setPrizeForm] = useState({
    partner_id: '',
    description: '',
    quantity_received: 1,
    quantity_used: 0,
    received_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPartners(),
        loadPlans(),
        loadPrizes()
      ]);
    } catch (err) {
      console.error('Erro ao recarregar dados do painel:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    const { data, error } = await supabase
      .from('tv_partners')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    setPartners(data || []);
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from('tv_plans')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    setPlans(data || []);
  };

  const loadPrizes = async () => {
    const { data, error } = await supabase
      .from('tv_prizes')
      .select(`
        *,
        tv_partners (
          company_name
        )
      `)
      .order('received_date', { ascending: false });
    if (error) throw error;
    setPrizes(data || []);
  };

  // --- Handlers de Parceiro ---
  const handleSavePartner = async (formData: Partial<Partner>) => {
    if (editPartner) {
      const { error } = await supabase
        .from('tv_partners')
        .update(formData)
        .eq('id', editPartner.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('tv_partners')
        .insert([formData]);
      if (error) throw error;
    }
    await loadPartners();
  };

  const handleDeletePartner = async (partner: Partner) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR o parceiro "${partner.company_name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await supabase.from('tv_partners').delete().eq('id', partner.id);
      await loadPartners();
      await loadPrizes(); // Cascata apaga prêmios
    } catch (err) {
      console.error('Erro ao excluir parceiro:', err);
    }
  };

  const handleToggleSigned = async (partner: Partner) => {
    try {
      await supabase
        .from('tv_partners')
        .update({ is_signed: !partner.is_signed })
        .eq('id', partner.id);
      await loadPartners();
    } catch (err) {
      console.error('Erro ao alterar status da assinatura:', err);
    }
  };

  // --- Handlers de Planos ---
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) return;

    try {
      if (editPlan) {
        const { error } = await supabase
          .from('tv_plans')
          .update({
            name: planForm.name.trim(),
            default_price: planForm.default_price,
            description: planForm.description.trim() || null
          })
          .eq('id', editPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tv_plans')
          .insert([{
            name: planForm.name.trim(),
            default_price: planForm.default_price,
            description: planForm.description.trim() || null
          }]);
        if (error) throw error;
      }
      setIsPlanFormOpen(false);
      setEditPlan(null);
      setPlanForm({ name: '', default_price: 0, description: '' });
      await loadPlans();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o plano.');
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR o plano "${plan.name}"?`)) return;
    try {
      await supabase.from('tv_plans').delete().eq('id', plan.id);
      await loadPlans();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Handlers de Prêmios/Permutas ---
  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeForm.partner_id || !prizeForm.description.trim()) return;

    try {
      const payload = {
        partner_id: prizeForm.partner_id,
        description: prizeForm.description.trim(),
        quantity_received: prizeForm.quantity_received,
        quantity_used: prizeForm.quantity_used,
        received_date: prizeForm.received_date,
        notes: prizeForm.notes.trim() || null
      };

      if (editPrize) {
        const { error } = await supabase
          .from('tv_prizes')
          .update(payload)
          .eq('id', editPrize.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tv_prizes')
          .insert([payload]);
        if (error) throw error;
      }
      setIsPrizeFormOpen(false);
      setEditPrize(null);
      setPrizeForm({
        partner_id: partners[0]?.id || '',
        description: '',
        quantity_received: 1,
        quantity_used: 0,
        received_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      await loadPrizes();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar prêmio.');
    }
  };

  const handleAdjustPrizeStock = async (prize: Prize, change: number) => {
    const nextUsed = Math.max(0, Math.min(prize.quantity_received, prize.quantity_used + change));
    try {
      const { error } = await supabase
        .from('tv_prizes')
        .update({ quantity_used: nextUsed })
        .eq('id', prize.id);
      if (error) throw error;
      await loadPrizes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePrize = async (prize: Prize) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR o prêmio "${prize.description}"?`)) return;
    try {
      await supabase.from('tv_prizes').delete().eq('id', prize.id);
      await loadPrizes();
    } catch (err) {
      console.error(err);
    }
  };

  // --- KPIs e Filtros ---
  const kpis = useMemo(() => {
    const activePartners = partners.filter(p => p.status === 'active');
    const mrr = activePartners
      .filter(p => p.payment_type !== 'permuta')
      .reduce((sum, p) => sum + (p.monthly_price || 0), 0);
    const pendingSign = partners.filter(p => !p.is_signed).length;
    const bartersCount = activePartners.filter(p => p.payment_type === 'permuta').length;
    return { total: partners.length, mrr, pendingSign, active: activePartners.length, bartersCount };
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        p.company_name.toLowerCase().includes(q) ||
        p.contact_name.toLowerCase().includes(q) ||
        p.cnpj_cpf.includes(q) ||
        (p.trade_name || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [partners, searchQuery, statusFilter]);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusLabel = (s: string) => {
    if (s === 'active') return 'Ativo';
    if (s === 'pending') return 'Pendente';
    return 'Suspenso';
  };

  const statusIcon = (s: string) => {
    if (s === 'active') return <CheckCircle2 size={12} />;
    if (s === 'pending') return <Clock size={12} />;
    return <XCircle size={12} />;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px',
    padding: '9px 14px', color: '#f4f4f5', fontSize: '0.8rem', outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      
      {/* KPIs Gerais (sempre visíveis no topo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Faturamento Mensal (MRR)', value: formatCurrency(kpis.mrr), icon: <DollarSign size={20} />, color: '#4ade80' },
          { label: 'Total de Parceiros', value: kpis.total.toString(), icon: <Users size={20} />, color: 'var(--brand)' },
          { label: 'Parcerias em Permuta', value: kpis.bartersCount.toString(), icon: <RefreshCw size={20} />, color: '#a78bfa' },
          { label: 'Assinaturas Pendentes', value: kpis.pendingSign.toString(), icon: <FileWarning size={20} />, color: '#facc15' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${kpi.color}15`, border: `1px solid ${kpi.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f4f4f5', marginTop: '2px' }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', borderBottom: '1px solid #27272a', gap: '8px', marginBottom: '24px' }}>
        {[
          { id: 'partners', label: 'Parceiros' },
          { id: 'plans', label: 'Planos de Anúncio' },
          { id: 'prizes', label: 'Estoque de Prêmios' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.id ? '#f4f4f5' : '#71717a', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ────────────────── ABA 1: PARCEIROS ────────────────── */}
      {activeTab === 'partners' && (
        <>
          {/* Toolbar */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar parceiro..."
                  style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '9px 14px 9px 34px', color: '#f4f4f5', fontSize: '0.8rem', outline: 'none' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '9px 14px', color: '#d4d4d8', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="pending">Pendentes</option>
                <option value="suspended">Suspensos</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={loadPartners} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#27272a', color: '#d4d4d8', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #3f3f46', cursor: 'pointer' }}>
                <RefreshCw size={14} /> Atualizar
              </button>
              <button onClick={() => { setEditPartner(null); setIsFormOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--brand)', color: 'white', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,169,126,0.15)' }}>
                <Plus size={14} /> Novo Parceiro
              </button>
            </div>
          </div>

          {/* Tabela de Parceiros */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.8rem', color: '#71717a' }}>Carregando parceiros...</p>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#52525b', fontSize: '0.85rem' }}>
                Nenhum parceiro comercial encontrado.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #27272a' }}>
                      {['Empresa', 'Plano', 'Tipo de Pagamento', 'Mensalidade', 'Status', 'Assinatura', 'Drive', 'Ações'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.map(partner => (
                      <tr key={partner.id} style={{ borderBottom: '1px solid #1c1c1f', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = '#1c1c1f')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '14px 16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <p style={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.8rem' }}>{partner.company_name}</p>
                              {partner.payment_type === 'permuta' && (
                                <span style={{ background: 'rgba(167,139,250,0.1)', color: '#c084fc', border: '1px solid rgba(167,139,250,0.2)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                  Permuta
                                </span>
                              )}
                            </div>
                            <p style={{ color: '#52525b', fontSize: '0.7rem', marginTop: '2px' }}>{partner.contact_name} • {partner.cnpj_cpf}</p>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: 'var(--brand)', color: 'white', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700 }}>
                            {partner.plan_name}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {partner.payment_type === 'permuta' ? (
                            <span style={{ color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }} title={partner.barter_product_description || ''}>
                              <Gift size={12} /> Permuta ({partner.barter_product_quantity} itens)
                            </span>
                          ) : (
                            <span style={{ color: '#a1a1aa' }}>Financeiro</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f4f4f5' }}>
                          {formatCurrency(partner.monthly_price)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`status-badge status-${partner.status}`}>
                            {statusIcon(partner.status)} {statusLabel(partner.status)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => handleToggleSigned(partner)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                              background: partner.is_signed ? 'rgba(34,197,94,0.1)' : 'rgba(250,204,21,0.1)',
                              color: partner.is_signed ? '#4ade80' : '#facc15',
                            }}
                            title="Alternar assinatura do contrato"
                          >
                            {partner.is_signed ? <><CheckCircle2 size={12} /> Assinado</> : <><Clock size={12} /> Pendente</>}
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {partner.drive_link ? (
                            <a href={partner.drive_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 600, textDecoration: 'none' }}>
                              <ExternalLink size={12} /> Abrir
                            </a>
                          ) : (
                            <span style={{ color: '#3f3f46', fontSize: '0.7rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => setContractPartner(partner)}
                              style={{ padding: '6px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', borderRadius: '6px' }}
                              title="Gerar Termo de Contrato"
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.background = 'rgba(200,169,126,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'none'; }}
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              onClick={() => { setEditPartner(partner); setIsFormOpen(true); }}
                              style={{ padding: '6px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', borderRadius: '6px' }}
                              title="Editar Parceiro"
                              onMouseEnter={e => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.background = '#27272a'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'none'; }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeletePartner(partner)}
                              style={{ padding: '6px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', borderRadius: '6px' }}
                              title="Excluir Parceiro"
                              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'none'; }}
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ────────────────── ABA 2: PLANOS DE ANÚNCIO ────────────────── */}
      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          
          {/* Tabela de Planos */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f4f4f5' }}>Planos Disponíveis</h3>
              <button
                onClick={() => { setEditPlan(null); setPlanForm({ name: '', default_price: 0, description: '' }); setIsPlanFormOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--brand)', color: 'white', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                <Plus size={12} /> Novo Plano
              </button>
            </div>

            {plans.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#52525b', fontSize: '0.8rem' }}>
                Nenhum plano cadastrado.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #27272a' }}>
                      {['Nome do Plano', 'Valor Padrão', 'Descrição', 'Ações'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1c1c1f' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f4f4f5' }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4ade80' }}>
                          {formatCurrency(p.default_price)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>
                          {p.description || <span style={{ color: '#3f3f46' }}>Sem descrição</span>}
                        </td>
                        <td style={{ padding: '12px 16px', width: '80px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => { setEditPlan(p); setPlanForm({ name: p.name, default_price: p.default_price, description: p.description || '' }); setIsPlanFormOpen(true); }}
                              style={{ padding: '4px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                              title="Editar Plano"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(p)}
                              style={{ padding: '4px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                              title="Excluir Plano"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Painel lateral de Criação/Edição */}
          {isPlanFormOpen ? (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f4f4f5' }}>
                  {editPlan ? 'Editar Plano' : 'Criar Plano'}
                </h4>
                <button onClick={() => { setIsPlanFormOpen(false); setEditPlan(null); }} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                  <XCircle size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome do Plano *</label>
                  <input required style={inputStyle} value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ex: Master" />
                </div>
                <div>
                  <label style={labelStyle}>Preço Mensal Padrão (R$)</label>
                  <input required type="number" min="0" step="0.01" style={inputStyle} value={planForm.default_price} onChange={e => setPlanForm({ ...planForm, default_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label style={labelStyle}>Descrição / Detalhes</label>
                  <textarea style={{ ...inputStyle, resize: 'none', height: '60px' }} value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Ex: Cobertura completa em 10 TVs..." />
                </div>

                <button
                  type="submit"
                  style={{ background: 'var(--brand)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                >
                  Salvar Plano
                </button>
              </form>
            </div>
          ) : (
            <div style={{ background: 'rgba(24,24,27,0.3)', border: '1px dashed #27272a', borderRadius: '16px', padding: '32px 20px', textAlign: 'center', color: '#52525b', fontSize: '0.75rem' }}>
              <Info size={24} style={{ margin: '0 auto 8px', color: '#3f3f46' }} />
              Selecione um plano para editar ou clique em "Novo Plano" para cadastrar.
            </div>
          )}

        </div>
      )}

      {/* ────────────────── ABA 3: ESTOQUE DE PRÊMIOS ────────────────── */}
      {activeTab === 'prizes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          
          {/* Tabela de Prêmios */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f4f4f5' }}>Controle de Prêmios e Permutas Físicas</h3>
              <button
                onClick={() => {
                  if (partners.length === 0) {
                    alert('Por favor, cadastre pelo menos um parceiro antes de registrar prêmios.');
                    return;
                  }
                  setEditPrize(null);
                  setPrizeForm({
                    partner_id: partners[0].id,
                    description: '',
                    quantity_received: 1,
                    quantity_used: 0,
                    received_date: new Date().toISOString().split('T')[0],
                    notes: ''
                  });
                  setIsPrizeFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--brand)', color: 'white', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                <Plus size={12} /> Registrar Doação
              </button>
            </div>

            {prizes.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#52525b', fontSize: '0.8rem' }}>
                Nenhum prêmio registrado até o momento.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #27272a' }}>
                      {['Parceiro Doador', 'Descrição do Prêmio', 'Recebidos', 'Utilizados', 'Saldo Restante', 'Recebimento', 'Ações'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map(p => {
                      const balance = p.quantity_received - p.quantity_used;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1c1c1f' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f4f4f5' }}>
                            {p.tv_partners?.company_name || 'Parceiro Desconhecido'}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#d4d4d8' }}>
                            <div>
                              <p style={{ fontWeight: 550 }}>{p.description}</p>
                              {p.notes && <p style={{ fontSize: '0.65rem', color: '#52525b', marginTop: '2px' }}>Obs: {p.notes}</p>}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#a1a1aa' }}>
                            {p.quantity_received} un
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleAdjustPrizeStock(p, -1)}
                                style={{ width: '20px', height: '20px', background: '#27272a', border: 'none', color: '#d4d4d8', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                                title="Diminuir quantidade usada"
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 600, color: '#f4f4f5', minWidth: '20px', textAlign: 'center' }}>
                                {p.quantity_used}
                              </span>
                              <button
                                onClick={() => handleAdjustPrizeStock(p, 1)}
                                style={{ width: '20px', height: '20px', background: '#27272a', border: 'none', color: '#d4d4d8', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                                title="Aumentar quantidade usada"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem',
                              background: balance > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: balance > 0 ? '#4ade80' : '#f87171'
                            }}>
                              {balance} un disponível
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#71717a' }}>
                            {new Date(p.received_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ padding: '12px 16px', width: '80px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => {
                                  setEditPrize(p);
                                  setPrizeForm({
                                    partner_id: p.partner_id,
                                    description: p.description,
                                    quantity_received: p.quantity_received,
                                    quantity_used: p.quantity_used,
                                    received_date: p.received_date,
                                    notes: p.notes || ''
                                  });
                                  setIsPrizeFormOpen(true);
                                }}
                                style={{ padding: '4px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                                title="Editar Doação"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeletePrize(p)}
                                style={{ padding: '4px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                                title="Remover Doação"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Painel lateral de Criação/Edição de Prêmios */}
          {isPrizeFormOpen ? (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f4f4f5' }}>
                  {editPrize ? 'Editar Doação' : 'Registrar Doação'}
                </h4>
                <button onClick={() => { setIsPrizeFormOpen(false); setEditPrize(null); }} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                  <XCircle size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePrize} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Parceiro Doador *</label>
                  <select required style={{ ...inputStyle, cursor: 'pointer' }} value={prizeForm.partner_id} onChange={e => setPrizeForm({ ...prizeForm, partner_id: e.target.value })}>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Descrição do Prêmio *</label>
                  <input required style={inputStyle} value={prizeForm.description} onChange={e => setPrizeForm({ ...prizeForm, description: e.target.value })} placeholder="Ex: 5 Vales-compras de R$ 50,00" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Qtd Recebida *</label>
                    <input required type="number" min="1" style={inputStyle} value={prizeForm.quantity_received} onChange={e => setPrizeForm({ ...prizeForm, quantity_received: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Qtd Utilizada</label>
                    <input required type="number" min="0" max={prizeForm.quantity_received} style={inputStyle} value={prizeForm.quantity_used} onChange={e => setPrizeForm({ ...prizeForm, quantity_used: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Data de Recebimento *</label>
                  <input required type="date" style={inputStyle} value={prizeForm.received_date} onChange={e => setPrizeForm({ ...prizeForm, received_date: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Notas / Regras</label>
                  <textarea style={{ ...inputStyle, resize: 'none', height: '60px' }} value={prizeForm.notes} onChange={e => setPrizeForm({ ...prizeForm, notes: e.target.value })} placeholder="Ex: Sorteio de final de ano..." />
                </div>

                <button
                  type="submit"
                  style={{ background: 'var(--brand)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                >
                  Salvar Doação
                </button>
              </form>
            </div>
          ) : (
            <div style={{ background: 'rgba(24,24,27,0.3)', border: '1px dashed #27272a', borderRadius: '16px', padding: '32px 20px', textAlign: 'center', color: '#52525b', fontSize: '0.75rem' }}>
              <Gift size={24} style={{ margin: '0 auto 8px', color: '#3f3f46' }} />
              Registre novas doações recebidas de seus parceiros para acompanhar o estoque e utilização.
            </div>
          )}

        </div>
      )}

      {/* Modais de Parceiro */}
      {isFormOpen && (
        <PartnerForm
          partner={editPartner}
          onClose={() => { setIsFormOpen(false); setEditPartner(null); }}
          onSave={handleSavePartner}
        />
      )}

      {contractPartner && (
        <ContractViewer
          partner={contractPartner}
          onClose={() => setContractPartner(null)}
        />
      )}
    </div>
  );
}
