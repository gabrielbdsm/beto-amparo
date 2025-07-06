import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { verificarTipoDeLoja } from '../hooks/verificarTipoLoja'; // Verifique o caminho real

// Componente para itens do menu com link ou botão
function NavItem({ icon, label, path, currentSlug, onClick, className }) {
  const router = useRouter();

  // Verifica se path é URL completa (http, https)
  const isFullPathURL = path.startsWith('http://') || path.startsWith('https://');

  // Monta o path final, concatenando slug se necessário
  const targetPath = isFullPathURL ? path : (currentSlug ? `/empresa/${currentSlug}${path}` : path);

  // Verifica se o link está ativo (rota exata ou subrota)
  const normalizedAsPath = router.asPath.split('?')[0]; // Ignora query params
  const isActive =
    normalizedAsPath === targetPath ||
    (normalizedAsPath.startsWith(targetPath + '/') && targetPath.length > `/empresa/${currentSlug}`.length);

  const baseClasses =
    'flex items-center gap-2 p-2 w-full text-left cursor-pointer rounded transition-all duration-200';
  const hoverShadowClasses = 'hover-shadow-blue'; // Ajuste para sua classe CSS
  const activeTextClass = isActive ? 'font-bold text-white' : 'font-normal text-white';

  // Nota: Next.js Image não aceita className diretamente para estilos no wrapper, mas você pode contornar com div.
  const Icon = (
    <div className="flex-shrink-0">
      <Image src={icon} alt={label} width={20} height={20} />
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${activeTextClass} ${className || ''} ${hoverShadowClasses}`}
      >
        {Icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={targetPath}
      className={`${baseClasses} ${activeTextClass} ${className || ''} ${hoverShadowClasses}`}
    >
      {Icon}
      <span>{label}</span>
    </Link>
  );
}

function LevelMedal({ level }) {
  let medalImage = null;
  let altText = '';

  switch (level) {
    case 'Bronze':
      medalImage = '/icons/medal_bronze.png';
      altText = 'Medalha de Bronze';
      break;
    case 'Prata':
      medalImage = '/icons/medal_silver.png';
      altText = 'Medalha de Prata';
      break;
    case 'Ouro':
      medalImage = '/icons/medal_gold.png';
      altText = 'Medalha de Ouro';
      break;
    default:
      return null;
  }

  return (
    <div className="flex items-center justify-center">
      <Image src={medalImage} alt={altText} width={30} height={30} />
    </div>
  );
}

export default function OwnerSidebar({ children, slug }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slugEmpresa, setSlugEmpresa] = useState(''); // Slug da loja

  const [lojaData, setLojaData] = useState(null);
  const [loadingLoja, setLoadingLoja] = useState(true);
  const [errorLoja, setErrorLoja] = useState(null);
  const [isLojaClosed, setIsLojaClosed] = useState(false);
  const [shopLevel, setShopLevel] = useState('Nenhum');

  const [isClient, setIsClient] = useState(false);
  const [showLinkBlock, setShowLinkBlock] = useState(true);
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  const [empresaSlugParaOutrasLojas, setEmpresaSlugParaOutrasLojas] = useState('');
  const [tipoLoja, setTipoLoja] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.querySelector('html');
      const body = document.body;
  
      if (sidebarOpen) {
        body.style.overflow = 'hidden';
        if (html) html.style.overflow = 'hidden';
      } else {
        body.style.overflow = '';
        if (html) html.style.overflow = '';
      }
    }
  }, [sidebarOpen]);
  
  
  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined') {
      const savedVisibility = localStorage.getItem('linkBlockVisibility');
      if (savedVisibility !== null) setShowLinkBlock(JSON.parse(savedVisibility));
      setBaseUrl(`${window.location.protocol}//${window.location.host}`);
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoadingLoja(false);
      return;
    }

    async function getLojaDetails() {
      setLoadingLoja(true);
      setErrorLoja(null);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug-completo/${slug}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || res.statusText);
        }

        const data = await res.json();
        const { loja, empresa } = data;

        setLojaData(loja);
        setSlugEmpresa(loja?.slug_loja || '');
        setIsLojaClosed(loja?.is_closed_for_orders || false);
        setShopLevel(loja?.level_tier || 'Nenhum');
        setEmpresaSlugParaOutrasLojas(empresa?.slug_empresa || empresa?.site || empresa?.nome || '');

        if (loja?.tipo_loja) {
          setTipoLoja(loja.tipo_loja);
        } else {
          const tipo = await verificarTipoDeLoja(slug);
          setTipoLoja(tipo);
        }

        console.log('OwnerSidebar: dados carregados:', data);
      } catch (error) {
        console.error('OwnerSidebar: erro ao buscar loja:', error);
        setErrorLoja(error.message || 'Erro ao buscar dados da loja');
        setLojaData(null);
        setSlugEmpresa('');
        setIsLojaClosed(false);
        setShopLevel('Nenhum');
        setEmpresaSlugParaOutrasLojas('');
        setTipoLoja('');
      } finally {
        setLoadingLoja(false);
      }
    }

    getLojaDetails();
  }, [slug]);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('linkBlockVisibility', JSON.stringify(showLinkBlock));
    }
  }, [showLinkBlock, isClient]);

  const currentActiveSlug = slugEmpresa || slug;

  const handleLogout = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        router.push('/empresa/LoginEmpresa');
      } else {
        const errorData = await res.json();
        alert(`Erro ao fazer logout: ${errorData.mensagem || 'Tente novamente.'}`);
      }
    } catch {
      alert('Erro de conexão. Verifique sua rede e tente novamente.');
    }
  };

  const handleCopyClick = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLojaStatus = async () => {
    const newStatus = !isLojaClosed;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${currentActiveSlug}/toggle-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isClosed: newStatus }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao alterar status');
      }

      const data = await res.json();
      setIsLojaClosed(data.is_closed_for_orders);
    } catch (error) {
      alert(error.message || 'Erro de conexão. Verifique sua rede e tente novamente.');
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
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
  className={`
    fixed md:static z-40 bg-[#3681B6] text-white w-64 min-h-screen p-4 flex flex-col justify-between
    transition-transform duration-300 overflow-y-auto
    max-h-screen
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
    `}
    style={{
        scrollbarWidth: 'none',           
        msOverflowStyle: 'none',          
    }}
    >
    <style jsx>{`
        aside::-webkit-scrollbar {
        display: none; /* Chrome, Safari e Opera */
        }
    `}</style>


        <div className="sidebar-menu-area">
          <div className="flex items-center mb-4">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="mr-2" />
            <div className="leading-tight text-lg">
              <span className="font-bold">BETO</span>{' '}
              <span className="font-normal">Amparo</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Nível da Loja */}
            {lojaData && shopLevel !== 'Nenhum' && (
              <div className="p-2 rounded-md bg-blue-700 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <LevelMedal level={shopLevel} />
                  <span className="text-sm font-semibold">Nível {shopLevel}</span>
                </div>
                <Link
                  href={`/empresa/${currentActiveSlug}/conquistas`}
                  className="text-xs underline opacity-80 hover:opacity-100 transition-opacity"
                >
                  Ver mais
                </Link>
              </div>
            )}

            {/* Link da Loja */}
            {isClient && showLinkBlock && (loadingLoja || errorLoja || lojaData) && (
              <div className="mb-4 p-2 bg-white rounded-md text-[#3681B6] relative">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-semibold">Link da sua loja:</p>
                  <button
                    onClick={() => setShowLinkBlock(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none cursor-pointer"
                    title="Esconder link"
                  >
                    {/* Ícone olho */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
                {loadingLoja && <p className="text-xs">Carregando...</p>}
                {errorLoja && <p className="text-xs text-red-500">{errorLoja}</p>}
                {lojaData && (
                  <>
                   <a
  href={`${baseUrl}/loja/${lojaData.slug_loja}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs break-all text-[#3681B6] no-underline hover:underline"
>
  {baseUrl}/loja/{lojaData.slug_loja}
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

            {/* Mostrar botão para revelar link escondido */}
            {isClient && !showLinkBlock && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => setShowLinkBlock(true)}
                  className="p-2 text-white flex items-center gap-2 hover-shadow-blue rounded transition-all duration-200 cursor-pointer text-center"
                  title="Mostrar link da loja"
                >
                  Mostrar Link da Loja
                </button>
              </div>
            )}

            {/* Status da Loja */}
            {lojaData && (
              <div
                className={`mt-4 p-2 rounded-md text-white flex items-center justify-between ${
                  isLojaClosed ? 'bg-gray-500' : 'bg-blue-700'
                }`}
              >
                <span>Loja: {isLojaClosed ? 'Fechada' : 'Aberta'} para Pedidos</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!isLojaClosed}
                    onChange={handleToggleLojaStatus}
                    aria-label="Alternar status da loja"
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            )}

            {/* Navegação */}
            <Link
              href={ownerAreaPath}
              className="flex flex-col items-center gap-2 p-2 cursor-pointer text-center owner-area-sidebar-item hover-shadow-blue"
            >
              <Image src="/icons/store_white.svg" alt="Área do dono" width={40} height={40} />
              <span className="font-semibold text-lg">Área do dono</span>
            </Link>

            <NavItem
              icon="/icons/dashboard_white.svg"
              label="Dashboard"
              path="/dashboard"
              currentSlug={currentActiveSlug}
              className="sidebar-dashboard-item"
            />

            {tipoLoja !== 'atendimento' && (
              <NavItem
                icon="/icons/add_white.svg"
                label="Meus Produtos"
                path="/produtos"
                currentSlug={currentActiveSlug}
                className="sidebar-produtos-item"
              />
            )}

            <NavItem
              icon="/icons/paint_white.svg"
              label="Personalizar Loja"
              path="/personalizacao"
              currentSlug={currentActiveSlug}
              className="sidebar-personalizar-item"
            />

            {tipoLoja === 'atendimento' && (
              <>
                <NavItem
                  icon="/icons/clock_white.svg"
                  label="Horarios"
                  path="/horarioEmpresa"
                  currentSlug={currentActiveSlug}
                  className="sidebar-horarios-item"
                />
                <NavItem
                  icon="/icons/notes.png"
                  label="Meus agendamentos"
                  path="/meusAgendamentos"
                  currentSlug={currentActiveSlug}
                  className="sidebar-agendamentos-item"
                />
              </>
            )}

            <NavItem
              icon="/icons/trophy_white.svg"
              label="Minhas Conquistas"
              path="/conquistas"
              currentSlug={currentActiveSlug}
              className="sidebar-conquistas-item"
            />

            <NavItem
              icon="/icons/help_white.svg"
              label="Suporte"
              path="/suporte"
              currentSlug={currentActiveSlug}
              className="sidebar-suporte-item"
            />

            <NavItem
              icon="/icons/settings_white.svg"
              label="Configurações"
              path="/configuracoes/"
              currentSlug={currentActiveSlug}
              className="sidebar-configuracoes-item"
            />

            {/* Outras Lojas */}
            {empresaSlugParaOutrasLojas && (
              <Link
                href={`/${empresaSlugParaOutrasLojas}/lojas`}
                className="flex items-center gap-2 p-2 w-full text-left cursor-pointer rounded transition-all duration-200 font-normal text-white hover-shadow-blue"
              >
                <Image src="/icons/loja.png" alt="Outras Lojas" width={20} height={20} />
                <span>Outras Lojas</span>
              </Link>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-orange-400 hover:bg-orange-500 p-2 rounded text-white mt-4 w-full sidebar-logout-button"
        >
          SAIR
        </button>
      </aside>

      <main className="flex-1 bg-gray-100 p-6 md:p-8">{children}</main>
    </div>
  );
}
