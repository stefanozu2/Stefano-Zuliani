import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Footer } from './components/Footer';
import type { BillAnalysis } from './types';
import { analyzeBill } from './services/geminiService';

export interface Configuration {
  batteryKwh: 2.5 | 5;
  panel: {
    type: 'rigid' | 'flexible';
    count: 4 | 6 | 8 | 12;
  };
  services: {
    registration: boolean;
    compliance: boolean;
    installation: 'none' | 'garden' | 'balcony' | 'canopy' | 'roof';
  };
}


const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BillAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<Configuration>({
    batteryKwh: 2.5,
    panel: {
      type: 'rigid',
      count: 4,
    },
    services: {
      registration: false,
      compliance: false,
      installation: 'none',
    },
  });
  const [totalCost, setTotalCost] = useState<number>(0);

  const panelWp = useMemo(() => {
    const { type, count } = config.panel;
    if (type === 'rigid') {
        return count * 430;
    }
    return count * 220;
  }, [config.panel]);

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysisResult(null);
      setError(null);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null); // Reset preview for non-image files like PDFs
      }
    } else {
      setError("Per favore, carica un file valido (es. JPG, PNG, PDF).");
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleAnalysis = useCallback(async () => {
    if (!file) {
      setError("Nessun file selezionato per l'analisi.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeBill(file, panelWp, config.batteryKwh);
      setAnalysisResult(result);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Si è verificato un errore durante l'analisi della bolletta. Assicurati che il file sia chiaro e leggibile. Riprova.");
    } finally {
      setIsLoading(false);
    }
  }, [file, config, panelWp]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-white bg-primary">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 text-dark-text">
          <FileUpload 
            onFileChange={handleFileChange} 
            onAnalyze={handleAnalysis}
            previewUrl={previewUrl}
            isLoading={isLoading}
            file={file}
            config={config}
            onConfigChange={setConfig}
            onCostChange={setTotalCost}
          />

          {error && <ErrorDisplay message={error} />}
          
          {isLoading && <Loader />}
          
          {analysisResult && !isLoading && <AnalysisResult data={analysisResult} investmentCost={totalCost} config={config} />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;