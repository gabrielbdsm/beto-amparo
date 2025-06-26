import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter } from 'next/router';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const PersonalizacaoLoja = () => {
  const router = useRouter();
  const { slug } = router.query;

  const [formData, setFormData] = useState({
    nomeFantasia: '',
    fotoLoja: null,
    corPrimaria: '#3681B6',
    corSecundaria: '#ffffff',
    slogan: '',
    slugLoja: '',
    idEmpresa: null,
  });

  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [slugError, setSlugError] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // URL base para o link do cliente
  const clientBaseUrl = 'localhost:3000/loja/'; // Você pode substituir por seu domínio quando em produção
  // --- Início da alteração: Carregar o ID da empresa do localStorage ---
  useEffect(() => {
    const storedEmpresaId = localStorage.getItem('id_empresa_cadastrada');
    console.log('PersonalizacaoLoja: ID da empresa do localStorage:', storedEmpresaId); // ADICIONE ESTE LOG
    if (storedEmpresaId) {
      setFormData(prev => ({ ...prev, idEmpresa: storedEmpresaId }));
    } else {
      console.warn('PersonalizacaoLoja: ID da empresa não encontrado no localStorage.');
      // Opcional: Redirecionar aqui se o ID for mandatório
      // router.push('/cadastrar-empresa');
    }
  }, []);
  // --- Fim da alteração ---
  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    let formattedValue = value;

    if (name === 'slugLoja') {
      formattedValue = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/\s+/g, '-');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'file' ? files[0] : type === 'checkbox' ? checked : formattedValue,
    }));

    if (name === 'slugLoja' && formattedValue) {
      // Pequeno debounce para evitar muitas requisições ao digitar rápido
      if (e.target.timeout) clearTimeout(e.target.timeout);
      e.target.timeout = setTimeout(() => {
        checkSlugAvailability(formattedValue);
      }, 500); // Verifica após 500ms de inatividade
    } else if (name === 'slugLoja') {
      setSlugError('');
    }
  };

  const checkSlugAvailability = async (slug) => {
    setIsCheckingSlug(true);
    setSlugError('');

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_EMPRESA_API}/check-slug?slug=${slug}`);
      if (response.data.exists) {
        setSlugError('Este link já está em uso. Por favor, escolha outro.');
      } else {
        setSlugError('');
      }
    } catch (error) {
      setSlugError('Erro ao verificar o link. Tente novamente.');
      console.error('Erro ao verificar slug:', error.response?.data || error.message);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSubmit = async () => {
    if (slugError || !formData.slugLoja) {
      alert('Por favor, corrija o link da loja antes de salvar.');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = '';

      if (formData.fotoLoja) {
        const file = formData.fotoLoja;
        // Crie um nome de arquivo único para evitar colisões no Supabase Storage
        const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const filePath = `lojas/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lojas')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('lojas')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        nomeFantasia: formData.nomeFantasia,
        corPrimaria: formData.corPrimaria,
        corSecundaria: formData.corSecundaria,
        slogan: formData.slogan,
        fotoLoja: imageUrl, // URL da imagem salva no Supabase Storage
        slugLoja: formData.slugLoja,
        idEmpresa: formData.idEmpresa,
      };

      const saveResponse = await axios.post(`${process.env.NEXT_PUBLIC_EMPRESA_API}/personalizacao`, payload, {
        withCredentials: true
      });

      if (saveResponse.status !== 200 && saveResponse.status !== 201) {
        throw new Error(saveResponse.data?.message || 'Erro ao salvar personalização da loja.');
      }

      const markLoginResponse = await axios.put(`${process.env.NEXT_PUBLIC_EMPRESA_API}/marcar-personalizacao-completa`, {}, {
        withCredentials: true
      });

      if (markLoginResponse.status !== 200) {
        console.error('Erro ao marcar primeiro login como completo:', markLoginResponse.data?.message || 'Erro desconhecido.');
      }

      //alert('Personalização da loja salva com sucesso!');
      router.push(`/empresa/${formData.slugLoja}/produtos`);
    } catch (error) {
      console.error('Erro ao salvar personalização:', error.response?.data || error.message);
      alert(`Erro ao salvar a personalização: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    // Validações antes de ir para o próximo passo
    if (!formData.nomeFantasia || !formData.slogan) {
      alert('Por favor, preencha todos os campos obrigatórios do Passo 1.');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-5xl max-h-[85vh] overflow-y-auto flex flex-col space-y-6">
        {step === 1 && (
          <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-8 space-y-6 sm:space-y-0">
            {/* FORMULÁRIO */}
            <div className="w-full sm:max-w-xl">
              <div className="mb-6">
                <div className="h-12 mb-1 object-contain">
                  <Image
                    src="/logo.png"
                    width={70}
                    height={50}
                    alt="Logo da Marca"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#3681B6]">
                  Personalizar Loja
                </h1>
              </div>

              <form className="space-y-4 text-black">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    name="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={handleChange}
                    placeholder="Ex: Loja da Felicidade"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6] placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fotoLoja" className="block text-sm font-medium text-gray-700 mb-1">Foto da Loja</label>
                  <div className="relative flex items-center space-x-4">
                    <input
                      id="fotoLoja"
                      type="file"
                      name="fotoLoja"
                      accept="image/*"
                      onChange={handleChange}
                      className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
                    />
                    <button
                      type="button"
                      className="w-full sm:w-auto p-3 text-white rounded-xl bg-gradient-to-r from-[#3681B6] to-[#2e6e99] flex justify-center items-center hover:from-[#2e6e99] hover:to-[#3681B6]"
                      onClick={() => document.getElementById('fotoLoja').click()}
                    >
                      <span>Escolher Arquivo</span>
                    </button>
                    {formData.fotoLoja && (
                      <span className="text-sm text-gray-600">{formData.fotoLoja.name}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                  <input
                    type="color"
                    name="corPrimaria"
                    value={formData.corPrimaria}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <input
                    type="color"
                    name="corSecundaria"
                    value={formData.corSecundaria}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                  <input
                    type="text"
                    name="slogan"
                    value={formData.slogan}
                    onChange={handleChange}
                    placeholder="Ex: Sua loja, sua alegria!"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6] placeholder:text-gray-400"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white py-3 rounded-xl font-semibold hover:from-[#2e6e99] hover:to-[#3681B6] transition"
                >
                  Próximo
                </button>
              </form>
            </div>

            {/* PRÉ-VISUALIZAÇÃO */}
            <div className="w-full sm:max-w-md bg-gray-50 p-4 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-[#3681B6] mb-4">Pré-visualização</h2>
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="w-32 h-32 bg-cover bg-center rounded-full"
                  style={{
                    backgroundImage: formData.fotoLoja
                      ? `url(${URL.createObjectURL(formData.fotoLoja)})`
                      : 'url(https://placehold.co/150x150)',
                  }}
                ></div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold" style={{ color: formData.corPrimaria }}>
                    {formData.nomeFantasia || 'Nome da Loja'}
                  </h3>
                  <p className="text-sm" style={{ color: formData.corSecundaria === '#ffffff' ? '#333' : formData.corSecundaria }}>
                    {formData.slogan || 'Slogan da loja'}
                  </p>
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: formData.corPrimaria }}></div>
                  <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: formData.corSecundaria }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-black">
            <h2 className="text-2xl font-semibold text-[#3681B6]">Link Personalizado</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Amigável da Loja</label>
              {/* Campo para o slug */}
              <input
                type="text"
                name="slugLoja"
                value={formData.slugLoja}
                onChange={handleChange}
                placeholder="exemplo-loja"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                required
              />
              {isCheckingSlug ? (
                <p className="text-sm text-blue-600 mt-1">Verificando disponibilidade...</p>
              ) : slugError ? (
                <p className="text-sm text-red-600 mt-1">{slugError}</p>
              ) : (
                formData.slugLoja && <p className="text-sm text-green-600 mt-1">Link disponível!</p>
              )}
            </div>

            {/* NOVO BLOCO PARA EXIBIR O LINK COMPLETO */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Este será o link da sua loja para os clientes:
              </p>
              <div className="bg-blue-100 p-3 rounded-md flex items-center justify-between">
                <span className="font-mono text-blue-900 break-all">
                  {clientBaseUrl}
                  <span className="font-bold text-blue-900">
                    {formData.slugLoja || '[seu-link-aqui]'}
                  </span>
                </span>
                {formData.slugLoja && !slugError && (
                  <button
                    onClick={() => navigator.clipboard.writeText(`${clientBaseUrl}${formData.slugLoja}`)}
                    className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Copiar link"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2m-3-7l3 3m0 0l-3 3m3-3H10"></path></svg>
                  </button>
                )}
              </div>
            </div>
            {/* FIM DO NOVO BLOCO */}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-400"
                disabled={uploading}
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading || isCheckingSlug || slugError || !formData.slugLoja} // Desabilita se o slug estiver vazio
                className="w-full bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white py-3 rounded-xl font-semibold hover:from-[#2e6e99] hover:to-[#3681B6] transition"
              >
                {uploading ? 'Salvando...' : 'Salvar Personalização'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizacaoLoja;