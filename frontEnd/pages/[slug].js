// pages/[slug].js
import ClienteHome from './client/ClienteHome';
import { useRouter } from 'next/router';

export default function SlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return <p>Carregando...</p>;

  return <ClienteHome site={slug} />;
}
