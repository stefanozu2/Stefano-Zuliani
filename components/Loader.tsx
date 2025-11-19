import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Accendiamo i pannelli solari virtuali...",
  "Calcoliamo i raggi di sole per la tua zona...",
  "Decifriamo i geroglifici della tua bolletta...",
  "Ci siamo quasi! Stiamo lucidando i risultati...",
];

const SunLoader: React.FC = () => {
    const [visibleRays, setVisibleRays] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleRays(prev => (prev + 1) % 9); // Cycle through 0-8 rays
        }, 300);
        return () => clearInterval(interval);
    }, []);
    
    // Array of 8 rotations for the rays
    const rayTransforms = Array.from({ length: 8 }, (_, i) => `rotate(${i * 45} 50 50)`);

    return (
        <svg viewBox="0 0 100 100" className="w-20 h-20" aria-label="Caricamento in corso">
            <circle cx="50" cy="50" r="25" fill="#FDB813" />
            <g stroke="#FDB813" strokeWidth="6" strokeLinecap="round">
                {rayTransforms.map((transform, index) => (
                    <line 
                        key={index} 
                        x1="50" y1="20" x2="50" y2="8"
                        transform={transform}
                        style={{ transition: 'opacity 0.3s ease-in-out', opacity: index < visibleRays ? 1 : 0 }} 
                    />
                ))}
            </g>
        </svg>
    );
};


export const Loader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <SunLoader />
      <p className="text-lg text-gray-600 font-medium text-center h-12 flex items-center">
        {loadingMessages[messageIndex]}
      </p>
      <p className="text-sm text-gray-500 text-center">Potrebbe richiedere qualche istante.</p>
    </div>
  );
};