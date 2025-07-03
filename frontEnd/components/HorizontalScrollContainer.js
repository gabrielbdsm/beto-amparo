import React, { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'; // Certifique-se de ter instalado @heroicons/react

const HorizontalScrollContainer = ({ children, corPrimaria }) => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            // Rola 70% da largura visível para um scroll mais suave e que revele mais conteúdo
            const scrollAmount = scrollRef.current.clientWidth * 0.7; 
            if (direction === 'left') {
                scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="relative">
            {/* Botão de Esquerda */}
            <button
                onClick={() => scroll('left')}
                // Posicionamento absoluto, centralizado verticalmente, z-index para ficar acima, sombra e transições
                // 'hidden md:block' esconde o botão em telas pequenas (mobile) e mostra em telas médias ou maiores
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110 focus:outline-none hidden md:block" 
                style={{ backgroundColor: corPrimaria, color: 'white' }} // Cores dinâmicas
                aria-label="Rolar para a esquerda" // Acessibilidade
            >
                <ChevronLeftIcon className="h-6 w-6" />
            </button>

            {/* Conteúdo rolável */}
            <div
                ref={scrollRef}
                // 'flex gap-4' para os itens, 'overflow-x-auto' para a rolagem, 'pb-4' para espaço inferior
                // 'scrollbar-hide' esconde a barra de rolagem (requer o plugin tailwind-scrollbar-hide)
                // 'scrollSnapType' ajuda a "encaixar" os itens ao parar a rolagem
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollSnapType: 'x mandatory' }} 
            >
                {children}
            </div>

            {/* Botão de Direita */}
            <button
                onClick={() => scroll('right')}
                // Mesmo posicionamento e estilos do botão esquerdo, mas à direita
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110 focus:outline-none hidden md:block" 
                style={{ backgroundColor: corPrimaria, color: 'white' }}
                aria-label="Rolar para a direita"
            >
                <ChevronRightIcon className="h-6 w-6" />
            </button>
        </div>
    );
};

export default HorizontalScrollContainer;