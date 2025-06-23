// components/RejectionInfo.js

import { useState } from 'react';

export default function RejectionInfo({ rejection_reason }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Se não houver motivo, mostramos uma mensagem simples sem a funcionalidade de expandir
    if (!rejection_reason) {
        return (
            <div className="p-3 w-full text-left bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-xs">
                <p className="font-bold">Solicitação de cancelamento rejeitada.</p>
            </div>
        );
    }

    return (
        <div 
            className="p-3 w-full text-left bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-xs cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex justify-between items-center">
                <p className="font-bold">Solicitação de cancelamento rejeitada.</p>
                {/* Ícone da seta que gira com a transição */}
                <svg 
                    className={`w-4 h-4 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* O motivo só é exibido quando 'isExpanded' for verdadeiro */}
            {isExpanded && (
                <div className="mt-2 pt-2 border-t border-red-200">
                    <p className="italic">Motivo do estabelecimento: "{rejection_reason}"</p>
                </div>
            )}
        </div>
    );
}