import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LabelList } from 'recharts';
import type { BillAnalysis } from '../types';
import type { Configuration } from '../App';
import { Leaf, AlertTriangle, TrendingUp, Info, Sun, CalendarDays, Send, Landmark } from './IconComponents';

interface AnalysisResultProps {
  data: BillAnalysis;
  investmentCost: number;
  config: Configuration;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const formatPreciseCurrency = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(value);
const formatNumber = (value: number, fractionDigits = 2) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: fractionDigits }).format(value);
const formatInteger = (value: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(value);


const InfoCard: React.FC<{ title: string; value: string; subtext?: string; icon: React.ReactNode; color: string; }> = ({ title, value, subtext, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-start space-x-4 h-full">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const costoAttuale = payload.find((p: any) => p.dataKey === 'Costo Attuale')?.value || 0;
    const costoKit = payload.find((p: any) => p.dataKey === 'Costo con Kit Solare')?.value || 0;
    const risparmio = costoAttuale - costoKit;

    return (
      <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-lg text-sm">
        <p className="font-bold mb-2">{label}</p>
        <p className="text-primary">Costo Attuale: <strong>{formatCurrency(costoAttuale)}</strong></p>
        <p className="text-secondary">Costo con Kit: <strong>{formatCurrency(costoKit)}</strong></p>
        <hr className="my-1"/>
        <p className="font-semibold text-emerald-600">Risparmio: <strong>{formatCurrency(risparmio)}</strong></p>
      </div>
    );
  }

  return null;
};

const PrerequisiteCheck: React.FC<{checked: boolean, onChange: (checked: boolean) => void, children: React.ReactNode}> = ({ checked, onChange, children }) => (
    <label className="flex items-start space-x-3 cursor-pointer text-left">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary mt-1 flex-shrink-0"
            required
        />
        <span className="text-sm text-gray-700">{children}</span>
    </label>
);

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, investmentCost, config }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Prerequisite states
  const [meterOk, setMeterOk] = useState(false);
  const [spaceOk, setSpaceOk] = useState(false);
  const [exposureOk, setExposureOk] = useState(false);
  const [outletOk, setOutletOk] = useState(false);

  const requiredSpace = useMemo(() => {
    const spacePerPanel = config.panel.type === 'rigid' ? 2 : 1; // 2mq for rigid, 1mq for flexible
    return config.panel.count * spacePerPanel;
  }, [config]);
  
  const costoMensileAttuale = data.costo_totale / data.periodo_fatturazione_mesi;
  
  const paybackYears = investmentCost > 0 && data.risparmio_annuale_eur > 0 
    ? (investmentCost / data.risparmio_annuale_eur) 
    : null;

  const consumptionChartData = [
    { name: 'Consumo Mensile', 'Acquisto da Rete': Math.max(0, data.consumo_mensile_kwh - data.autoconsumo_kwh), 'Autoconsumo FV': data.autoconsumo_kwh },
  ];

  const yearlyProjectionData = Array.from({ length: 12 }, (_, i) => {
    const mese = new Date(0, i).toLocaleString('it-IT', { month: 'short' });
    return {
      mese: mese.charAt(0).toUpperCase() + mese.slice(1),
      'Costo Attuale': costoMensileAttuale * (i + 1),
      'Costo con Kit Solare': Math.max(0, data.nuova_bolletta_mensile_eur) * (i + 1),
    };
  });

  const decadeProjectionData = Array.from({ length: 10 }, (_, i) => ({
    anno: `Anno ${i + 1}`,
    'Risparmio Cumulativo': data.risparmio_annuale_eur * (i + 1),
  }));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyChecked || !meterOk || !spaceOk || !exposureOk || !outletOk) {
        setFormError('Per favore, compila tutti i campi e accetta le condizioni per procedere.');
        return;
    }
    setFormError('');
    
    const subject = `CONTATTO SOLEASY`;
    let body = `
  Nuova richiesta di contatto e sopralluogo ricevuta dall'analizzatore SOLEASY.

  ========================================
  DATI UTENTE
  ========================================
  - Provincia: ${data.provincia_estratta}
  - Email: ${email}
  - Telefono: ${phone}
  - Codice Sconto/Segnalatore: ${discountCode.trim() || 'Nessuno'}

  ========================================
  VERIFICA DI FATTIBILITÀ (confermata dall'utente)
  ========================================
  - Contatore Idoneo (con frecce ⇦⇨): Sì
  - Spazio Disponibile (~${requiredSpace}mq): Sì
  - Buona Esposizione Solare: Sì
  - Presa Schuko Vicina: Sì

  ========================================
  CONFIGURAZIONE SCELTA
  ========================================
  - Batteria di Accumulo: ${config.batteryKwh} kWh
  - Pannelli: ${config.panel.count} x ${config.panel.type === 'rigid' ? 'Rigidi (430W)' : 'Flessibili (220W)'}
  - Servizi Inclusi:
    - Registrazione E-Distribuzione: ${config.services.registration ? 'Sì' : 'No'}
    - Conformità impianto: ${config.services.compliance ? 'Sì' : 'No'}
    - Installazione: ${config.services.installation !== 'none' ? config.services.installation : 'Nessuna'}

  ========================================
  RIEPILOGO ECONOMICO
  ========================================
  - Investimento Totale (IVA 10% incl.): ${formatCurrency(investmentCost)}
  - Costo Netto Stimato (detrazione 50%): ${formatCurrency(investmentCost / 2)}
  - Tempo di Rientro Stimato: ${paybackYears ? `${paybackYears.toFixed(1)} anni` : 'N/A'}

  ========================================
  SINTESI ANALISI BOLLETTA
  ========================================
  - Costo attuale per kWh: ${formatPreciseCurrency(data.costo_per_kwh)}
  - Consumo mensile attuale: ${formatInteger(data.consumo_mensile_kwh)} kWh
  - Bolletta mensile attuale: ${formatCurrency(costoMensileAttuale)}
  ---
  - Produzione FV mensile stimata: ${formatInteger(data.produzione_fv_mensile_kwh)} kWh
  - Autoconsumo stimato: ${formatInteger(data.autoconsumo_kwh)} kWh
  - Nuova bolletta mensile stimata: ${formatCurrency(Math.max(0, data.nuova_bolletta_mensile_eur))}
  ---
  - RISPARMIO MENSILE STIMATO: ${formatCurrency(data.risparmio_mensile_eur)}
  - RISPARMIO ANNUALE STIMATO: ${formatCurrency(data.risparmio_annuale_eur)}
  - RISPARMIO IN 10 ANNI STIMATO: ${formatCurrency(data.risparmio_10_anni_eur)}
  ---
  - CO₂ evitata annualmente: ${formatInteger(data.co2_evitata_annuale_kg)} kg

  Si prega di ricontattare l'utente al più presto per fissare un sopralluogo.
    `;

    const mailtoLink = `mailto:prospherasoluzionisrl@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;

    setFormSubmitted(true);
  };
  
  const allPrerequisitesMet = meterOk && spaceOk && exposureOk && outletOk;

  return (
    <div className="mt-8 space-y-12 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-primary text-center">Risultati dell'Analisi per il tuo Kit SOLEASY</h2>
         <div className="mt-6 max-w-md mx-auto bg-blue-50 p-6 rounded-2xl border-2 border-primary shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-4 text-center">Riepilogo Investimento</h3>
            <div className="space-y-2 text-gray-700">
                <div className="flex justify-between text-lg font-bold text-primary pt-2">
                    <span>INVESTIMENTO TOTALE</span>
                    <span>{formatCurrency(investmentCost)}</span>
                </div>
                <p className="text-xs text-center text-gray-500">(IVA 10% inclusa)</p>
            </div>
             <div className="text-sm text-center text-emerald-800 mt-4 bg-emerald-100 p-3 rounded-lg border border-emerald-200">
                <p>Questo investimento è <strong className="font-bold">detraibile al 50% in 10 anni</strong>.</p>
                <p className="font-bold mt-1">Costo finale netto stimato: {formatCurrency(investmentCost / 2)}</p>
             </div>
        </div>

        <div className="p-4 mt-6 rounded-lg bg-blue-50 border border-blue-200 flex items-start space-x-4">
            <Info className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
                <h3 className="font-semibold text-primary">Valutazione Contratto Attuale</h3>
                <p className="text-gray-700">{data.valutazione_contratto} Il tuo costo onnicomprensivo è di <strong>{formatPreciseCurrency(data.costo_per_kwh)} per kWh</strong>.</p>
            </div>
        </div>
      </div>

      {/* Monthly Analysis */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 text-center border-b pb-2">Analisi Mensile e Rientro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-5 gap-4">
            <InfoCard title="Risparmio Mensile" value={formatCurrency(data.risparmio_mensile_eur)} icon={<TrendingUp className="h-6 w-6 text-white"/>} color="bg-secondary" />
            <InfoCard title="Nuova Bolletta" value={formatCurrency(Math.max(0, data.nuova_bolletta_mensile_eur))} subtext="Costo stimato post-FV" icon={<AlertTriangle className="h-6 w-6 text-primary"/>} color="bg-gray-200" />
            <InfoCard title="CO₂ Evitata" value={`${formatInteger(data.co2_evitata_kg)} kg`} subtext="Ogni mese" icon={<Leaf className="h-6 w-6 text-white"/>} color="bg-emerald-500" />
            <InfoCard title="Irraggiamento Solare" value={`${formatNumber(data.irraggiamento_solare_medio, 1)} ore/giorno`} subtext={`${data.provincia_estratta}`} icon={<Sun className="h-6 w-6 text-white"/>} color="bg-sky-500" />
            {paybackYears && (
              <InfoCard title="Tempo di Rientro" value={`${paybackYears.toFixed(1)} anni`} subtext="Stima rientro investimento" icon={<Landmark className="h-6 w-6 text-white"/>} color="bg-indigo-500" />
            )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-700 mb-4 text-center">Origine Energia Mensile (kWh)</h3>
             <ResponsiveContainer width="100%" height={100}>
                <BarChart data={consumptionChartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${formatInteger(value as number)}`}/>
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip formatter={(value) => `${formatInteger(value as number)} kWh`} />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    <Bar dataKey="Acquisto da Rete" stackId="a" fill="#0054A6">
                       <LabelList dataKey="Acquisto da Rete" position="center" className="font-bold fill-white" formatter={(value: number) => value > 0 ? formatInteger(value) : ''} />
                    </Bar>
                    <Bar dataKey="Autoconsumo FV" stackId="a" fill="#FDB813" >
                       <LabelList dataKey="Autoconsumo FV" position="center" className="font-bold fill-primary" formatter={(value: number) => value > 0 ? formatInteger(value) : ''} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Long-term Projections */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 text-center border-b pb-2">Proiezioni a Lungo Termine</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
           <InfoCard title="Risparmio 1 Anno" value={formatCurrency(data.risparmio_annuale_eur)} icon={<CalendarDays className="h-6 w-6 text-primary"/>} color="bg-yellow-300" />
           <InfoCard title="Risparmio 10 Anni" value={formatCurrency(data.risparmio_10_anni_eur)} icon={<CalendarDays className="h-6 w-6 text-white"/>} color="bg-secondary" />
           <InfoCard title="CO₂ Evitata in 1 Anno" value={`${formatInteger(data.co2_evitata_annuale_kg)} kg`} icon={<Leaf className="h-6 w-6 text-white"/>} color="bg-emerald-500" />
           <InfoCard title="CO₂ Evitata in 10 Anni" value={`${formatNumber(data.co2_evitata_10_anni_kg / 1000, 1)} t`} subtext="Tonnellate di CO₂" icon={<Leaf className="h-6 w-6 text-white"/>} color="bg-teal-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-700 mb-4 text-center">Costi Cumulativi in 12 Mesi</h3>
              <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yearlyProjectionData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mese" />
                      <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="Costo Attuale" stroke="#0054A6" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="Costo con Kit Solare" stroke="#FDB813" strokeWidth={3} dot={false} />
                  </LineChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-700 mb-4 text-center">Crescita del Risparmio in 10 Anni</h3>
              <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={decadeProjectionData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                      <defs>
                          <linearGradient id="colorRisparmio" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FDB813" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#FDB813" stopOpacity={0.1}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="anno" />
                      <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Area type="monotone" dataKey="Risparmio Cumulativo" stroke="#FDB813" strokeWidth={3} fillOpacity={1} fill="url(#colorRisparmio)" />
                  </AreaChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Next Steps & Form */}
      <div className="mt-16 text-center bg-blue-50 p-8 rounded-2xl border border-blue-200">
        <h2 className="text-3xl font-bold text-primary mb-4">Il Tuo Futuro Energetico Inizia Oggi!</h2>
        <p className="text-gray-700 max-w-3xl mx-auto mb-6">
          Come hai visto, installare un kit fotovoltaico Soeasy non è solo una scelta intelligente per le tue finanze, ma un passo concreto verso un futuro più sostenibile. Stai per unirti a una comunità che produce la propria energia pulita.
        </p>

        {formSubmitted ? (
             <div className="p-6 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800">
                <h3 className="font-bold text-xl">Grazie!</h3>
                <p>La tua richiesta è stata inviata con successo. Verrai ricontattato al più presto da un nostro consulente.</p>
             </div>
        ) : (
            <div className="max-w-xl mx-auto">
                <h3 className="text-xl font-semibold text-primary mb-4">Pronto a fare il passo successivo?</h3>
                <p className="text-gray-600 mb-6">Richiedi un sopralluogo gratuito e senza impegno. Compila i campi qui sotto e ti contatteremo per una consulenza personalizzata.</p>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className='p-4 border rounded-lg bg-white space-y-4'>
                        <h4 className="font-semibold text-primary text-center">Verifica di Fattibilità</h4>
                         <PrerequisiteCheck checked={meterOk} onChange={setMeterOk}>
                           Confermo che il mio contatore di rete è stato sostituito di recente ed è adatto all'autoconsumo (mostra le frecce ⇦⇨).
                         </PrerequisiteCheck>
                         <PrerequisiteCheck checked={spaceOk} onChange={setSpaceOk}>
                           Confermo di avere lo spazio necessario per l'installazione (circa <strong>{requiredSpace}mq</strong> per la configurazione scelta).
                         </PrerequisiteCheck>
                         <PrerequisiteCheck checked={exposureOk} onChange={setExposureOk}>
                           Confermo che la mia casa ha una buona esposizione al sole durante la giornata.
                         </PrerequisiteCheck>
                         <PrerequisiteCheck checked={outletOk} onChange={setOutletOk}>
                           Confermo di avere una normale presa Schuko a pochi metri dal punto di installazione.
                         </PrerequisiteCheck>
                    </div>

                    <div className={`transition-opacity duration-500 ${allPrerequisitesMet ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={`Provincia: ${data.provincia_estratta}`}
                                className="w-full bg-gray-200 border border-gray-300 rounded-lg p-3 text-center cursor-not-allowed"
                                disabled
                            />
                            <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value)}
                                placeholder="Codice SCONTO/SEGNALATORE (Opzionale)"
                                className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-secondary focus:border-secondary transition"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="La tua Email"
                                className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-secondary focus:border-secondary transition"
                                required
                            />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Il tuo Numero di Telefono"
                                className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-secondary focus:border-secondary transition"
                                required
                            />
                        </div>
                    </div>
                     <div className="flex items-center justify-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="privacy"
                            checked={privacyChecked}
                            onChange={(e) => setPrivacyChecked(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-secondary"
                            required
                        />
                        <label htmlFor="privacy" className="text-sm text-gray-600">
                            Ho letto e accetto la <a href="http://soleasy.byethost33.com/privacy" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-secondary">politica sulla privacy</a>.
                        </label>
                    </div>
                     {formError && <p className="text-red-600 text-sm mt-2">{formError}</p>}
                    <button
                        type="submit"
                        disabled={!email || !phone || !privacyChecked || !allPrerequisitesMet}
                        className="w-full flex items-center justify-center gap-2 bg-secondary hover:brightness-95 text-primary font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        <Send className="h-5 w-5" />
                        Richiedi Sopralluogo Gratuito
                    </button>
                </form>
            </div>
        )}
      </div>
      
    </div>
  );
};