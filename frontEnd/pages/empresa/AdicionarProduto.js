import { useState } from 'react';
import Image from 'next/image';
import LogoutButton from './Logout';
export default function AdicionarProduto() {
  const [tamanhos, setTamanhos] = useState(['P', 'M', 'G']);
  const [novoTamanho, setNovoTamanho] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [controlarEstoque, setControlarEstoque] = useState(true); 
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    novaCategoria: false,
    novaCategoriaTexto: '',
    imagem: null,
    preco: '',
    descricao: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const toggleNovaCategoria = () => {
    setFormData((prev) => ({
      ...prev,
      novaCategoria: !prev.novaCategoria,
      categoria: '',
      novaCategoriaTexto: '',
    }));
  };

  const adicionarTamanho = () => {
    if (novoTamanho && !tamanhos.includes(novoTamanho)) {
      setTamanhos([...tamanhos, novoTamanho]);
      setNovoTamanho('');
    }
  };

  const removerTamanho = (tamanho) => {
    setTamanhos(tamanhos.filter((t) => t !== tamanho));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.nome) {
      setError('O nome do produto é obrigatório.');
      setIsLoading(false);
      return;
    }
    if (formData.preco && parseFloat(formData.preco) <= 0) {
      setError('O preço deve ser maior que zero.');
      setIsLoading(false);
      return;
    }
    if (formData.novaCategoria && !formData.novaCategoriaTexto) {
      setError('Digite o nome da nova categoria.');
      setIsLoading(false);
      return;
    }
    if (
      (formData.categoria === 'roupas' || formData.novaCategoriaTexto.toLowerCase() === 'roupas') &&
      tamanhos.length === 0
    ) {
      setError('Adicione pelo menos um tamanho para roupas.');
      setIsLoading(false);
      return;
    }
    if (controlarEstoque && (!quantidade || parseInt(quantidade) <= 0)) {
      setError('A quantidade em estoque deve ser maior que zero quando o controle de estoque está ativado.');
      setIsLoading(false);
      return;
    }

    const dadosProduto = {
      nome: formData.nome,
      categoria: formData.novaCategoria ? formData.novaCategoriaTexto : formData.categoria,
      preco: parseFloat(formData.preco) || 0,
      descricao: formData.descricao,
      tamanhos: formData.categoria === 'roupas' || formData.novaCategoriaTexto.toLowerCase() === 'roupas' ? tamanhos : [],
      quantidade: controlarEstoque ? parseInt(quantidade) || 0 : null,
      controlarEstoque,
    };

    const formDataToSend = new FormData();
    formDataToSend.append('nome', dadosProduto.nome);
    formDataToSend.append('categoria', dadosProduto.categoria);
    formDataToSend.append('preco', dadosProduto.preco.toString());
    formDataToSend.append('descricao', dadosProduto.descricao);
    formDataToSend.append('tamanhos', JSON.stringify(dadosProduto.tamanhos));
    formDataToSend.append('quantidade', dadosProduto.quantidade.toString());
    formDataToSend.append('controlarEstoque', dadosProduto.controlarEstoque.toString());
    formDataToSend.append('novaCategoria', formData.novaCategoria.toString());
    if (controlarEstoque && dadosProduto.quantidade !== null) {
      formDataToSend.append('quantidade', dadosProduto.quantidade.toString());
    }
    formDataToSend.append('controlar_estoque', dadosProduto.controlarEstoque.toString());
    if (formData.novaCategoria) {
      formDataToSend.append('novaCategoriaTexto', formData.novaCategoriaTexto);
    }
    if (formData.imagem) {
      formDataToSend.append('imagem', formData.imagem);
    }
    console.log('Enviando FormData:', Object.fromEntries(formDataToSend));
    if (!process.env.NEXT_PUBLIC_EMPRESA_API) {
      setError('Erro: A URL da API não está configurada.');
      console.error('NEXT_PUBLIC_EMPRESA_API não está definido.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_EMPRESA_API + '/addProduto', {
        method: 'POST',
        credentials: 'include' ,
        body: formDataToSend,
      });
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData?.mensagem || 'Erro desconhecido';
        console.log('responseData:', responseData);
        throw new Error(errorMessage);
      }

      setFormData({
        nome: '',
        categoria: '',
        novaCategoria: false,
        novaCategoriaTexto: '',
        imagem: null,
        preco: '',
        descricao: '',
      });
      setTamanhos(['P', 'M', 'G']);
      setNovoTamanho('');
      setQuantidade('');
      setControlarEstoque(false); // Reseta o toggle
      setError('');
      alert('Produto cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar os dados:', error);
      setError(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-xl">
        {/* Header com logo e título */}
        <div className="flex   justify-between ">
          <div className=" h-12 mb-1 object-contain"> 
         
            <Image

            src="/logo.png"
            width={80}
            height={70}
            alt="Logo da Marca"
            />
            </div>
            <LogoutButton />

          

          
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3 mt-3" style={{ color: '#3681B6' }}>
            Adicionar Produto
          </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
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
                  imagem: file || null,
                }));
                setError('');
              }}
              className="hidden"
            />
            {formData.imagem && (
              <div className="mt-4 relative">
                <img
                  src={URL.createObjectURL(formData.imagem)}
                  alt="Preview da Imagem"
                  className="max-h-48 rounded-xl object-contain border border-gray-300 w-full"
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imagem: null }))}
                  className="absolute top-2 right-2 bg-white border border-gray-300 rounded-full p-1 hover:bg-red-100 transition cursor-pointer"
                  title="Remover imagem"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input
              type="number"
              name="preco"
              value={formData.preco}
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) return;
                setFormData((prev) => ({
                  ...prev,
                  preco: value,
                }));
                setError('');
              }}
              step="0.01"
              min="0.01"
              placeholder="Ex: 49.90"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
              required
            />
          </div>

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

          {(formData.categoria === 'roupas' || formData.novaCategoriaTexto.toLowerCase() === 'roupas') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamanhos Disponíveis</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tamanhos.map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-1 bg-gray-200 px-3 py-1 rounded-full text-sm"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removerTamanho(t)}
                      className="text-red-500 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={novoTamanho}
                  onChange={(e) => setNovoTamanho(e.target.value.toUpperCase())}
                  placeholder="Ex: PP, GG"
                  className="flex-1 p-2 border rounded-xl"
                />
                <button
                  type="button"
                  onClick={adicionarTamanho}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:opacity-90"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Controlar Estoque
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={controlarEstoque}
                onChange={() => setControlarEstoque(!controlarEstoque)}
                className="h-4 w-4 text-[#3681B6] border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                {controlarEstoque ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </div>

          {controlarEstoque && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                min="0"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                placeholder="Ex: 20"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full p-3 rounded-xl text-white font-medium hover:opacity-90 transition cursor-pointer"
            style={{ backgroundColor: '#3681B6' }}
            disabled={isLoading}
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar Produto'}
          </button>
        </form>
      </div>
    </div>
  );
}