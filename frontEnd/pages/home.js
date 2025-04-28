import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const imagensHero = ["/hero_image1.jpg", "/hero_image2.jpg", "/hero_image3.jpg"];
  const [indiceAtual, setIndiceAtual] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % imagensHero.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#1B1B1B] relative">
      {/* Header */}
      <header className="flex justify-between items-center p-4 lg:px-12 lg:py-4">
        {/* Logo desktop */}
        <div className="flex items-center gap-2 lg:gap-4">
          <Image src="/logo.png" alt="Logo" width={60} height={60} />
          <div className="hidden lg:block">
            <Image src="/name.png" alt="Nome" width={140} height={60} />
          </div>
        </div>

        {/* Logo mobile */}
        <div className="absolute top-7 left-1/2 transform -translate-x-1/2 lg:hidden">
          <Image src="/name.png" alt="Nome" width={120} height={60} />
        </div>

        <button onClick={() => setMenuAberto(true)} className="lg:hidden">
          <Image src="/icons/menu_icon.svg" alt="Menu" width={24} height={24} />
        </button>

        {/* Menu horizontal desktop */}
        <nav className="hidden lg:flex items-center gap-8 text-sm text-[#0F1D2A]">
          <Link href="/" className="hover:underline flex items-center gap-2">
            <Image src="/icons/home.svg" alt="Home" width={20} height={20} />
            Home
          </Link>
          <Link href="/sobre" className="hover:underline flex items-center gap-2">
            <Image src="/icons/info.svg" alt="Sobre" width={20} height={20} />
            Sobre
          </Link>
          <Link href="/planos" className="hover:underline flex items-center gap-2">
            <Image src="/icons/plan.svg" alt="Planos" width={20} height={20} />
            Planos e Assinaturas
          </Link>
          <Link href="/suporte" className="hover:underline flex items-center gap-2">
            <Image src="/icons/help.svg" alt="Suporte" width={20} height={20} />
            Suporte
          </Link>
          <Link href="/login" passHref>
            <button className="bg-[#3681B6] text-white px-4 py-2 rounded-md font-semibold hover:opacity-90 transition">
              Login
            </button>
          </Link>
        </nav>
      </header>

      {/* Menu lateral mobile */}
      {menuAberto && (
        <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 p-6 rounded-l-2xl flex flex-col gap-6 lg:hidden">
          <button
            onClick={() => setMenuAberto(false)}
            className="self-end text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
            <Image src="/name.png" alt="Nome" width={120} height={60} />
          </div>

          <nav className="flex flex-col gap-4 mt-4 text-sm text-[#0F1D2A]">
            <Link href="/" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/home.svg" alt="Home" width={20} height={20} />
              Home
            </Link>
            <Link href="/sobre" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/info.svg" alt="Sobre" width={20} height={20} />
              Sobre
            </Link>
            <Link href="/planos" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/plan.svg" alt="Planos" width={20} height={20} />
              Planos e Assinaturas
            </Link>
            <Link href="/suporte" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/help.svg" alt="Suporte" width={20} height={20} />
              Suporte
            </Link>
          </nav>

          <Link href="/login" passHref>
            <button className="mt-auto self-center bg-[#3681B6] text-white px-8 py-2 rounded-md font-semibold hover:opacity-90 transition w-full max-w-[280px]">
              Login
            </button>
          </Link>
        </div>
      )}

      {/* Hero Section com carrossel */}
      <section className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0 transition-opacity duration-5000 ease-in-out brightness-[0.5]">
          <Image
            src={imagensHero[indiceAtual]}
            alt="Capa"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="z-20 text-center px-4">
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">Transforme o atendimento do seu negócio</h1>
          <p className="text-lg lg:text-xl mb-6">Automatize pedidos e agendamentos com a cara do seu negócio.</p>
          <div className="flex flex-col lg:flex-row gap-4 justify-center">
            <Link href="/cadastro" passHref>
              <button className="bg-[#F7941D] text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-[#d37313] transition duration-300">
                Quero experimentar grátis
              </button>
            </Link>
            <Link href="/sobre" passHref>
              <button className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white hover:text-[#1B1B1B] transition duration-300">
                Saiba mais
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Conteúdo principal */}
      <main className="bg-gray-50 flex flex-col items-center px-6 text-center gap-6 lg:px-32">
        {/* Como funciona */}
        <section className="py-16 w-full">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Como funciona o Beto Amparo?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  icon: "/icons/whatsapp_icon.svg",
                  title: "1. O cliente entra em contato via WhatsApp",
                  text: "O atendimento começa automaticamente com mensagens pré-programadas e link direto para o site.",
                },
                {
                  icon: "/logo.png",
                  title: "2. Ele faz o pedido ou agendamento no site",
                  text: "A plataforma web responsiva permite escolher produtos, horários ou serviços de forma prática.",
                },
                {
                  icon: "/icons/dashboard_icon.svg",
                  title: "3. Você gerencia tudo no seu painel",
                  text: "Acompanhe pedidos e agendamentos em tempo real, com controle total do atendimento.",
                },
              ].map((step, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
                  <Image src={step.icon} alt={step.title} width={64} height={64} className="mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="py-16 w-full">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Benefícios do Beto Amparo:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "/icons/rocket.svg",
                  title: "Fácil de usar",
                  text: "Receba pedidos em um só lugar, sem perder nenhuma mensagem.",
                },
                {
                  icon: "/icons/calendar.svg",
                  title: "Agendamentos sem esforço",
                  text: "Clientes escolhem horários sem precisar chamar.",
                },
                {
                  icon: "/icons/chart.svg",
                  title: "Painel para acompanhar tudo",
                  text: "Veja atendimentos e pedidos em um clique.",
                },
                {
                  icon: "/icons/money.svg",
                  title: "Mais vendas, menos trabalho",
                  text: "Aumente sua produtividade e vendas com menos esforço.",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition hover:-translate-y-1 hover:scale-105 flex flex-col items-center text-center border border-gray-200"
                >
                  <div className="bg-[#EAF3FA] p-4 rounded-full mb-4">
                    <Image src={benefit.icon} alt={benefit.title} width={32} height={32} />
                  </div>
                  <h3 className="text-[#1B76C6] font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
