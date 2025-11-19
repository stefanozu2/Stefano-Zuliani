export interface BillAnalysis {
  costo_totale: number;
  consumo_kwh: number;
  periodo_fatturazione_mesi: number;
  costo_per_kwh: number;
  valutazione_contratto: string;
  consumo_mensile_kwh: number;
  produzione_fv_mensile_kwh: number;
  autoconsumo_kwh: number;
  risparmio_mensile_eur: number;
  nuova_bolletta_mensile_eur: number;
  co2_evitata_kg: number;
  irraggiamento_solare_medio: number; // Ore di sole equivalenti/giorno usate per il calcolo
  provincia_estratta: string; // Provincia estratta dalla bolletta

  // Campi per le proiezioni a lungo termine
  risparmio_annuale_eur: number;
  risparmio_10_anni_eur: number;
  co2_evitata_annuale_kg: number;
  co2_evitata_10_anni_kg: number;
}