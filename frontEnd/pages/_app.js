// frontend/pages/_app.js

import "@/styles/globals.css";
import { Toaster } from 'react-hot-toast'; // Importe o componente Toaster

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      {/* Adicione o componente Toaster aqui. Ele irá renderizar as notificações */}
      <Toaster />
    </>
  );
}