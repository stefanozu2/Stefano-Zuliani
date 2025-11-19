import { GoogleGenAI, Type } from '@google/genai';
import type { BillAnalysis } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const getAnalysisPrompt = (panelWp: number, batteryKwh: number) => {
    const panelKWp = panelWp / 1000;
    const kitDetails = `Kit SOLEASY Personalizzato: ${panelKWp.toFixed(2)} kWp di pannelli, ${batteryKwh} kWh di batteria, inverter da 800W con smart meter.`;
    
    return `
    Analizza il file della bolletta elettrica allegato (immagine o PDF). Esegui le operazioni in 3 passi.

    PASSO 1: Estrazione Dati Iniziali dalla Bolletta
    1. Estrai la provincia di fornitura dal testo della bolletta (es. "Provincia: RM" o dall'indirizzo). Se non la trovi, usa la provincia della sede legale dell'utente. Memorizzala.
    2. Estrai il costo totale comprensivo di tutte le tasse e oneri.
    3. Estrai il consumo totale di energia in kWh per il periodo di fatturazione.
    4. Estrai il periodo di fatturazione in numero di mesi (es. 1 per mensile, 2 per bimestrale).

    PASSO 2: Calcoli e Simulazione
    Considera la seguente configurazione scelta dall'utente: ${kitDetails}
    1. Cerca online il valore medio di irraggiamento solare giornaliero (ore di sole equivalenti al giorno) per la provincia estratta al PASSO 1. Memorizza questo valore.
    2. Calcola il costo onnicomprensivo per kWh (€/kWh).
    3. Fornisci una breve valutazione (1-2 frasi) sulla convenienza del contratto attuale.
    4. Normalizza il consumo su base mensile.
    5. Stima la produzione mensile del sistema fotovoltaico usando la formula: (Produzione = ${panelKWp} kWp * irraggiamento_solare_medio * 30 giorni).
    6. Stima la quota di autoconsumo all'85% dell'energia prodotta, grazie alla batteria e allo smart meter.
    7. Calcola i kWh autoconsumati che l'utente non acquisterà più dalla rete. Questo valore non può superare il consumo mensile dell'utente.
    8. Calcola il risparmio economico mensile (kWh autoconsumati * costo per kWh).
    9. Stima i costi fissi mensili non riducibili dalla bolletta (es. costi di trasporto, oneri di sistema fissi, canone TV). Se non sono chiaramente separati, stima un valore plausibile (es. 10-15€). Calcola il nuovo costo mensile della bolletta: (costo originale mensile - risparmio economico). Assicurati che il risultato finale non sia mai inferiore ai costi fissi stimati. Se il risparmio supera la parte variabile della bolletta, il nuovo costo sarà pari ai soli costi fissi.
    10. Calcola le emissioni di CO2 evitate mensilmente (produzione fotovoltaica totale mensile * 0.25 kg CO2/kWh).

    PASSO 3: Proiezioni a Lungo Termine
    11. Calcola il risparmio annuale (risparmio mensile * 12).
    12. Calcola il risparmio in 10 anni (risparmio annuale * 10).
    13. Calcola la CO2 evitata annualmente (CO2 evitata mensile * 12).
    14. Calcola la CO2 evitata in 10 anni (CO2 evitata annuale * 10).

    Fornisci il risultato esclusivamente in formato JSON seguendo lo schema. Per il campo 'costo_per_kwh', usa 3 cifre decimali. Per tutti gli altri valori numerici, arrotonda all'intero più vicino.
`;
}


export const analyzeBill = async (file: File, panelWp: number, batteryKwh: number): Promise<BillAnalysis> => {
    const imagePart = await fileToGenerativePart(file);
    const analysisPrompt = getAnalysisPrompt(panelWp, batteryKwh);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: analysisPrompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    costo_totale: { type: Type.NUMBER, description: "Costo totale in euro dalla bolletta." },
                    consumo_kwh: { type: Type.NUMBER, description: "Consumo totale in kWh dalla bolletta." },
                    periodo_fatturazione_mesi: { type: Type.INTEGER, description: "Numero di mesi del periodo di fatturazione." },
                    costo_per_kwh: { type: Type.NUMBER, description: "Costo calcolato per kWh, con 3 cifre decimali." },
                    valutazione_contratto: { type: Type.STRING, description: "Breve giudizio sul contratto." },
                    consumo_mensile_kwh: { type: Type.NUMBER, description: "Consumo normalizzato su base mensile." },
                    produzione_fv_mensile_kwh: { type: Type.NUMBER, description: "Produzione mensile stimata del fotovoltaico." },
                    autoconsumo_kwh: { type: Type.NUMBER, description: "kWh autoconsumati mensilmente." },
                    risparmio_mensile_eur: { type: Type.NUMBER, description: "Risparmio economico mensile in euro." },
                    nuova_bolletta_mensile_eur: { type: Type.NUMBER, description: "Costo stimato della nuova bolletta mensile, tenendo conto che i costi fissi (es. trasporto, canone) non sono azzerabili." },
                    co2_evitata_kg: { type: Type.NUMBER, description: "Kg di CO2 evitati mensilmente." },
                    irraggiamento_solare_medio: { type: Type.NUMBER, description: "Ore di sole equivalenti/giorno usate per il calcolo, basate sulla provincia." },
                    provincia_estratta: { type: Type.STRING, description: "La provincia di fornitura estratta dalla bolletta." },
                    risparmio_annuale_eur: { type: Type.NUMBER, description: "Risparmio economico annuale." },
                    risparmio_10_anni_eur: { type: Type.NUMBER, description: "Risparmio economico in 10 anni." },
                    co2_evitata_annuale_kg: { type: Type.NUMBER, description: "Kg di CO2 evitati annualmente." },
                    co2_evitata_10_anni_kg: { type: Type.NUMBER, description: "Kg di CO2 evitati in 10 anni." },
                },
                required: [
                    "costo_totale", "consumo_kwh", "periodo_fatturazione_mesi", "costo_per_kwh",
                    "valutazione_contratto", "consumo_mensile_kwh", "produzione_fv_mensile_kwh",
                    "autoconsumo_kwh", "risparmio_mensile_eur", "nuova_bolletta_mensile_eur", "co2_evitata_kg", "irraggiamento_solare_medio", "provincia_estratta",
                    "risparmio_annuale_eur", "risparmio_10_anni_eur", "co2_evitata_annuale_kg", "co2_evitata_10_anni_kg"
                ],
            }
        }
    });
    
    const jsonString = response.text.trim();
    try {
      const parsedJson = JSON.parse(jsonString);
      return parsedJson as BillAnalysis;
    } catch(e) {
      console.error("Failed to parse Gemini response:", jsonString);
      throw new Error("La risposta del modello non è un JSON valido.");
    }
};