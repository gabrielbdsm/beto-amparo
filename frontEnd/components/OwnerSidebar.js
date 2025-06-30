import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import {verificarTipoDeLoja} from '../hooks/verificarTipoLoja'
// Helper component para os itens de navegação
function NavItem({ icon, label, path, currentSlug, onClick, className }) {
  const router = useRouter();

  const fullPath = currentSlug ? `/empresa/${currentSlug}${path}` : path;

  const isActive = router.asPath === fullPath || router.asPath.startsWith(`${fullPath}/`);

  // Classe base para os itens de navegação
  const baseClasses = "flex items-center gap-2 p-2 w-full text-left cursor-pointer rounded transition-all duration-200";

  // Estilos para o hover com sombra azul (assumindo que 'hover-shadow-blue' está no seu CSS global)
  const hoverShadowClasses = 'hover-shadow-blue';

  // Estilo para o item ativo: texto mais forte e branco quando ativo
  const activeTextClass = isActive ? 'font-bold text-white' : 'font-normal text-white';

  if (onClick) {
    return (
      <button
        onClick={onClick}
        // Aplica as classes base, a classe de hover (sempre) e a classe de texto ativo
        className={`${baseClasses} ${activeTextClass} ${className || ''} ${hoverShadowClasses}`}
      >
        <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={fullPath}
      // Aplica as classes base, a classe de hover (sempre) e a classe de texto ativo
      className={`${baseClasses} ${activeTextClass} ${className || ''} ${hoverShadowClasses}`}
    >
      <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default function OwnerSidebar({ children, slug }) {
  console.log("OwnerSidebar -> slug recebido:", slug);
  const router = useRouter();

  // Extrai nomeEmpresa do caminho da URL (mais confiável que router.query)
  const pathParts = router.asPath.split('/');
  const nomeEmpresa = pathParts[1]; // Pega o primeiro segmento após a raiz

  console.log('Nome da empresa extraído da URL:', nomeEmpresa); // Para debug

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slugEmpresa, setSlugEmpresa] = useState('');
  
  const [empresaSlugParaOutrasLojas, setEmpresaSlugParaOutrasLojas] = useState('');
  


  // Estados para o bloco do link da loja
  const [lojaData, setLojaData] = useState(null);
  const [loadingLoja, setLoadingLoja] = useState(true);
  const [errorLoja, setErrorLoja] = useState(null);

  // NOVO: Estado para controlar se o componente já foi hidratado no cliente.
  // Isso ajuda a prevenir erros de hidratação com conteúdo que depende de 'window' ou 'localStorage'.
  const [isClient, setIsClient] = useState(false);

  // Inicializa o estado de visibilidade do link block com um valor padrão para SSR (true).
  // O valor real do localStorage será carregado no useEffect após a hidratação.
  const [showLinkBlock, setShowLinkBlock] = useState(true);

  const [copied, setCopied] = useState(false);

  // Estado para o status de "loja fechada para pedidos"
  const [isLojaClosed, setIsLojaClosed] = useState(false);
  const [tipoLoja , setTipoLoja] = useState("")
  const [baseUrl ,setBaseUrl] = useState("")


  useEffect(() => {
    // Define que o código está rodando no cliente após a primeira renderização.
    setIsClient(true);

    // Carrega a visibilidade do localStorage APENAS no cliente, após a primeira renderização.
    // Isso resolve o problema de hidratação, pois o servidor e o cliente terão o mesmo estado inicial (true),
    // e o estado será ajustado para o valor salvo no localStorage somente no cliente.
    if (typeof window !== 'undefined') {
      const savedVisibility = localStorage.getItem('linkBlockVisibility');
       setBaseUrl(`${window.location.protocol}//${window.location.host}`)
      if (savedVisibility !== null) {
        setShowLinkBlock(JSON.parse(savedVisibility));
      }
    }

    if (!slug) {
      console.warn("OwnerSidebar: Slug não disponível ainda na prop, pulando fetch inicial.");
      setLoadingLoja(false);
      return;
    }
  
   
    const getLojaDetails = async () => {
      setLoadingLoja(true);
      setErrorLoja(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug-completo/${slug}`, {
          method: 'GET',
          credentials: 'include',
        });
        
        setTipoLoja( await verificarTipoDeLoja(slug))

        if (response.ok) {
          const data = await response.json();
          const { loja, empresa } = data;

          setLojaData(loja);
          setSlugEmpresa(loja?.slug_loja || '');
          setIsLojaClosed(loja?.is_closed_for_orders || false);

          // Aqui armazenamos o slug da empresa para uso no link de "Outras Lojas"
          setEmpresaSlugParaOutrasLojas(empresa?.site || empresa?.slug || '');

          console.log("OwnerSidebar: Dados da loja e empresa obtidos com sucesso:", data);
        } else {
          const errorData = await response.json();
          console.error('OwnerSidebar: Falha ao obter dados da loja:', errorData.message || response.statusText);
          setErrorLoja(errorData.message || `Erro ${response.status}: ${response.statusText}`);
          setLojaData(null);
          setSlugEmpresa('');
          setIsLojaClosed(false);
          setEmpresaSlugParaOutrasLojas('');
        }
      } catch (error) {
        console.error('OwnerSidebar: Erro ao buscar dados da loja:', error);
        setErrorLoja("Erro de conexão ao buscar dados da loja.");
        setLojaData(null);
        setSlugEmpresa('');
        setIsLojaClosed(false);
        setEmpresaSlugParaOutrasLojas('');
      } finally {
        setLoadingLoja(false);
      }
    };


    getLojaDetails();
  }, [slug]); // 'slug' é uma dependência do useEffect para re-executar quando ele muda.

  // Salva a preferência de visibilidade no localStorage sempre que showLinkBlock mudar.
  // Isso permanece em um useEffect separado para melhor clareza.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('linkBlockVisibility', JSON.stringify(showLinkBlock));
    }
  }, [showLinkBlock]);


  const currentActiveSlug = slug || slugEmpresa;


  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/empresa/LoginEmpresa');
      } else {
        const errorData = await response.json();
        alert(`Erro ao fazer logout: ${errorData.mensagem || 'Tente novamente.'}`);
      }
    } catch (error) {
      alert('Erro de conexão. Verifique sua rede e tente novamente.');
    }
  };

  const handleCopyClick = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Função para alternar o status de "Fechado para Pedidos"
  const handleToggleLojaStatus = async () => {
    const newStatus = !isLojaClosed; // Inverte o status atual
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${currentActiveSlug}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isClosed: newStatus }), // Envia o novo status para o backend
      });

      if (response.ok) {
        const data = await response.json();
        setIsLojaClosed(data.is_closed_for_orders); // Atualiza o estado com o status retornado pelo backend
        // Não é mais necessário um alert aqui, a UI vai se atualizar.
      } else {
        const errorData = await response.json();
        alert(`Erro ao alternar status da loja: ${errorData.message || 'Tente novamente.'}`);
      }
    } catch (error) {
      alert('Erro de conexão. Verifique sua rede e tente novamente.');
    }
  };

  const ownerAreaPath = `/empresa/${currentActiveSlug}/donoarea`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Header Mobile */}
      <div className="bg-[#3681B6] text-white flex items-center justify-between p-4 md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={32} height={32} />
          <span className="font-bold text-lg">BETO Amparo</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:static z-40 bg-[#3681B6] text-white w-64 min-h-screen p-4 flex flex-col justify-between
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="sidebar-menu-area">
          <div className="flex items-center mb-4">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="mr-2" />
            <div className="leading-tight text-lg">
              <span className="font-bold">BETO</span>{' '}
              <span className="font-normal">Amparo</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">

            {/* Bloco do link da loja - Renderizado condicionalmente apenas no cliente após hidratação */}
            {isClient && showLinkBlock && (loadingLoja || errorLoja || lojaData) && (
              <div className="mb-4 p-2 bg-white rounded-md text-[#3681B6] relative">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-semibold">Link da sua loja:</p>
                  <button
                    onClick={() => setShowLinkBlock(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none cursor-pointer"
                    title="Esconder link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                {loadingLoja && <p className="text-xs">Carregando...</p>}
                {errorLoja && <p className="text-xs text-red-500">{errorLoja}</p>}
                {lojaData && (
                  <>
                    <a href={`${baseUrl+"/loja/" + lojaData.slug_loja}`}
                     target="_blank" className="text-xs break-all text-[#3681B6]">
                      
                      {`${baseUrl+"/loja/" + lojaData.slug_loja}`}
                    </a>
                    <button
                      onClick={() => handleCopyClick(`${baseUrl}/loja/${lojaData.slug_loja}`)}
                      className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-white cursor-pointer"
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </>
                )}
              </div>
            )}
            {/* Botão para re-exibir o bloco do link, se ele estiver escondido - Renderizado condicionalmente apenas no cliente após hidratação */}
            {isClient && !showLinkBlock && (
              <button
                onClick={() => setShowLinkBlock(true)}
                className="mt-2 p-2 w-full text-left text-white flex items-center gap-2 hover-shadow-blue rounded transition-all duration-200 cursor-pointer"
                title="Mostrar link da loja"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.988 5.892EDBA2-86AB-4F60-B147-3BB96350E72C4.473 6.474 5.918 8.04A9 9 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.972 9.972 0 00-1.554-3.234l-.462-.462M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 14.25L12 7.5l-6.75 6.75" />
                </svg>
                Mostrar Link da Loja
              </button>
            )}

            {/* TOGGLE: Switch de alternar o status da loja - Cor de fundo condicional */}
            {lojaData && ( // Exiba apenas se os dados da loja foram carregados
              <div className={`mt-4 p-2 rounded-md text-white flex items-center justify-between ${isLojaClosed ? 'bg-gray-500' : 'bg-blue-700'}`}>
                <span>Loja: {isLojaClosed ? 'Fechada' : 'Aberta'} para Pedidos</span>
                <label className="switch"> {/* Usando a classe 'switch' do seu CSS */}
                  <input
                    type="checkbox"
                    checked={!isLojaClosed} // Checkbox é marcado se a loja estiver ABERTA
                    onChange={handleToggleLojaStatus}
                  />
                  <span className="slider round"></span> {/* Usando a classe 'slider round' do seu CSS */}
                </label>
              </div>
            )}

            <Link
              href={ownerAreaPath}
              className="flex flex-col items-center gap-2 p-2 cursor-pointer text-center owner-area-sidebar-item hover-shadow-blue"
            >
              <Image src="/icons/store_white.svg" alt="Área do dono" width={40} height={40} />
              <span className="font-semibold text-lg">Área do dono</span>
            </Link>
           
            {/* NavItems */}
            <NavItem icon="/icons/dashboard_white.svg" label="Dashboard" path="/dashboard" currentSlug={currentActiveSlug} className="sidebar-dashboard-item" />
           {tipoLoja !== "atendimento" &&  <NavItem icon="/icons/add_white.svg" label="Meus Produtos" path="/produtos" currentSlug={currentActiveSlug} className="sidebar-produtos-item" />}
            <NavItem icon="/icons/paint_white.svg" label="Personalizar Loja" path="/personalizacao" currentSlug={currentActiveSlug} className="sidebar-personalizar-item" />
            <NavItem icon="/icons/clock_white.svg" label="Horarios" path="/horarioEmpresa" currentSlug={currentActiveSlug} className="sidebar-horarios-item" />
          { 
            tipoLoja === "atendimento" && <NavItem icon="/icons/notes.png" label="Meus agendamentos" path="/meusAgendamentos" currentSlug={currentActiveSlug} className="sidebar-agendamentos-item" />
          }
           <NavItem icon="/icons/help_white.svg" label="Suporte" path="/suporte" currentSlug={currentActiveSlug} className="sidebar-suporte-item" />
            <Link
              href={`/${empresaSlugParaOutrasLojas}/lojas`}
              className="flex items-center gap-2 p-2 w-full text-left cursor-pointer rounded transition-all duration-200 font-normal text-white hover-shadow-blue"
            >
              <Image src="/icons/loja.png" alt="Outras Lojas" width={20} height={20} className="flex-shrink-0" />
              <span>Outras Lojas </span>
            </Link>
            <NavItem icon="/icons/help_white.svg" label="Suporte" path="/suporte" currentSlug={currentActiveSlug} className="sidebar-suporte-item" />
            
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-orange-400 hover:bg-orange-500 p-2 rounded text-white mt-4 w-full sidebar-logout-button"
        >
       
          SAIR
        </button>
      </aside>

      <main className="flex-1 bg-gray-100 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}