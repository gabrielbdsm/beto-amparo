// frontEnd/components/ProdutoCard.js
import { useState } from "react";
import Image from "next/image";

export default function ProdutoCard({
  produto,
  quantidade = 1,
  onAdicionar, // Essa prop recebe a função handleAdicionar do ClienteHome
  onAumentar,
  onDiminuir,
  getImagemProduto,
  slug,
  cor
}) {
  const [imageSrc, setImageSrc] = useState(getImagemProduto(produto.image));

  const handleCardClick = () => {
    window.location.href = `produto/${slug}/${produto.id}`;
  };

  const handleAdicionarClick = (event) => {
    event.stopPropagation(); 
    onAdicionar(produto); 
  };

  const handleQuantidadeClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md p-3 w-40 sm:w-48 md:w-56 lg:w-64 flex flex-col items-center cursor-pointer"
      onClick={handleCardClick} 
    >
      <div className="relative w-full h-32 sm:h-36 md:h-40 aspect-[4/3]">
        <Image
          src={imageSrc}
          alt={produto.nome}
          fill
          className="rounded-md object-cover"
          unoptimized
          onError={() => setImageSrc("/frontEnd/public/fallback.png")}
        />
      </div>

      <div className="w-full text-center mt-2">
        <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{produto.nome}</h2>
        <p className="text-xs text-gray-500 line-clamp-2">{produto.descricao}</p>
        <p className="text-green-600 font-bold mt-1">
          R$ {parseFloat(produto.preco).toFixed(2)}
        </p>
      </div>

      <button
        onClick={handleAdicionarClick}
        className="mt-2 px-2 py-1 text-white rounded text-xs sm:text-sm font-medium flex items-center gap-1 transition-all"
        style={{ backgroundColor: cor }}
        onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(90%)"}
        onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(100%)"}
      >
        <Image src="/icons/cart_icon.svg" alt="Carrinho" width={14} height={14} />
        Adicionar
      </button>

    </div>

  );
}