import "@/styles/globals.css";
import { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster 
        position="top-right" 
        toastOptions={{
          success: {
            style: {
              background: '#28A745', // verde
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#DC3545', // vermelho
              color: 'white',
            },
          },
        }}
      />
    </>
  );
}

export default MyApp;