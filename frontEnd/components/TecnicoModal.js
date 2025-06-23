// components/TecnicoModal.js

import { useState } from 'react';

export default function TecnicoModal({ isOpen, onClose, onSubmit, loja }) {
    // Lista de problemas técnicos comuns
    const problemasTecnicos = [
        "A página não carrega corretamente.",
        "Um botão não está funcionando.",
        "Estou recebendo uma mensagem de erro.",
        "Não consigo fazer login.",
        "O carrinho de compras apresenta um problema.",
        "Outro (descrever abaixo)."
    ];

    const [problema, setProblema] = useState(problemasTecnicos[0]);
    const [descricao, setDescricao] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleSubmit = () => {
        // Passa os dados para a função onSubmit que será definida na página de suporte
        onSubmit({ problema, descricao, loja });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Relatar um Problema Técnico</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Ajude-nos a resolver o problema descrevendo o que aconteceu.
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="problema-tecnico" className="block text-sm font-medium text-gray-700 mb-1">
                            Qual problema você encontrou?
                        </label>
                        <select
                            id="problema-tecnico"
                            value={problema}
                            onChange={(e) => setProblema(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {problemasTecnicos.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="descricao-problema" className="block text-sm font-medium text-gray-700 mb-1">
                            Por favor, descreva o problema (opcional, mas ajuda muito!):
                        </label>
                        <textarea
                            id="descricao-problema"
                            rows="4"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Ex: Ao tentar clicar no botão 'Finalizar Compra', nada acontece."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none"
                    >
                        Enviar Relatório
                    </button>
                </div>
            </div>
        </div>
    );
}