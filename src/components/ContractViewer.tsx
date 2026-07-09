import { useRef } from 'react';
import type { Partner } from '../types';
import { X, Copy, Printer } from 'lucide-react';

interface ContractViewerProps {
  partner: Partner;
  onClose: () => void;
}

export function ContractViewer({ partner, onClose }: ContractViewerProps) {
  const contractRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const endDate = () => {
    const dt = new Date(partner.start_date + 'T12:00:00');
    dt.setMonth(dt.getMonth() + partner.duration_months);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const contractText = `
TERMO DE PARCERIA COMERCIAL - OWN BARBER CLUB

CONTRATANTE: OWN BARBER CLUB, empresa do segmento de barbearia premium, doravante denominada CONTRATANTE.

CONTRATADO(A): ${partner.company_name}${partner.trade_name ? ` (${partner.trade_name})` : ''}, inscrito(a) sob CNPJ/CPF nº ${partner.cnpj_cpf}, com sede/domicílio no endereço ${partner.address}, representado(a) por ${partner.contact_name}, doravante denominado(a) CONTRATADO(A).

CLÁUSULA 1ª – DO OBJETO
O presente termo tem como objeto a parceria comercial entre as partes para veiculação de conteúdo publicitário do(a) CONTRATADO(A) nas TVs indoor das unidades da CONTRATANTE (OWN Barber Club), conforme condições abaixo especificadas.

CLÁUSULA 2ª – DO PLANO CONTRATADO
O(A) CONTRATADO(A) opta pelo plano "${partner.plan_name}", com valor mensal de ${formatCurrency(partner.monthly_price)} (${valorExtenso(partner.monthly_price)}).

CLÁUSULA 3ª – DA VIGÊNCIA
O presente termo terá vigência de ${partner.duration_months} (${partner.duration_months === 1 ? 'um' : partner.duration_months === 12 ? 'doze' : partner.duration_months}) meses, com início em ${formatDate(partner.start_date)} e término previsto em ${endDate()}, podendo ser renovado mediante acordo entre as partes.

CLÁUSULA 4ª – DAS OBRIGAÇÕES DA CONTRATANTE
a) Disponibilizar espaço de exibição nas TVs indoor das suas unidades;
b) Garantir a veiculação do material publicitário aprovado durante o período contratado;
c) Manter as TVs em funcionamento durante o horário de operação das unidades.

CLÁUSULA 5ª – DAS OBRIGAÇÕES DO(A) CONTRATADO(A)
a) Efetuar o pagamento mensal na data acordada;
b) Fornecer o material publicitário em formato e qualidade adequados;
c) Garantir que o conteúdo veiculado esteja em conformidade com a legislação vigente.

CLÁUSULA 6ª – DO PAGAMENTO
O pagamento deverá ser efetuado até o dia 10 (dez) de cada mês, mediante transferência bancária, PIX ou boleto bancário, conforme acordado entre as partes.

CLÁUSULA 7ª – DA RESCISÃO
O presente termo poderá ser rescindido por qualquer uma das partes mediante aviso prévio de 30 (trinta) dias, sem multa rescisória, desde que não haja débitos pendentes.

CLÁUSULA 8ª – DO FORO
Fica eleito o foro da comarca de domicílio da CONTRATANTE para dirimir quaisquer questões decorrentes deste termo.

E por estarem assim justas e acordadas, as partes firmam o presente instrumento.

_____________________________________________
CONTRATANTE - OWN BARBER CLUB

_____________________________________________
CONTRATADO(A) - ${partner.company_name.toUpperCase()}
${partner.contact_name}

Data: ____/____/________
  `.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractText);
      alert('Contrato copiado para a área de transferência!');
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = contractText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Contrato copiado para a área de transferência!');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Contrato - ${partner.company_name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #000; margin: 40px 60px; }
          h1 { font-size: 15pt; text-align: center; margin-bottom: 32px; font-weight: 700; letter-spacing: 2px; }
          p { margin-bottom: 16px; text-align: justify; }
          .signature { margin-top: 60px; }
          .signature-line { border-top: 1px solid #000; width: 50%; margin: 40px auto 4px; }
          .signature-name { text-align: center; font-size: 10pt; }
        </style>
      </head>
      <body>
        <h1>TERMO DE PARCERIA COMERCIAL</h1>
        <h2 style="text-align:center; font-size: 12pt; font-weight: 400; margin-bottom: 32px;">OWN BARBER CLUB</h2>
        ${contractText
          .split('\n')
          .filter(line => !line.startsWith('TERMO DE PARCERIA'))
          .map(line => {
            if (line.startsWith('CLÁUSULA')) return '<p><strong>' + line + '</strong></p>';
            if (line.startsWith('_____')) return '<div class="signature-line"></div>';
            if (line.startsWith('CONTRATANTE') || line.startsWith('CONTRATADO')) return '<p class="signature-name">' + line + '</p>';
            if (line.trim() === '') return '';
            return '<p>' + line + '</p>';
          })
          .join('\n')
        }
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fadeIn" style={{ background: '#18181b', border: '1px solid #27272a', width: '100%', maxWidth: '800px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(24,24,27,0.5)' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f4f4f5' }}>
              Termo de Parceria
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '4px' }}>
              {partner.company_name} — Plano {partner.plan_name}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#27272a', color: '#d4d4d8', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #3f3f46', cursor: 'pointer' }}>
              <Copy size={14} /> Copiar
            </button>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--brand)', color: 'white', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              <Printer size={14} /> Imprimir / PDF
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '8px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contract Content */}
        <div ref={contractRef} style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ background: '#fefefe', color: '#1a1a1a', borderRadius: '8px', padding: '40px', fontFamily: "'Times New Roman', serif", fontSize: '0.85rem', lineHeight: '1.8' }}>
            {contractText.split('\n').map((line, i) => {
              if (line.startsWith('TERMO DE PARCERIA')) {
                return <h2 key={i} style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '2px' }}>{line}</h2>;
              }
              if (line.startsWith('CLÁUSULA')) {
                return <p key={i} style={{ fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>{line}</p>;
              }
              if (line.startsWith('_____')) {
                return <div key={i} style={{ borderTop: '1px solid #333', width: '60%', margin: '32px auto 4px' }} />;
              }
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} style={{ textAlign: 'justify', marginBottom: '8px' }}>{line}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function valorExtenso(valor: number): string {
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (inteiro === 0) return 'zero reais';
  if (inteiro === 100) return 'cem reais';

  const partes: string[] = [];
  
  if (inteiro >= 1000) {
    const milhar = Math.floor(inteiro / 1000);
    partes.push(milhar === 1 ? 'mil' : unidades[milhar] + ' mil');
  }

  const resto = inteiro % 1000;
  if (resto >= 100) {
    partes.push(centenas[Math.floor(resto / 100)]);
  }
  const dezena = resto % 100;
  if (dezena >= 10 && dezena < 20) {
    partes.push(especiais[dezena - 10]);
  } else {
    if (dezena >= 20) partes.push(dezenas[Math.floor(dezena / 10)]);
    if (dezena % 10 > 0) partes.push(unidades[dezena % 10]);
  }

  let resultado = partes.join(' e ') + (inteiro === 1 ? ' real' : ' reais');
  if (centavos > 0) {
    resultado += ' e ' + centavos + (centavos === 1 ? ' centavo' : ' centavos');
  }
  return resultado;
}
