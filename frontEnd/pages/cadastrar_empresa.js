import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CadastrarEmpresa() {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    responsavel: '',
    telefone: '',
    endereco: '',
    cidade: '',
    uf: '',
    site: '',
    categoria: '',
    email: '',
    senha: '',
  });
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  const fields = [
    { label: 'Nome', name: 'nome' },
    { label: 'CNPJ', name: 'cnpj' },
    { label: 'Responsável', name: 'responsavel' },
    { label: 'Telefone', name: 'telefone' },
    { label: 'Endereço', name: 'endereco' },
    { label: 'Cidade', name: 'cidade' },
    {
      label: 'UF',
      name: 'uf',
      type: 'select',
      options: [
        'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
        'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
      ],
    },
    { label: 'Site', name: 'site' },
    { label: 'Categoria', name: 'categoria', type: 'select', options: ['Comércio', 'Serviços', 'Alimentação', 'Tecnologia', 'Educação', 'Indústria'] },
    
    { label: 'Email', name: 'email', type: 'email' },
    { label: 'Senha', name: 'senha', type: 'password' },    
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;
    if (name === 'cnpj') {
      newValue = value.replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    } else if (name === 'telefone') {
      newValue = value.replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setError('');
  };

  const handleNext = () => {
    if (step < fields.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.includes('@')) {
      setError('Email inválido.');
      return;
    }
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_EMPRESA_API + '/addEmpresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.mensagem || 'Erro ao cadastrar empresa.');
      alert('Empresa cadastrada com sucesso!');
      setFormData({
        nome: '', cnpj: '', responsavel: '', telefone: '', endereco: '',
        cidade: '', uf: '', site: '', categoria: '',  email: '', senha: '', 
      });
      setStep(0);
    } catch (error) {
      setError(error.message);
    }
  };

  const currentField = fields[step];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full sm:max-w-md">
        
        {/* Logo + Título lado a lado */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-18" />
          <h1 className="text-2xl font-bold text-[#3681B6]">Cadastre sua empresa</h1>
        </div>

        {/* Subtítulo condicional */}
        <div className="mb-2 text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            {step < 9 ? 'Informações da empresa' : 'Dados de acesso'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {currentField.label}
            </label>
            {currentField.type === 'select' ? (
              <select
                name={currentField.name}
                value={formData[currentField.name]}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#3681B6]"
                required
              >
                <option value="">Selecione</option>
                {currentField.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={currentField.type || 'text'}
                name={currentField.name}
                value={formData[currentField.name]}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#3681B6]"
                required
              />
            )}
          </div>

          <div className="flex justify-between mt-6">
            {step > 0 ? (
                <button
                type="button"
                onClick={handleBack}
                className="p-2 px-4 bg-gray-200 rounded-xl text-gray-700"
                >
                <ChevronLeft className="inline-block mr-1" size={18} /> Voltar
                </button>
            ) : <div />}

            {step === fields.length - 1 ? (
                <button
                type="submit"
                className="p-2 px-4 bg-[#3681B6] text-white rounded-xl"
                >
                Cadastrar
                </button>
            ) : (
                <button
                type="button"
                onClick={handleNext}
                className="p-2 px-4 bg-[#3681B6] text-white rounded-xl"
                >
                Avançar <ChevronRight className="inline-block ml-1" size={18} />
                </button>
            )}
            </div>

        </form>
      </div>
    </div>
  );
}
