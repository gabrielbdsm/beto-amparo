import Link from "next/link";


const NavBar = ({ empresaId }) => (
  <nav className="flex justify-around items-center bg-blue-300 text-white py-2 shadow-inner rounded-t-4xl">
    <Link href={`/empresa/${empresaId}`} className="flex flex-col items-center hover:text-blue-500">
      {/* Ícone Home */}
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5m6-11v10a1 1 0 001 1h5" />
      </svg>
      <span>Início</span>
    </Link>

    <Link href="/pedidos" className="flex flex-col items-center hover:text-blue-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 mb-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V5a4 4 0 00-8 0v6M5 8h14l1 13H4L5 8z"
        />
      </svg>
      <span>Pedidos</span>
    </Link>

    <Link href="/carrinho" className="flex flex-col items-center hover:text-blue-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 mb-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.6 8m10.6-8l1.6 8M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
      <span>Carrinho</span>
    </Link>
  </nav>
);

export default NavBar;
