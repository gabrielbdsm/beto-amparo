import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import OwnerSidebar from '@/components/OwnerSidebar';

export default function ListaLojasEmpresa() {
    const [lojas, setLojas] = useState([]);
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const router = useRouter();
    const { nomeEmpresa } = router.query;

    useEffect(() => {
        if (!nomeEmpresa) return;

        async function fetchLojas() {
            try {
                console.log('🔴 [DEBUG] Validando acesso para:', nomeEmpresa);

                // 1. Validação simplificada
                const validation = await fetch(
                    `${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/validate`,
                    {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                // 2. Tratamento explícito de erros
                if (validation.status === 401 || validation.status === 403) {
                    console.log('🔴 Redirecionando para login');
                    window.location.href = `/empresa/LoginEmpresa?returnTo=/${nomeEmpresa}/lojas`;
                    return;
                }

                if (!validation.ok) {
                    throw new Error('Falha na validação');
                }

                // 3. Busca as lojas
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_EMPRESA_API}/${nomeEmpresa}/lojas`,
                    { credentials: 'include' }
                );

                if (!res.ok) throw new Error('Erro ao buscar lojas');

                const data = await res.json();
                setLojas(data.lojas || []);
                setEmpresa(data.empresa);

            } catch (err) {
                console.error('🔴 Erro:', err);
                window.location.href = `/empresa/LoginEmpresa?returnTo=/${nomeEmpresa}/lojas`;
            } finally {
                setLoading(false);
            }
        }

        fetchLojas();
    }, [nomeEmpresa]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-700 text-lg">Carregando lojas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-600 text-lg">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-5xl mx-auto py-10 px-4">
                <h1 className="text-3xl font-bold text-gray-700 mb-8 text-center">
                    Lojas da {empresa?.nome}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {lojas.map((loja) => (
                        <div
                            key={loja.id}
                            className="bg-white rounded shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                            onClick={() => router.push(`/loja/${loja.slug_loja}`)}
                        >
                            <Image
                                src={loja.foto_loja || '/icons/store_gray.svg'}
                                alt={loja.nome_fantasia}
                                width={400}
                                height={200}
                                className="w-full h-40 object-cover"
                            />
                            <div className="p-4">
                                <h2 className="text-xl font-semibold text-gray-800">{loja.nome_fantasia}</h2>
                                <p className="text-sm text-gray-500 mt-1">{loja.slogan}</p>
                                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm">
                                    Ver loja
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => router.push(`/empresa/${nomeEmpresa}/nova-loja`)}
                        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg transition"
                    >
                        + Adicionar loja
                    </button>

                </div>
            </div>
        </div>


    );
}
