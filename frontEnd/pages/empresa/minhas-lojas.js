// pages/empresa/minhas-lojas.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image'; // <-- AQUI ESTÁ A LINHA QUE FALTAVA
import { FaStore, FaExternalLinkAlt, FaTachometerAlt, FaSignOutAlt } from 'react-icons/fa';

const LojaCard = ({ loja }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="p-5">
            <div className="flex items-center mb-3">
                <FaStore className="text-xl text-blue-500 mr-3" />
                <h2 className="text-xl font-bold text-gray-800">{loja.nome_fantasia}</h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
                URL da loja: <span className="font-mono bg-gray-100 p-1 rounded">/loja/{loja.slug_loja}</span>
            </p>
        </div>
        <div className="bg-gray-50 px-5 py-3 flex justify-end gap-4">
            <Link 
                href={`/loja/${loja.slug_loja}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 font-semibold"
            >
                <FaExternalLinkAlt />
                Ver Loja
            </Link>
            <Link 
                href={`/empresa/${loja.slug_loja}/donoarea`} 
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
                <FaTachometerAlt />
                Acessar Painel
            </Link>
        </div>
    </div>
);


export default function MinhasLojas() {
    const router = useRouter();
    const [lojas, setLojas] = useState([]);
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleLogout = async () => {
        try {
            await fetch('/api/logoutEmpresa', { method: 'POST' }); 
        } catch (error) {
            console.error("Falha no logout:", error);
        } finally {
            router.push('/loginEmpresa');
        }
    };

    useEffect(() => {
        async function fetchHubData() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/minhas-lojas`, {
                    credentials: 'include',
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        router.push('/loginEmpresa');
                        return;
                    }
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Falha ao buscar dados');
                }

                const { empresa, lojas } = await res.json();
                setEmpresa(empresa);
                setLojas(lojas);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchHubData();
    }, [router]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100">Carregando...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100 text-red-600">Erro: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header style={{ backgroundColor: '#3681B6' }} className="shadow-lg text-white">
                <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Logo da Plataforma" width={50} height={50} />
                        <span className="hidden sm:block text-right font-semibold">
                            {empresa ? `Olá, ${empresa.nome}!` : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 font-semibold hover:bg-white/20 transition-all duration-200 ease-in-out p-2 rounded-full"
                            title="Sair"
                        >
                            <FaSignOutAlt className="text-xl" />
                            <span className="hidden md:block">Sair</span>
                        </button>
                    </div>

                </div>
            </header>
            
            <main className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="text-left mb-10">
                    <h2 className="text-3xl font-extrabold text-gray-800">Minhas Lojas</h2>
                    <p className="text-gray-500 mt-2 text-lg">Selecione a loja que você deseja gerenciar.</p>
                </div>
                
                {lojas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {lojas.map(loja => (
                            <LojaCard key={loja.id} loja={loja} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white p-12 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-800">Nenhuma loja encontrada</h3>
                        <p className="text-gray-500 mt-2">Você ainda não cadastrou nenhuma loja.</p>
                    </div>
                )}
            </main>
        </div>
    );
}