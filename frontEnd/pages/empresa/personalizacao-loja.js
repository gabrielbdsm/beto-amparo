import React, { useState } from 'react';
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
  const { slug } = router.query; // Este slug aqui é para o caso de você estar editando uma loja existente

  const [formData, setFormData] = useState({
    nomeFantasia: '',
    fotoLoja: null,
    corPrimaria: '#3681B6',
    corSecundaria: '#ffffff',
    slogan: '',
    slugLoja: '',
  });

  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [slugError, setSlugError] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

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
      checkSlugAvailability(formattedValue);
    } else if (name === 'slugLoja') {
      setSlugError('');
    }
  };

  const checkSlugAvailability = async (slug) => {
    setIsCheckingSlug(true);
    setSlugError('');

    try {
      // Use axios para sua API de backend Node.js
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
        const fileExt = file.name.split('.').pop();
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
      };

      // 1. Enviar os dados de personalização para o backend
      // Certifique-se de que este endpoint esteja recebendo o ID da empresa da sessão/token
      const saveResponse = await axios.post(`${process.env.NEXT_PUBLIC_EMPRESA_API}/personalizacao`, payload, {
        withCredentials: true // Importante para enviar cookies de sessão
      });

      if (saveResponse.status !== 200 && saveResponse.status !== 201) {
        throw new Error(saveResponse.data?.message || 'Erro ao salvar personalização da loja.');
      }

      // 2. Marcar o primeiro login como feito após a personalização bem-sucedida
      // Este endpoint (marcar-personalizacao-completa) precisa ser criado no seu backend EmpresaController.js
      const markLoginResponse = await axios.put(`${process.env.NEXT_PUBLIC_EMPRESA_API}/marcar-personalizacao-completa`, {}, {
        withCredentials: true // Importante para enviar cookies de sessão
      });

      if (markLoginResponse.status !== 200) {
        // Logar o erro, mas não impedir o usuário de seguir se a personalização foi salva
        console.error('Erro ao marcar primeiro login como completo:', markLoginResponse.data?.message || 'Erro desconhecido.');
        // Você pode alertar o usuário ou apenas logar e seguir
      }


      alert('Personalização da loja salva com sucesso!');
      router.push(`/loja/${formData.slugLoja}`); // Redireciona para a página da loja personalizada
    } catch (error) {
      console.error('Erro ao salvar personalização:', error.response?.data || error.message);
      alert(`Erro ao salvar a personalização: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
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
                    required // Adicionado required
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
                      onClick={() => document.getElementById('fotoLoja').click()} // Simula o clique no input file
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
                    required // Adicionado required
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
                  {/* Ajustado para usar corPrimaria se a secundaria for branca para melhor contraste */}
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
              <input
                type="text"
                name="slugLoja"
                value={formData.slugLoja}
                onChange={handleChange}
                placeholder="exemplo-loja"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                required // Adicionado required
              />
              {isCheckingSlug ? (
                <p className="text-sm text-blue-600 mt-1">Verificando disponibilidade...</p>
              ) : slugError ? (
                <p className="text-sm text-red-600 mt-1">{slugError}</p>
              ) : (
                formData.slugLoja && <p className="text-sm text-green-600 mt-1">Disponível!</p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-400"
                disabled={uploading} // Desabilita o botão enquanto está salvando
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading || isCheckingSlug || slugError} // Desabilita se estiver enviando, verificando slug ou se houver erro no slug
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