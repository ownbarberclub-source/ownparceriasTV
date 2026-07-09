import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Partner, Plan, Prize, Payment } from '../types';
import { PartnerForm } from './PartnerForm';
import { ContractViewer } from './ContractViewer';
import {
  Plus, Search, RefreshCw, DollarSign, Users, FileWarning,
  FileText, Edit2, Trash, ExternalLink, CheckCircle2, Clock, XCircle,
  Gift, Info, Calendar
} from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'partners' | 'finance' | 'plans' | 'prizes'>('partners');
  
  // Estados de dados
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estados dos Modais / Formulários
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [contractPartner, setContractPartner] = useState<Partner | null>(null);

  // Estados de Gerenciamento de Planos
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', default_price: 0, description: '', duration_months: 1 });

  // Estados de Gerenciamento de Pagamentos
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState<Payment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cartão de crédito',
    notes: ''
  });

  // Estados de Gerenciamento de Prêmios
  const [isPrizeFormOpen, setIsPrizeFormOpen] = useState(false);
  const [editPrize, setEditPrize] = useState<Prize | null>(null);
  const [prizeForm, setPrizeForm] = useState({
    partner_id: '',
    description: '',
    quantity_received: 1,
    quantity_used: 0,
    received_date: new Date().toISOString().split('T')[0],
    last_used_date: '',
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
        loadPrizes(),
        loadPayments()
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

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from('tv_payments')
      .select(`
        *,
        tv_partners (
          company_name
        )
      `)
      .order('due_date', { ascending: false });
    if (error) throw error;
    setPayments(data || []);
  };

  // --- Handlers de Parceiro ---
  const handleSavePartner = async (formData: Partial<Partner>) => {
    let savedPartner: Partner | null = null;
    if (editPartner) {
      const { data, error } = await supabase
        .from('tv_partners')
        .update(formData)
        .eq('id', editPartner.id)
        .select();
      if (error) throw error;
      savedPartner = data?.[0] || null;
    } else {
      const { data, error } = await supabase
        .from('tv_partners')
        .insert([formData])
        .select();
      if (error) throw error;
      savedPartner = data?.[0] || null;
    }
    await loadPartners();

    // Sincronizar automaticamente os prêmios ou parcelas financeiras
    if (savedPartner) {
      if (savedPartner.payment_type === 'permuta' && savedPartner.barter_product_description) {
        try {
          // Buscar todos os prêmios existentes para esse parceiro, ordenados pela data de recebimento
          const { data: existingPrizes } = await supabase
            .from('tv_prizes')
            .select('id, quantity_received, quantity_used, received_date')
            .eq('partner_id', savedPartner.id)
            .order('received_date', { ascending: true });

          const duration = savedPartner.duration_months || 12;
          const prizesToInsert = [];
          const prizesToUpdate = [];

          for (let i = 0; i < duration; i++) {
            // Calcular data esperada para o mês i
            const baseDate = new Date((savedPartner.start_date || new Date().toISOString().split('T')[0]) + 'T12:00:00');
            baseDate.setMonth(baseDate.getMonth() + i);
            const expectedDate = baseDate.toISOString().split('T')[0];

            const existing = existingPrizes?.[i];
            if (existing) {
              // Atualizar prêmio existente mantendo quantity_used e last_used_date intactos
              prizesToUpdate.push(
                supabase
                  .from('tv_prizes')
                  .update({
                    description: savedPartner.barter_product_description,
                    quantity_received: savedPartner.barter_product_quantity || 1,
                    received_date: expectedDate,
                  })
                  .eq('id', existing.id)
              );
            } else {
              // Inserir novo prêmio para este mês
              prizesToInsert.push({
                partner_id: savedPartner.id,
                description: savedPartner.barter_product_description,
                quantity_received: savedPartner.barter_product_quantity || 1,
                quantity_used: 0,
                received_date: expectedDate,
              });
            }
          }

          // Executar atualizações
          if (prizesToUpdate.length > 0) {
            await Promise.all(prizesToUpdate);
          }

          // Inserir novos registros
          if (prizesToInsert.length > 0) {
            const { error: insertErr } = await supabase
              .from('tv_prizes')
              .insert(prizesToInsert);
            if (insertErr) throw insertErr;
          }

          // Se a duração do contrato diminuiu, remover os prêmios extras/excedentes
          if (existingPrizes && existingPrizes.length > duration) {
            const extraPrizes = existingPrizes.slice(duration);
            const idsToDelete = extraPrizes.map(p => p.id);
            const { error: deleteErr } = await supabase
              .from('tv_prizes')
              .delete()
              .in('id', idsToDelete);
            if (deleteErr) throw deleteErr;
          }

          // Limpar parcelas financeiras não pagas se mudou para permuta
          const { data: existingPayments } = await supabase
            .from('tv_payments')
            .select('id, status')
            .eq('partner_id', savedPartner.id);
          
          if (existingPayments && existingPayments.length > 0) {
            const idsToDelete = existingPayments
              .filter(p => p.status !== 'paid')
              .map(p => p.id);
            if (idsToDelete.length > 0) {
              await supabase
                .from('tv_payments')
                .delete()
                .in('id', idsToDelete);
              await loadPayments();
            }
          }

          await loadPrizes();
        } catch (err) {
          console.error('Erro ao sincronizar prêmios mensais do parceiro:', err);
        }
      } else if (savedPartner.payment_type === 'financeiro') {
        try {
          // Buscar parcelas financeiras existentes
          const { data: existingPayments } = await supabase
            .from('tv_payments')
            .select('id, amount, status, due_date')
            .eq('partner_id', savedPartner.id)
            .order('due_date', { ascending: true });

          const duration = savedPartner.duration_months || 12;
          const paymentsToInsert = [];
          const paymentsToUpdate = [];

          for (let i = 0; i < duration; i++) {
            const baseDate = new Date((savedPartner.start_date || new Date().toISOString().split('T')[0]) + 'T12:00:00');
            baseDate.setMonth(baseDate.getMonth() + i);
            const expectedDate = baseDate.toISOString().split('T')[0];

            const existing = existingPayments?.[i];
            if (existing) {
              // Só atualiza o valor e vencimento se a parcela NÃO estiver paga
              if (existing.status !== 'paid') {
                paymentsToUpdate.push(
                  supabase
                    .from('tv_payments')
                    .update({
                      amount: savedPartner.monthly_price || 0,
                      due_date: expectedDate,
                      status: new Date(expectedDate + 'T23:59:59') < new Date() ? 'overdue' : 'pending'
                    })
                    .eq('id', existing.id)
                );
              }
            } else {
              // Inserir nova parcela
              paymentsToInsert.push({
                partner_id: savedPartner.id,
                amount: savedPartner.monthly_price || 0,
                due_date: expectedDate,
                status: new Date(expectedDate + 'T23:59:59') < new Date() ? 'overdue' : 'pending'
              });
            }
          }

          // Executar atualizações
          if (paymentsToUpdate.length > 0) {
            await Promise.all(paymentsToUpdate);
          }

          // Inserir novos pagamentos
          if (paymentsToInsert.length > 0) {
            const { error: insertErr } = await supabase
              .from('tv_payments')
              .insert(paymentsToInsert);
            if (insertErr) throw insertErr;
          }

          // Se a duração diminuiu, remover as parcelas excedentes que NÃO estejam pagas
          if (existingPayments && existingPayments.length > duration) {
            const extraPayments = existingPayments.slice(duration);
            const idsToDelete = extraPayments
              .filter(p => p.status !== 'paid')
              .map(p => p.id);
            if (idsToDelete.length > 0) {
              const { error: deleteErr } = await supabase
                .from('tv_payments')
                .delete()
                .in('id', idsToDelete);
              if (deleteErr) throw deleteErr;
            }
          }

          // Limpar prêmios de permuta se o parceiro mudou para financeiro e nenhum foi usado
          const { data: existingPrizes } = await supabase
            .from('tv_prizes')
            .select('id, quantity_used')
            .eq('partner_id', savedPartner.id);

          if (existingPrizes && existingPrizes.length > 0) {
            const canDelete = existingPrizes.every(p => p.quantity_used === 0);
            if (canDelete) {
              await supabase
                .from('tv_prizes')
                .delete()
                .eq('partner_id', savedPartner.id);
              await loadPrizes();
            }
          }

          await loadPayments();
        } catch (err) {
          console.error('Erro ao sincronizar parcelas financeiras:', err);
        }
      }
    }
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

  // --- Handlers de Pagamentos ---
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingPayment) return;

    try {
      const { error } = await supabase
        .from('tv_payments')
        .update({
          status: 'paid',
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          notes: paymentForm.notes.trim() || null
        })
        .eq('id', confirmingPayment.id);
      if (error) throw error;

      setIsPaymentFormOpen(false);
      setConfirmingPayment(null);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cartão de crédito',
        notes: ''
      });
      await loadPayments();
    } catch (err) {
      console.error(err);
      alert('Erro ao confirmar pagamento.');
    }
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR esta parcela com vencimento em ${new Date(payment.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}?`)) return;
    try {
      const { error } = await supabase
        .from('tv_payments')
        .delete()
        .eq('id', payment.id);
      if (error) throw error;
      await loadPayments();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir parcela.');
    }
  };

  const handleTogglePaymentStatus = async (payment: Payment) => {
    if (payment.status === 'paid') {
      if (!window.confirm('Deseja estornar/cancelar o pagamento desta parcela?')) return;
      try {
        const { error } = await supabase
          .from('tv_payments')
          .update({
            status: new Date(payment.due_date + 'T23:59:59') < new Date() ? 'overdue' : 'pending',
            payment_date: null,
            payment_method: null,
          })
          .eq('id', payment.id);
        if (error) throw error;
        await loadPayments();
      } catch (err) {
        console.error(err);
      }
    } else {
      setConfirmingPayment(payment);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cartão de crédito',
        notes: payment.notes || ''
      });
      setIsPaymentFormOpen(true);
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
            description: planForm.description.trim() || null,
            duration_months: planForm.duration_months
          })
          .eq('id', editPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tv_plans')
          .insert([{
            name: planForm.name.trim(),
            default_price: planForm.default_price,
            description: planForm.description.trim() || null,
            duration_months: planForm.duration_months
          }]);
        if (error) throw error;
      }
      setIsPlanFormOpen(false);
      setEditPlan(null);
      setPlanForm({ name: '', default_price: 0, description: '', duration_months: 1 });
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
        last_used_date: prizeForm.last_used_date || null,
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
        last_used_date: '',
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
    const updateData: { quantity_used: number; last_used_date?: string | null } = { quantity_used: nextUsed };
    
    // Se a quantidade utilizada aumentou, registra a data de hoje como último uso
    if (change > 0 && nextUsed > prize.quantity_used) {
      updateData.last_used_date = new Date().toISOString().split('T')[0];
    }

    try {
      const { error } = await supabase
        .from('tv_prizes')
        .update(updateData)
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
    
    // Faturamento Mensal baseado nos pagamentos recebidos (status === 'paid') no mês selecionado
    // Se selecionado 'all', usamos o mês atual como padrão para o faturamento mensal
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = selectedMonth === 'all' ? currentMonthStr : selectedMonth;
    
    const mrr = payments
      .filter(p => p.status === 'paid' && p.due_date && p.due_date.startsWith(targetMonth))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingSign = partners.filter(p => !p.is_signed).length;
    const bartersCount = activePartners.filter(p => p.payment_type === 'permuta').length;
    return { total: partners.length, mrr, pendingSign, active: activePartners.length, bartersCount };
  }, [partners, payments, selectedMonth]);

  const expiringThisMonthList = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    return partners.filter(p => {
      if (p.status !== 'active') return false;
      const startDt = new Date(p.start_date + 'T12:00:00');
      startDt.setMonth(startDt.getMonth() + p.duration_months);
      return startDt.getFullYear() === currentYear && startDt.getMonth() === currentMonth;
    });
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

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    // Garantir que o mês atual esteja na lista por padrão
    const today = new Date();
    months.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    
    prizes.forEach(p => {
      if (p.received_date) {
        const [year, month] = p.received_date.split('-');
        months.add(`${year}-${month}`);
      }
    });
    
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [prizes]);

  const filteredPrizes = useMemo(() => {
    if (selectedMonth === 'all') return prizes;
    return prizes.filter(p => p.received_date && p.received_date.startsWith(selectedMonth));
  }, [prizes, selectedMonth]);

  const availableFinanceMonths = useMemo(() => {
    const months = new Set<string>();
    const today = new Date();
    months.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    
    payments.forEach(p => {
      if (p.due_date) {
        const [year, month] = p.due_date.split('-');
        months.add(`${year}-${month}`);
      }
    });
    
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchMonth = selectedMonth === 'all' || (p.due_date && p.due_date.startsWith(selectedMonth));
      
      let matchStatus = true;
      if (paymentStatusFilter !== 'all') {
        matchStatus = p.status === paymentStatusFilter;
      }
      
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        (p.tv_partners?.company_name || '').toLowerCase().includes(q) ||
        p.amount.toString().includes(q) ||
        (p.notes || '').toLowerCase().includes(q);
        
      return matchMonth && matchStatus && matchSearch;
    });
  }, [payments, selectedMonth, paymentStatusFilter, searchQuery]);

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
          { id: 'finance', label: 'Controle Financeiro' },
          { id: 'prizes', label: 'Estoque de Prêmios' },
          { id: 'plans', label: 'Planos de Anúncio' }
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
          {/* Banner de Alerta de Vencimento no Mês */}
          {expiringThisMonthList.length > 0 && (
            <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.2)', padding: '16px 20px', borderRadius: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#facc15' }}>
                <Clock size={16} />
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Aviso: {expiringThisMonthList.length} {expiringThisMonthList.length === 1 ? 'assinatura vence' : 'assinaturas vencem'} este mês!
                </h4>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {expiringThisMonthList.map(p => {
                  const end = new Date(p.start_date + 'T12:00:00');
                  end.setMonth(end.getMonth() + p.duration_months);
                  return (
                    <span key={p.id} style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', color: '#f4f4f5' }}>
                      <strong>{p.company_name}</strong> (Vence em {end.toLocaleDateString('pt-BR')})
                    </span>
                  );
                })}
              </div>
            </div>
          )}

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
                          {partner.status === 'active' && (() => {
                            const start = new Date(partner.start_date + 'T12:00:00');
                            start.setMonth(start.getMonth() + partner.duration_months);
                            const today = new Date();
                            today.setHours(12, 0, 0, 0); // Normaliza tempo
                            const diffTime = start.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays <= 0) {
                              return (
                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#f87171', marginTop: '6px', fontWeight: 700 }}>
                                  Vencido há {Math.abs(diffDays)} dias
                                </span>
                              );
                            } else if (diffDays <= 30) {
                              return (
                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#facc15', marginTop: '6px', fontWeight: 700 }}>
                                  Restam {diffDays} dias
                                </span>
                              );
                            } else {
                              return (
                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#71717a', marginTop: '6px', fontWeight: 500 }}>
                                  Restam {diffDays} dias
                                </span>
                              );
                            }
                          })()}
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

      {/* ────────────────── ABA 2: CONTROLE FINANCEIRO ────────────────── */}
      {activeTab === 'finance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          
          {/* Tabela de Mensalidades */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f4f4f5' }}>Controle de Mensalidades Financeiras</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                
                {/* Filtro por Mês de Vencimento */}
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 12px', color: '#f4f4f5', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">Todos os Meses</option>
                  {availableFinanceMonths.map(m => {
                    const [year, month] = m.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                  })}
                </select>

                {/* Filtro por Status do Pagamento */}
                <select
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 12px', color: '#f4f4f5', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Atrasado</option>
                </select>

              </div>
            </div>

            {payments.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#52525b', fontSize: '0.8rem' }}>
                Nenhuma mensalidade financeira registrada.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #27272a' }}>
                      {['Parceiro', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'Meio', 'Ações'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#52525b' }}>
                          Nenhuma mensalidade encontrada para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map(p => {
                        const isOverdue = p.status === 'overdue';
                        const isPaid = p.status === 'paid';
                        
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #1c1c1f' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f4f4f5' }}>
                              {p.tv_partners?.company_name || 'Parceiro Desconhecido'}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 750, color: '#f4f4f5' }}>
                              {formatCurrency(p.amount)}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#d4d4d8' }}>
                              {new Date(p.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#71717a' }}>
                              {p.payment_date ? new Date(p.payment_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <button
                                onClick={() => handleTogglePaymentStatus(p)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                                  background: isPaid ? 'rgba(34,197,94,0.1)' : isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(250,204,21,0.1)',
                                  color: isPaid ? '#4ade80' : isOverdue ? '#f87171' : '#facc15'
                                }}
                                title={isPaid ? "Clique para reverter para Pendente" : "Clique para registrar pagamento"}
                              >
                                {isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                              </button>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 650 }}>
                              {p.payment_method || '-'}
                            </td>
                            <td style={{ padding: '12px 16px', width: '60px' }}>
                              <button
                                onClick={() => handleDeletePayment(p)}
                                style={{ padding: '4px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                                title="Excluir Parcela"
                              >
                                <Trash size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Painel lateral de Confirmação de Pagamento */}
          {isPaymentFormOpen && confirmingPayment ? (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f4f4f5' }}>
                  Confirmar Pagamento
                </h4>
                <button onClick={() => { setIsPaymentFormOpen(false); setConfirmingPayment(null); }} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                  <XCircle size={16} />
                </button>
              </div>

              <div style={{ marginBottom: '14px', background: 'rgba(200,169,126,0.03)', border: '1px solid rgba(200,169,126,0.1)', padding: '12px', borderRadius: '10px' }}>
                <p style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', margin: 0 }}>Empresa</p>
                <p style={{ fontSize: '0.85rem', color: '#f4f4f5', fontWeight: 700, margin: '2px 0 6px 0' }}>{confirmingPayment.tv_partners?.company_name}</p>
                <p style={{ fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase', margin: 0 }}>Valor da Parcela</p>
                <p style={{ fontSize: '1rem', color: 'var(--brand)', fontWeight: 800, margin: '2px 0 0 0' }}>{formatCurrency(confirmingPayment.amount)}</p>
              </div>

              <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Data do Pagamento *</label>
                  <input required type="date" style={inputStyle} value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Meio de Pagamento</label>
                  <input readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} value="Cartão de Crédito" />
                </div>
                <div>
                  <label style={labelStyle}>Observações</label>
                  <textarea style={{ ...inputStyle, resize: 'none', height: '60px' }} value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Ex: Comprovante enviado via WhatsApp..." />
                </div>

                <button
                  type="submit"
                  style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px', boxShadow: '0 4px 12px rgba(34,197,94,0.15)' }}
                >
                  Registrar Recebimento
                </button>
              </form>
            </div>
          ) : (
            <div style={{ background: 'rgba(24,24,27,0.3)', border: '1px dashed #27272a', borderRadius: '16px', padding: '32px 20px', textAlign: 'center', color: '#52525b', fontSize: '0.75rem' }}>
              <Calendar size={24} style={{ margin: '0 auto 8px', color: '#3f3f46' }} />
              Selecione "Pendente" ou "Atrasado" na tabela para registrar um recebimento.
            </div>
          )}

        </div>
      )}

      {/* ────────────────── ABA 3: PLANOS DE ANÚNCIO ────────────────── */}
      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          
          {/* Tabela de Planos */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f4f4f5' }}>Planos Disponíveis</h3>
              <button
                onClick={() => { setEditPlan(null); setPlanForm({ name: '', default_price: 0, description: '', duration_months: 1 }); setIsPlanFormOpen(true); }}
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
                      {['Nome do Plano', 'Duração', 'Valor Padrão', 'Descrição', 'Ações'].map(h => (
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
                        <td style={{ padding: '12px 16px', fontWeight: 650, color: '#e4e4e7' }}>
                          {p.duration_months === 1 ? 'Mensal' : p.duration_months === 3 ? 'Trimestral' : p.duration_months === 6 ? 'Semestral' : p.duration_months === 12 ? 'Anual' : `${p.duration_months} meses`}
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
                              onClick={() => { setEditPlan(p); setPlanForm({ name: p.name, default_price: p.default_price, description: p.description || '', duration_months: p.duration_months || 1 }); setIsPlanFormOpen(true); }}
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
                  <label style={labelStyle}>Duração Padrão *</label>
                  <select required style={{ ...inputStyle, cursor: 'pointer' }} value={planForm.duration_months} onChange={e => setPlanForm({ ...planForm, duration_months: parseInt(e.target.value) || 1 })}>
                    <option value={1}>1 mês (Mensal)</option>
                    <option value={3}>3 meses (Trimestral)</option>
                    <option value={6}>6 meses (Semestral)</option>
                    <option value={12}>12 meses (Anual)</option>
                  </select>
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
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f4f4f5' }}>Controle de Prêmios e Permutas Físicas</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 12px', color: '#f4f4f5', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">Todos os Meses</option>
                  {availableMonths.map(m => {
                    const [year, month] = m.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                  })}
                </select>
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
                      last_used_date: '',
                      notes: ''
                    });
                    setIsPrizeFormOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--brand)', color: 'white', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={12} /> Registrar Doação
                </button>
              </div>
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
                       {['Parceiro Doador', 'Descrição do Prêmio', 'Recebidos', 'Utilizados', 'Saldo Restante', 'Recebimento', 'Data de Uso', 'Ações'].map(h => (
                         <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                           {h}
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {filteredPrizes.length === 0 ? (
                       <tr>
                         <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#52525b' }}>
                           Nenhum prêmio encontrado para o mês selecionado.
                         </td>
                       </tr>
                     ) : (
                       filteredPrizes.map(p => {
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
                           <td style={{ padding: '12px 16px', color: '#71717a' }}>
                             {p.last_used_date ? new Date(p.last_used_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
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
                                     last_used_date: p.last_used_date || '',
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
                    })
                  )}
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
                   <label style={labelStyle}>Data do Último Uso</label>
                   <input type="date" style={inputStyle} value={prizeForm.last_used_date} onChange={e => setPrizeForm({ ...prizeForm, last_used_date: e.target.value })} />
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
