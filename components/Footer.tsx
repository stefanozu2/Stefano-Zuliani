import React from 'react';
import { Instagram, Facebook, WhatsApp } from './IconComponents';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary mt-8 py-8 text-white">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center space-x-6 mb-4">
          <a href="https://instagram.com/soleasy.it" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors" aria-label="Instagram">
            <Instagram className="h-7 w-7" />
          </a>
          <a href="https://facebook.com/soleasyfotovoltaico" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors" aria-label="Facebook">
            <Facebook className="h-7 w-7" />
          </a>
          <a href="https://wa.me/393508551747" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors" aria-label="WhatsApp">
            <WhatsApp className="h-7 w-7" />
          </a>
        </div>
        <div className="mb-4 text-gray-300">
            <p>soleasy.byethost33.com | soleasyfotovoltaico | +393508551747</p>
        </div>
        <p className="text-sm italic text-gray-300 mb-6 max-w-md mx-auto">
          "C'è un nuovo dispositivo in famiglia. Che genera valore, non solo likes."
        </p>
        <div className="text-xs text-gray-400 space-y-2">
            <p>
                *Disclaimer: I calcoli e le proiezioni presentati in questa applicazione sono simulazioni basate sui dati forniti e su stime standard. Non costituiscono un'offerta vincolante e sono da considerarsi puramente indicativi.
            </p>
            <p>&copy; {new Date().getFullYear()} Analizzatore Solare. Powered by Gemini AI.</p>
        </div>
      </div>
    </footer>
  );
};
