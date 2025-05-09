import React, { useState } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const PersonalizacaoLoja = () => {
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
      const response = await axios.get(`http://localhost:4000/api/check-slug?slug=${slug}`);
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
        const fileName = `${Date.now()}.${fileExt}`;
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
        fotoLoja: imageUrl,
        slugLoja: formData.slugLoja,
      };

      console.log('Enviando payload:', payload);
      const response = await axios.post('http://localhost:4000/api/personalizacao', payload);

      console.log('Personalização salva com sucesso!', response.data);
      alert('Personalização da loja salva com sucesso!');
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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-5xl max-h-[85vh] overflow-y-auto flex flex-col space-y-6">
        {step === 1 && (
          <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-8 space-y-6 sm:space-y-0">
            {/* FORMULÁRIO */}
            <div className="w-full sm:max-w-xl">
              <div className="mb-6">
                <img
                  src="logo.png"
                  alt="Logo da Marca"
                  className="h-12 mb-2 object-contain"
                />
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
                      className="w-full sm:w-auto p-3 text-white rounded-xl bg-gradient-to-r from-[#3681B6] to-[#2e6e99] flex justify-center items-center hover:bg-gradient-to-r hover:from-[#2e6e99] hover:to-[#3681B6] focus:outline-none"
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
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white py-3 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-[#2e6e99] hover:to-[#3681B6] transition cursor-pointer"
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
                  <p className="text-sm text-gray-600" style={{ color: formData.corSecundaria }}>
                    {formData.slogan || 'Slogan da loja'}
                  </p>
                </div>
                <div className="w-full flex justify-between">
                  <div
                    className="w-16 h-16 rounded-xl"
                    style={{ backgroundColor: formData.corPrimaria }}
                  ></div>
                  <div
                    className="w-16 h-16 rounded-xl"
                    style={{ backgroundColor: formData.corSecundaria }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-black">
            <h2 className="text-2xl font-semibold text-[#3681B6]">Link Personalizado</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Amigável da Loja
              </label>
              <input
                type="text"
                name="slugLoja"
                value={formData.slugLoja}
                onChange={handleChange}
                placeholder="Ex: nome-da-loja"
                className={`w-full p-3 border ${
                  slugError ? 'border-red-500' : 'border-gray-300'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6] placeholder:text-gray-400`}
              />
              {isCheckingSlug && (
                <p className="text-sm text-gray-500 mt-1">Verificando disponibilidade...</p>
              )}
              {slugError && (
                <p className="text-sm text-red-500 mt-1">{slugError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pré-visualização do Link
              </label>
              <div className="p-3 bg-gray-100 rounded-xl">
                <a
                  href={`http://localhost:3000/${formData.slugLoja || 'nome-da-loja'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3681B6] hover:underline"
                >
                  {`localhost:3000/${formData.slugLoja || 'nome-da-loja'}`}
                </a>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-400 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={uploading || slugError || !formData.slugLoja}
                onClick={handleSubmit}
                className={`bg-gradient-to-r from-[#3681B6] to-[#2e6e99] text-white px-4 py-2 rounded-xl font-semibold ${
                  uploading || slugError || !formData.slugLoja
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gradient-to-r hover:from-[#2e6e99] hover:to-[#3681B6]'
                } transition cursor-pointer`}
              >
                {uploading ? 'Enviando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizacaoLoja;