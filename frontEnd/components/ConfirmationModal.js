// components/ConfirmationModal.js
import React from 'react';

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isConfirming = false,
  actionLabel = 'Confirmar' // NOVA PROP: label para o botão de ação (ex: 'Inativar', 'Ativar', 'Excluir')
}) {
  if (!isOpen) return null;

  // Define a cor do botão de ação com base na label
  // Você pode ajustar estas classes Tailwind CSS conforme suas cores
  const buttonColorClass = actionLabel === 'Inativar' ? 'bg-red-600 hover:bg-red-700' :
                           actionLabel === 'Ativar'   ? 'bg-green-600 hover:bg-green-700' :
                           'bg-blue-600 hover:bg-blue-700'; // Cor padrão se não for 'Inativar' ou 'Ativar'


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
            disabled={isConfirming}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition duration-200 ${buttonColorClass}`}
            disabled={isConfirming}
          >
            {isConfirming ? `${actionLabel}ndo...` : actionLabel} {/* Texto dinâmico */}
          </button>
        </div>
      </div>
    </div>
  );
}