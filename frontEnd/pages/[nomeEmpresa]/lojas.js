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
                // 1. Primeiro valida se o usuário tem acesso
                const validation = await fetch(
                    `${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/${nomeEmpresa}/validate`,
                    { credentials: 'include' }
                );

                if (!validation.ok) {
                    router.push(`/empresa/LoginEmpresa?returnTo=/${nomeEmpresa}/lojas`);
                    return;
                }

                const { empresa_slug } = await validation.json();

                // 2. Verifica se a empresa do token bate com a URL
                if (empresa_slug !== nomeEmpresa) {
                    setError('Você não tem permissão para acessar estas lojas');
                    setLoading(false);
                    return;
                }

                // 3. Busca as lojas (seu código existente)
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/${nomeEmpresa}/lojas`,
                    { credentials: 'include' }
                );

                //const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/${nomeEmpresa}/lojas`, {
                  //  credentials: 'include',
                //});

                if (!res.ok) {
                    throw new Error('Erro ao buscar as lojas');
                }

                const data = await res.json();
                setEmpresa(data.empresa);
                setLojas(data.lojas || []);
            } catch (err) {
                //console.error(err);
                //setError('Falha ao carregar as lojas');
                 router.push(`/empresa/LoginEmpresa?returnTo=/${nomeEmpresa}/lojas`);
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
