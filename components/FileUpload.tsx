import React, { useCallback, useState, useMemo, useEffect } from 'react';
import type { Configuration } from '../App';
import { 
    UploadCloud, FileImage, FileText, SolarPanel, Battery, ShieldCheck, Waves,
    DocumentCheck, Garden, Building, Home, Roof 
} from './IconComponents';

interface FileUploadProps {
  onFileChange: (file: File) => void;
  onAnalyze: () => void;
  previewUrl: string | null;
  isLoading: boolean;
  file: File | null;
  config: Configuration;
  onConfigChange: (config: Configuration) => void;
  onCostChange: (cost: number) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

const PRICES = {
  battery: { 2.5: 1400, 5: 2200 },
  panel: {
    rigid: { 4: 850, 6: 1275, 8: 1700 },
    flexible: { 4: 850, 8: 1700, 12: 2550 },
  },
  services: {
    registration: 80,
    compliance: 350,
    installation: { none: 0, garden: 150, balcony: 250, canopy: 300, roof: 400 },
  },
};

const installationOptions = {
    garden: { label: 'Giardino', icon: <Garden className="w-5 h-5 text-primary" /> },
    balcony: { label: 'Balcone', icon: <Building className="w-5 h-5 text-primary" /> },
    canopy: { label: 'Tettoia piano terra', icon: <Home className="w-5 h-5 text-primary" /> },
    roof: { label: 'Tetto', icon: <Roof className="w-5 h-5 text-primary" /> },
} as const;

const Section: React.FC<{ title: string; subtitle: string; step: number; children: React.ReactNode }> = ({ title, subtitle, step, children }) => (
    <div>
        <h2 className="text-xl font-semibold text-primary mb-2">{step}. {title}</h2>
        <p className="text-gray-600 mb-6">{subtitle}</p>
        {children}
    </div>
);

const IconGrid: React.FC<{ count: number; icon: React.ReactNode; className?: string; }> = ({ count, icon, className }) => (
    <div className={`grid gap-1 ${className}`} style={{ gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`}}>
        {Array.from({ length: count }).map((_, i) => <div key={i}>{icon}</div>)}
    </div>
)

const OptionCard: React.FC<{ title: React.ReactNode; description: string; price: string; isSelected: boolean; onClick: () => void; }> = ({ title, description, price, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[160px] ${isSelected ? 'border-secondary shadow-lg scale-105 bg-yellow-50' : 'border-gray-300 hover:border-secondary hover:bg-yellow-50'}`}
    >
        <div className="text-center flex-grow flex flex-col justify-center items-center">
            <div className={`mb-2 font-bold ${isSelected ? 'text-secondary' : 'text-primary'}`}>{title}</div>
            <p className="text-sm text-gray-700 mb-2">{description}</p>
        </div>
        <p className="text-center font-semibold text-primary mt-2">{price}</p>
    </div>
);

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, onAnalyze, previewUrl, isLoading, file, config, onConfigChange, onCostChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const { cost, hardwareCost, servicesCost, subtotal, vat } = useMemo(() => {
    let panelCost = 0;
    if (config.panel.type === 'rigid') {
        panelCost = PRICES.panel.rigid[config.panel.count as 4 | 6 | 8];
    } else {
        panelCost = PRICES.panel.flexible[config.panel.count as 4 | 8 | 12];
    }

    const hardwareCost = PRICES.battery[config.batteryKwh] + panelCost;
    let servicesCost = 0;
    if (config.services.registration) servicesCost += PRICES.services.registration;
    if (config.services.compliance) servicesCost += PRICES.services.compliance;
    servicesCost += PRICES.services.installation[config.services.installation];
    
    const subtotal = hardwareCost + servicesCost;
    const vat = subtotal * 0.10;
    const cost = subtotal + vat;
    return { cost, hardwareCost, servicesCost, subtotal, vat };
  }, [config]);

  useEffect(() => {
    onCostChange(cost);
  }, [cost, onCostChange]);

  const handleServiceChange = (key: keyof Configuration['services'], value: any) => {
    onConfigChange({ ...config, services: { ...config.services, [key]: value }});
  };
  
  const handlePanelChange = (key: keyof Configuration['panel'], value: any) => {
     const newPanelConfig = { ...config.panel, [key]: value };

     if (key === 'type') {
         if (value === 'rigid' && newPanelConfig.count === 12) {
             newPanelConfig.count = 8;
         }
         if (value === 'flexible' && newPanelConfig.count === 6) {
             newPanelConfig.count = 4;
         }
     }
     onConfigChange({ ...config, panel: newPanelConfig });
  };
  
  const handleConfigChange = <T extends keyof Configuration>(key: T, value: Configuration[T]) => {
      onConfigChange({ ...config, [key]: value });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) onFileChange(e.dataTransfer.files[0]);
  }, [onFileChange]);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onFileChange(e.target.files[0]);
  };
  
  return (
    <div className="text-center mb-8 space-y-10">
        <Section title="Scegli la Batteria di Accumulo" subtitle="Seleziona la capacità di accumulo per la tua energia." step={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <OptionCard 
                    title={<Battery className="w-16 h-16 text-primary" />} 
                    description="2.5 kWh, ideale per fabbisogno base" 
                    price={formatCurrency(PRICES.battery[2.5])} 
                    isSelected={config.batteryKwh === 2.5} 
                    onClick={() => handleConfigChange('batteryKwh', 2.5)} 
                />
                <OptionCard 
                    title={<div className="flex justify-center items-center gap-2"><Battery className="w-16 h-16 text-primary" /><Battery className="w-12 h-12 text-primary opacity-70" /></div>} 
                    description="5 kWh, massimizza l'autoconsumo" 
                    price={formatCurrency(PRICES.battery[5])} 
                    isSelected={config.batteryKwh === 5} 
                    onClick={() => handleConfigChange('batteryKwh', 5)} 
                />
            </div>
        </Section>
        
        <Section title="Scegli i Pannelli Fotovoltaici" subtitle="Scegli tipo e quantità dei pannelli. Ganci e prolunghe sono inclusi." step={2}>
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-center bg-gray-100 p-1 rounded-full">
                     <button onClick={() => handlePanelChange('type', 'rigid')} className={`flex items-center justify-center px-6 py-2 rounded-full font-semibold transition-colors w-1/2 ${config.panel.type === 'rigid' ? 'bg-secondary text-primary shadow' : 'text-gray-600'}`}>
                        <SolarPanel className="w-5 h-5 mr-2" />
                        Pannelli Rigidi (430W)
                     </button>
                     <button onClick={() => handlePanelChange('type', 'flexible')} className={`flex items-center justify-center px-6 py-2 rounded-full font-semibold transition-colors w-1/2 ${config.panel.type === 'flexible' ? 'bg-secondary text-primary shadow' : 'text-gray-600'}`}>
                        <Waves className="w-5 h-5 mr-2" />
                        Pannelli Flessibili (220W)
                     </button>
                </div>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {config.panel.type === 'rigid' ? (
                        <>
                            <OptionCard title={<IconGrid count={4} icon={<SolarPanel className="w-8 h-8 text-primary"/>} />} description="1720 Wp totali" price={formatCurrency(PRICES.panel.rigid[4])} isSelected={config.panel.count === 4} onClick={() => handlePanelChange('count', 4)} />
                            <OptionCard title={<IconGrid count={6} icon={<SolarPanel className="w-8 h-8 text-primary"/>} />} description="2580 Wp totali" price={formatCurrency(PRICES.panel.rigid[6])} isSelected={config.panel.count === 6} onClick={() => handlePanelChange('count', 6)} />
                            <OptionCard title={<IconGrid count={8} icon={<SolarPanel className="w-8 h-8 text-primary"/>} />} description="3440 Wp totali" price={formatCurrency(PRICES.panel.rigid[8])} isSelected={config.panel.count === 8} onClick={() => handlePanelChange('count', 8)} />
                        </>
                    ) : (
                        <>
                            <OptionCard title={<IconGrid count={4} icon={<Waves className="w-8 h-8 text-primary"/>} />} description="880 Wp totali" price={formatCurrency(PRICES.panel.flexible[4])} isSelected={config.panel.count === 4} onClick={() => handlePanelChange('count', 4)} />
                            <OptionCard title={<IconGrid count={8} icon={<Waves className="w-8 h-8 text-primary"/>} />} description="1760 Wp totali" price={formatCurrency(PRICES.panel.flexible[8])} isSelected={config.panel.count === 8} onClick={() => handlePanelChange('count', 8)} />
                            <OptionCard title={<IconGrid count={12} icon={<Waves className="w-8 h-8 text-primary"/>} />} description="2640 Wp totali" price={formatCurrency(PRICES.panel.flexible[12])} isSelected={config.panel.count === 12} onClick={() => handlePanelChange('count', 12)} />
                        </>
                    )}
                 </div>
            </div>
        </Section>
        
        <Section title="Aggiungi Servizi Opzionali" subtitle="Completa il tuo impianto con i nostri servizi professionali." step={3}>
            <div className="max-w-2xl mx-auto space-y-4 text-left">
                <div className="space-y-2">
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <input type="checkbox" checked={config.services.registration} onChange={e => handleServiceChange('registration', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary" />
                        <DocumentCheck className="w-6 h-6 mx-3 text-primary" />
                        <span className="text-gray-700">Registrazione a E-Distribuzione</span>
                        <span className="ml-auto font-semibold text-primary">{formatCurrency(PRICES.services.registration)}</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <input type="checkbox" checked={config.services.compliance} onChange={e => handleServiceChange('compliance', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-secondary" />
                        <ShieldCheck className="w-6 h-6 mx-3 text-primary" />
                        <span className="text-gray-700">Conformità impianto per linea dedicata</span>
                         <span className="ml-auto font-semibold text-primary">{formatCurrency(PRICES.services.compliance)}</span>
                    </label>
                </div>
                <div>
                     <p className="font-semibold text-gray-800 my-3 text-center">Tipo di Installazione</p>
                     <div className="grid grid-cols-2 gap-3">
                        {(Object.keys(installationOptions) as Array<keyof typeof installationOptions>).map(key => {
                            const option = installationOptions[key];
                            return (
                               <label key={key} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${config.services.installation === key ? 'border-secondary bg-yellow-50' : 'hover:border-secondary'}`}>
                                   <input type="radio" name="installation" value={key} checked={config.services.installation === key} onChange={e => handleServiceChange('installation', e.target.value)} className="h-4 w-4 text-primary focus:ring-secondary"/>
                                   <div className="flex items-center ml-3">
                                     {option.icon}
                                     <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                                   </div>
                                   <span className="ml-auto text-sm font-semibold text-primary">{formatCurrency(PRICES.services.installation[key])}</span>
                               </label> 
                            )
                        })}
                     </div>
                      <button onClick={() => handleServiceChange('installation', 'none')} className={`mt-2 text-sm text-gray-500 hover:text-primary ${config.services.installation === 'none' ? 'font-bold text-primary' : ''}`}>Nessuna installazione</button>
                </div>
            </div>
        </Section>
        
         <div className="max-w-md mx-auto bg-blue-50 p-6 rounded-2xl border border-primary">
            <h3 className="text-xl font-bold text-primary mb-4">Riepilogo Costi</h3>
            <div className="space-y-2 text-gray-700">
                <div className="flex justify-between"><span>KIT Soleasy</span><span className="font-medium">{formatCurrency(hardwareCost)}</span></div>
                <div className="flex justify-between"><span>Servizi</span><span className="font-medium">{formatCurrency(servicesCost)}</span></div>
                <hr className="my-2"/>
                <div className="flex justify-between"><span>Subtotale</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA (10%)</span><span className="font-medium">{formatCurrency(vat)}</span></div>
                <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t mt-2"><span>TOTALE</span><span>{formatCurrency(cost)}</span></div>
            </div>
             <div className="text-sm text-center text-emerald-800 mt-4 bg-emerald-100 p-3 rounded-lg border border-emerald-200">
                <p>Questo investimento è <strong className="font-bold">detraibile al 50% in 10 anni</strong>.</p>
                <p className="font-bold mt-1">Costo finale netto stimato: {formatCurrency(cost / 2)}</p>
            </div>
        </div>

        <Section title="Carica la tua bolletta" subtitle="Carica una foto o il PDF della tua bolletta. Al resto pensiamo noi." step={4}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="w-full md:w-1/2">
                <label onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clicca per caricare</span> o trascina qui</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP, o PDF</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, application/pdf" onChange={handleFileSelect} />
                </label>
              </div>
              <div className="w-full md:w-1/2 h-48 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border">
                {previewUrl ? <img src={previewUrl} alt="Anteprima Bolletta" className="h-full w-full object-contain" /> : file && file.type === 'application/pdf' ? <div className="text-gray-500 flex flex-col items-center"><FileText className="w-12 h-12 mb-2" /><span>PDF Selezionato</span><span className="text-xs max-w-full truncate px-2">{file.name}</span></div> : <div className="text-gray-400 flex flex-col items-center"><FileImage className="w-12 h-12 mb-2" /><span>Anteprima</span></div>}
              </div>
            </div>
        </Section>
        
        <div>
            <h2 className="text-xl font-semibold text-primary mb-2">5. Avvia l'analisi</h2>
            <p className="text-gray-600 mb-6">Il nostro motore di analisi calcolerà i dati e ti svelerà il tuo potenziale di risparmio.</p>
            <button onClick={onAnalyze} disabled={!file || isLoading} className="w-full max-w-sm mx-auto bg-secondary hover:brightness-95 text-primary font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:scale-100">
            {isLoading ? 'Analisi in corso...' : 'Analizza la mia Bolletta'}
            </button>
        </div>
    </div>
  );
};