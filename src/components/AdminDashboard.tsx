import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Partner } from '../types';
import { PartnerForm } from './PartnerForm';
import { ContractViewer } from './ContractViewer';
import {
  Plus, Search, RefreshCw, DollarSign, Users, FileWarning,
  FileText, Edit2, Trash, ExternalLink, CheckCircle2, Clock, XCircle
} from 'lucide-react';

export function AdminDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [contractPartner, setContractPartner] = useState<Partner | null>(null);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tv_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error('Erro ao carregar parceiros:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // KPIs
  const kpis = useMemo(() => {
    const activePartners = partners.filter(p => p.status === 'active');
    const mrr = activePartners.reduce((sum, p) => sum + (p.monthly_price || 0), 0);
    const pendingSign = partners.filter(p => !p.is_signed).length;
    return { total: partners.length, mrr, pendingSign, active: activePartners.length };
  }, [partners]);

  // Filtros
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || p.company_name.toLowerCase().includes(q) || p.contact_name.toLowerCase().includes(q) || p.cnpj_cpf.includes(q) || (p.trade_name || '').toLowerCase().includes(q);
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Faturamento Mensal (MRR)', value: formatCurrency(kpis.mrr), icon: <DollarSign size={20} />, color: '#4ade80' },
          { label: 'Total de Parceiros', value: kpis.total.toString(), icon: <Users size={20} />, color: 'var(--brand)' },
          { label: 'Parceiros Ativos', value: kpis.active.toString(), icon: <CheckCircle2 size={20} />, color: '#60a5fa' },
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

      {/* Toolbar */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
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

      {/* Partners Table */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.8rem', color: '#71717a' }}>Carregando parceiros...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#52525b', fontSize: '0.85rem' }}>
            {searchQuery || statusFilter !== 'all' ? 'Nenhum parceiro encontrado com os filtros aplicados.' : 'Nenhum parceiro cadastrado ainda. Clique em "Novo Parceiro" para começar.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272a' }}>
                  {['Empresa', 'Plano', 'Valor Mensal', 'Status', 'Assinatura', 'Drive', 'Ações'].map(h => (
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
                        <p style={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.8rem' }}>{partner.company_name}</p>
                        <p style={{ color: '#52525b', fontSize: '0.7rem', marginTop: '2px' }}>{partner.contact_name} • {partner.cnpj_cpf}</p>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: 'var(--brand)', color: 'white', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700 }}>
                        {partner.plan_name}
                      </span>
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
                        title="Clique para alternar o status de assinatura"
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
                          title="Gerar Contrato"
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

      {/* Modais */}
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
