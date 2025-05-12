import { useState } from 'react';
import Image from 'next/image';
import LogoutButton from './Logout';
export default function AdicionarProduto() {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    novaCategoria: false,
    novaCategoriaTexto: '',
    imagem: '',
    preco: '',
    descricao: '',
  });
  const [error, setError] = useState(''); // Estado para mensagens de erro

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Limpa o erro ao alterar o formulário
  };

  const toggleNovaCategoria = () => {
    setFormData((prev) => ({
      ...prev,
      novaCategoria: !prev.novaCategoria,
      categoria: '', // Limpa a categoria ao adicionar nova
      novaCategoriaTexto: '', // Limpa o texto da nova categoria
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica no frontend
    if (formData.preco && parseFloat(formData.preco) <= 0) {
      setError('O preço deve ser maior que zero.');
      return;
    }
    if (formData.novaCategoria && !formData.novaCategoriaTexto) {
      setError('Digite o nome da nova categoria.');
      return;
    }

    const dadosProduto = {
      nome: formData.nome,
      categoria: formData.novaCategoria ? formData.novaCategoriaTexto : formData.categoria,
      preco: parseFloat(formData.preco) || 0,
      descricao: formData.descricao,
    };

    // Criar o FormData para enviar ao servidor
    const formDataToSend = new FormData();
    formDataToSend.append('nome', dadosProduto.nome);
    formDataToSend.append('categoria', dadosProduto.categoria);
    formDataToSend.append('preco', dadosProduto.preco.toString());
    formDataToSend.append('descricao', dadosProduto.descricao);
    formDataToSend.append('novaCategoria', formData.novaCategoria.toString());
    if (formData.novaCategoria) {
      formDataToSend.append('novaCategoriaTexto', formData.novaCategoriaTexto);
    }
    if (formData.imagem) {
      formDataToSend.append('imagem', formData.imagem);
    }

    // Log para depuração
    console.log('Enviando dados:', Object.fromEntries(formDataToSend));

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_EMPRESA_API + '/addProduto', {
        method: 'POST',
        body: formDataToSend,
      });
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData?.mensagem || 'Erro desconhecido';
        throw new Error(errorMessage);
      }

      // Sucesso: resetar o formulário e mostrar mensagem
      setFormData({
        nome: '',
        categoria: '',
        novaCategoria: false,
        novaCategoriaTexto: '',
        imagem: '',
        preco: '',
        descricao: '',
      });
      setError('');
      alert('Produto cadastrado com sucesso!');
      console.log('Resposta do servidor:', responseData);
    } catch (error) {
      console.error('Erro ao enviar os dados:', error);
      setError(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-xl">
        {/* Header com logo e título */}
        <div className="flex   justify-between ">
          <div className=" "> 
          <img
            src="logo.png"
            alt="Logo da Marca"
            className="h-12 mb-2 object-contain"
            />
            </div>
            <LogoutButton />

          

          
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: '#3681B6' }}>
            Adicionar Produto
          </h1>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {/* Nome do Produto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Arroz branco"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6] text-black placeholder:text-gray-400"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            {formData.novaCategoria ? (
              <input
                type="text"
                name="novaCategoriaTexto"
                value={formData.novaCategoriaTexto}
                onChange={handleChange}
                placeholder="Nova categoria"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                required
              />
            ) : (
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                required
              >
                <option value="">Selecione uma categoria</option>
                <option value="alimentos">Alimentos</option>
                <option value="higiene">Higiene</option>
                <option value="roupas">Roupas</option>
              </select>
            )}

            <button
              type="button"
              className="text-sm mt-1 hover:underline"
              style={{ color: '#3681B6' }}
              onClick={toggleNovaCategoria}
            >
              {formData.novaCategoria ? 'Selecionar categoria existente' : 'Adicionar nova categoria'}
            </button>
          </div>

          {/* Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="imagemUpload"
                className="cursor-pointer bg-[#3681B6] text-white px-4 py-2 rounded-xl hover:opacity-90 transition"
              >
                Escolher imagem
              </label>
              <span className="text-sm text-gray-500">
                {formData.imagem ? formData.imagem.name || 'Imagem selecionada' : 'Nenhum arquivo escolhido'}
              </span>
            </div>

            <input
              id="imagemUpload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setFormData((prev) => ({
                  ...prev,
                  imagem: file || '',
                }));
                setError('');
              }}
              className="hidden"
            />

            {formData.imagem && (
              <div className="mt-4 relative">
                <Image
                  src={URL.createObjectURL(formData.imagem)}
                  alt="Preview da Imagem"
                  className="max-h-48 rounded-xl object-contain border border-gray-300 w-full"
                  height={192}
                  width={192}
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imagem: '' }))}
                  className="absolute top-2 right-2 bg-white border border-gray-300 rounded-full p-1 hover:bg-red-100 transition cursor-pointer"
                  title="Remover imagem"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input
              type="number"
              name="preco"
              value={formData.preco}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Ex: 49.90"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Descreva o produto..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
              rows={4}
              required
            ></textarea>
          </div>

          {/* Botão */}
          <button
            type="submit"
            className="w-full p-3 rounded-xl text-white font-medium hover:opacity-90 transition cursor-pointer"
            style={{ backgroundColor: '#3681B6' }}
          >
            Cadastrar Produto
          </button>
        </form>
      </div>
    </div>
  );
}