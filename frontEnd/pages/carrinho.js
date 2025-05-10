import { useState } from 'react';

const Carrinho = ({ produto, quantidade, subtotal }) => {
  const [mensagem, setMensagem] = useState('');
  const [corMensagem, setCorMensagem] = useState('');

  const handleAddToCart = async () => {
    try {
      const response = await fetch('/api/carrinho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produtoId: produto.id,
          quantidade: quantidade || 1,
        }),
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || 'Erro desconhecido ao adicionar ao carrinho');
      }

      setMensagem('Produto adicionado ao carrinho');
      setCorMensagem('text-green-600');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      setMensagem(`Não foi possível adicionar ao carrinho: ${error.message}`);
      setCorMensagem('text-red-600');
    }

    setTimeout(() => {
      setMensagem('');
      setCorMensagem('');
    }, 3000);
  };

  return (
    <div className="text-center font-semibold mt-2 px-6">
      <div className="flex justify-between text-xl">
        <p>Subtotal:</p>
        <p>Total: R$ {(subtotal || 0).toFixed(2)}</p>
      </div>

      <button
        onClick={handleAddToCart}
        className="w-60 py-2 my-3 hover:bg-blue-500 bg-blue-300 text-white rounded-4xl font-medium"
      >
        Adicionar no Carrinho
      </button>

      {mensagem && (
        <p className={`mt-2 text-sm ${corMensagem}`}>{mensagem}</p>
      )}
    </div>
  );
};

export default Carrinho;
