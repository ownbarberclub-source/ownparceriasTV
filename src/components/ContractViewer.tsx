import { useRef } from 'react';
import type { Partner } from '../types';
import { X, Copy, Printer } from 'lucide-react';
import logoImg from '../assets/logo.png';

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

  const getContractText = () => {
    const clause2 = partner.payment_type === 'permuta'
      ? `O(A) CONTRATADO(A) opta pelo plano "${partner.plan_name}" na modalidade de PERMUTA comercial, comprometendo-se a fornecer mensalmente à CONTRATANTE ${partner.barter_product_quantity} unidades do produto/serviço "${partner.barter_product_description}", correspondendo ao valor estimado de ${formatCurrency(partner.monthly_price)} (${valorExtenso(partner.monthly_price)}) por mês.`
      : `O(A) CONTRATADO(A) opta pelo plano "${partner.plan_name}", com valor mensal de ${formatCurrency(partner.monthly_price)} (${valorExtenso(partner.monthly_price)}).`;

    const clause6 = partner.payment_type === 'permuta'
      ? `A contraprestação dar-se-á através da entrega mensal dos produtos/serviços detalhados na Cláusula 2ª na sede da CONTRATANTE, devendo ser entregues em perfeitas condições de uso.`
      : `O pagamento das mensalidades da assinatura deverá ser efetuado mensalmente via cartão de crédito através da plataforma ASAAS, mediante link de pagamento disponibilizado pela CONTRATANTE.`;

    return `
TERMO DE PARCERIA COMERCIAL - OWN BARBER CLUB

CONTRATANTE: OWN BARBER CLUB LTDA, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº 19.690.372/0001-15, com sede na Avenida Fernando Machado, 1470, Centro, Chapecó/SC, CEP: 89803-003, neste ato representada por seu sócio-administrador Jeferson Cesar Lira, portador do CPF nº 000.174.370-83, doravante denominada simplesmente CONTRATANTE.

CONTRATADO(A): ${partner.company_name}${partner.trade_name ? ` (${partner.trade_name})` : ''}, inscrito(a) sob CNPJ/CPF nº ${partner.cnpj_cpf}, com sede/domicílio no endereço ${partner.address}, representado(a) por ${partner.contact_name}, doravante denominado(a) CONTRATADO(A).

CLÁUSULA 1ª – DO OBJETO
O presente termo tem como objeto a parceria comercial entre as partes para veiculação de conteúdo publicitário do(a) CONTRATADO(A) nas TVs indoor das unidades da CONTRATANTE (OWN Barber Club), conforme condições abaixo especificadas.

CLÁUSULA 2ª – DO PLANO CONTRATADO
${clause2}

CLÁUSULA 3ª – DA VIGÊNCIA
O presente termo terá vigência de ${partner.duration_months} (${partner.duration_months === 1 ? 'um' : partner.duration_months === 12 ? 'doze' : partner.duration_months}) meses, com início em ${formatDate(partner.start_date)} e término previsto em ${endDate()}, podendo ser renovado mediante acordo entre as partes.

CLÁUSULA 4ª – DAS OBRIGAÇÕES DA CONTRATANTE
a) Disponibilizar espaço de exibição nas TVs indoor das suas unidades;
b) Garantir a veiculação do material publicitário aprovado durante o período contratado;
c) Manter as TVs em funcionamento durante o horário de operação das unidades.

CLÁUSULA 5ª – DAS OBRIGAÇÕES DO(A) CONTRATADO(A)
a) Efetuar a contraprestação mensal na data e formato acordados;
b) Fornecer o material publicitário em formato e qualidade adequados;
c) Garantir que o conteúdo veiculado esteja em conformidade com a legislação vigente.

CLÁUSULA 6ª – DO PAGAMENTO
${clause6}

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

Chapecó/SC, ${formatDate(partner.start_date)}.
    `.trim();
  };

  const contractText = getContractText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractText);
      alert('Contrato copiado para a área de transferência!');
    } catch {
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
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body {
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
          }
          h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 13pt;
            text-align: center;
            margin-top: 0;
            margin-bottom: 4px;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #111;
            page-break-after: avoid;
          }
          p {
            margin-bottom: 10px;
            text-align: justify;
            text-indent: 1.2cm;
          }
          p.clause-title, p.date-line {
            text-indent: 0;
          }
          .signature-section p {
            text-indent: 0;
          }
          .signature-section {
            margin-top: 35px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            gap: 40px;
          }
          .signature-box {
            flex: 1;
          }
          .signature-line {
            border-top: 1px solid #111;
            margin: 30px 0 6px 0;
          }
          .signature-name {
            font-size: 8pt;
            font-weight: bold;
            color: #333;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        
        <!-- Header com Logo e Cores OWN -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #C8A97E; padding-bottom: 16px; margin-bottom: 28px; page-break-inside: avoid;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="${window.location.origin}${logoImg}" alt="OWN Logo" style="height: 48px; width: auto; object-fit: contain;" />
            <div style="font-family: 'Montserrat', sans-serif;">
              <h2 style="margin: 0; font-size: 14pt; font-weight: 900; letter-spacing: 0.5px; color: #111;">OWN</h2>
              <span style="font-size: 7pt; text-transform: uppercase; color: #C8A97E; font-weight: 700; letter-spacing: 2px; display: block; margin-top: -2px;">Barber Club</span>
            </div>
          </div>
          <div style="text-align: right; font-family: sans-serif; font-size: 7.5pt; color: #52525b; line-height: 1.4;">
            <strong>OWN BARBER CLUB</strong><br />
            Termo de Parceria Indoor
          </div>
        </div>

        <h1>TERMO DE PARCERIA COMERCIAL</h1>
        <h3 style="text-align:center; font-family: 'Montserrat', sans-serif; font-size: 10.5pt; font-weight: 700; color: #C8A97E; margin-top: 4px; margin-bottom: 24px; letter-spacing: 1px; page-break-after: avoid;">TV INDOOR & B2B SPONSORSHIP</h3>
        
        ${contractText
          .split('\n')
          .filter(line => !line.startsWith('TERMO DE PARCERIA'))
          .map(line => {
            if (line.startsWith('CLÁUSULA')) return '<p class="clause-title" style="margin-top: 18px; margin-bottom: 4px; page-break-after: avoid;"><strong>' + line + '</strong></p>';
            if (line.startsWith('_____')) return '';
            if (line.startsWith('CONTRATANTE -') || line.startsWith('CONTRATADO(A) -') || line.startsWith('CONTRATADO -')) return '';
            if (line.startsWith('Chapecó/SC,') || line.startsWith('Data:')) return '<p class="date-line" style="margin-top: 24px;">' + line + '</p>';
            if (line.trim() === '') return '';
            return '<p>' + line + '</p>';
          })
          .join('\n')
        }

        <!-- Sessão de Assinatura Organizada em Colunas -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">
              CONTRATANTE: OWN BARBER CLUB LTDA<br />
              Representante: Jeferson Cesar Lira<br />
              CPF: 000.174.370-83
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">
              CONTRATADO(A): ${partner.company_name.toUpperCase()}<br />
              Responsável: ${partner.contact_name}
            </div>
          </div>
        </div>

      </body>
      </html>
    `);
    printWindow.document.close();

    // Esperar todos os recursos (imagens, estilos, fontes) carregarem completamente
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fadeIn" style={{ background: '#18181b', border: '1px solid #27272a', width: '100%', maxWidth: '800px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header do Visualizador */}
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
              <Copy size={14} /> Copiar Texto
            </button>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--brand)', color: 'white', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              <Printer size={14} /> Imprimir / PDF
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '8px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview do Contrato */}
        <div ref={contractRef} style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ background: '#fefefe', color: '#1a1a1a', borderRadius: '8px', padding: '40px', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', lineHeight: '1.8' }}>
            
            {/* Header da Visualização em Tela */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #C8A97E', paddingBottom: '20px', marginBottom: '32px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={logoImg} alt="OWN Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                <div style={{ fontFamily: 'sans-serif' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1a1a1a', letterSpacing: '0.5px' }}>OWN</h3>
                  <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#C8A97E', fontWeight: 700, letterSpacing: '1px', display: 'block', marginTop: '-2px' }}>Barber Club</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'sans-serif', fontSize: '0.65rem', color: '#71717a', lineHeight: '1.4' }}>
                <strong>OWN BARBER CLUB</strong><br />
                Termo de Parceria Indoor
              </div>
            </div>

            {/* Texto do Contrato */}
            {contractText.split('\n').map((line, i) => {
              if (line.startsWith('TERMO DE PARCERIA')) {
                return <h2 key={i} style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '2px', fontFamily: 'sans-serif' }}>{line}</h2>;
              }
              if (line.startsWith('CLÁUSULA')) {
                return <p key={i} style={{ fontWeight: 700, marginTop: '20px', marginBottom: '8px' }}>{line}</p>;
              }
              if (line.startsWith('_____')) {
                return null;
              }
              if (line.startsWith('CONTRATANTE -') || line.startsWith('CONTRATADO(A) -') || line.startsWith('CONTRATADO -')) {
                return null;
              }
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} style={{ textAlign: 'justify', marginBottom: '8px' }}>{line}</p>;
            })}

            {/* Preview das Linhas de Assinatura */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '48px', borderTop: '1px solid #e4e4e7', paddingTop: '24px' }}>
              <div>
                <div style={{ borderTop: '1px solid #1a1a1a', width: '90%', margin: '24px 0 4px 0' }}></div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4b5563' }}>
                  CONTRATANTE: OWN BARBER CLUB LTDA<br />
                  Rep: Jeferson Cesar Lira (CPF: 000.174.370-83)
                </div>
              </div>
              <div>
                <div style={{ borderTop: '1px solid #1a1a1a', width: '90%', margin: '24px 0 4px 0' }}></div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4b5563' }}>
                  CONTRATADO(A): {partner.company_name.toUpperCase()}
                </div>
              </div>
            </div>

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
