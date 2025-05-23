import { useEffect, useState } from "react";
import axios from "axios";
import ExibirProduto from "@/components/ExibirProduto";
import Adicionais from "@/components/Adicionais";
import QuantidadeControl from "@/components/QuantidadeControl";
import Carrinho from "@/components/AdicionarCarrinho";
import NavBar from "@/components/NavBar";
import { Obersevacao } from "@/components/Observacao";
import { useRouter } from 'next/router';
export default function Produto() {
  const router = useRouter();
  const { id } = router.query 

  const [produto, setProduto] = useState(null);
  const [adicionais, setAdicionais] = useState({});
  const [quantidade, setQuantidade] = useState(1);
  const [selecionados, setSelecionados] = useState({});

  useEffect(() => { 
    if (!id) return;
    
    fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produto/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.produto) return
        setProduto({
          ...data.produto
        });
        
        if (data.produto.itens) {
          setAdicionais(data.produto.itens.adicionais);
          
        }
        
        
      })
      .catch((err) => {
        console.error("Erro ao buscar produto:", err);
      });
  }, [id]);

  const toggleAdicional = (name, price, type) => {
    setSelecionados((prev) => {
      const count = prev[name]?.count || 0;
      const newCount = type === "+" ? count + 1 : Math.max(count - 1, 0);
      return {
        ...prev,
        [name]: { count: newCount, price },
      };
    });
  };

  const subtotal =
    produto?.preco * quantidade +
    Object.values(selecionados).reduce(
      (acc, item) => acc + item.count * item.price,
      0
    );

  const handleAddToCart = () => {
    axios
      .post(`${process.env.NEXT_PUBLIC_EMPRESA_API}`, {
        produto: produto.name,
        quantidade,
        adicionais: selecionados,
        total: subtotal,
      })
      .then((res) => alert(res.data.message));
  };

  if (!produto) return <div className="p-4 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
  
        {/* Coluna: Produto e Observação */}
        <div className="flex-1 p-6 space-y-6">
          <ExibirProduto produto={produto} />
  
          <QuantidadeControl
            produto={produto}
            quantidade={quantidade}
            setQuantidade={setQuantidade}
          />
  
          <Obersevacao produto={produto} />
        </div>
  
        {/* Coluna: Adicionais e Carrinho */}
        <div className="flex-1 bg-gray-100 p-6 space-y-6 border-t md:border-t-0 md:border-l border-gray-200">
          <Adicionais
            adicionais={adicionais}
            selecionados={selecionados}
            toggleAdicional={toggleAdicional}
          />
  
          <Carrinho subtotal={subtotal} handleAddToCart={handleAddToCart} />
        </div>
      </div>
  
      {/* Navbar (sempre visível no final da tela) */}
      <div className="w-full max-w-5xl mt-6">
        <NavBar />
      </div>
    </div>
  );
  
  
}
