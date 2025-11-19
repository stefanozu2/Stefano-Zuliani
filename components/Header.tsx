import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-primary pt-8 pb-6">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">
        <a href="http://soleasy.byethost33.com" target="_blank" rel="noopener noreferrer" className="text-5xl md:text-6xl font-extrabold text-secondary tracking-wide hover:brightness-110 transition-all">
          SOLEASY
        </a>
        <p className="mt-2 text-lg md:text-xl text-white font-light max-w-2xl">
          Configura il tuo nuovo impianto Solare SOLEASY e calcola i tuoi risparmi dalla tua bolletta
        </p>
      </div>
    </header>
  );
};
