
import React from 'react';
import { AlertTriangle } from './IconComponents';

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
      <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
      <p className="text-red-700 text-sm">{message}</p>
    </div>
  );
};
