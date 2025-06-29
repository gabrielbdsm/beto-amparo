// middleware.js
import { NextResponse } from 'next/server';
import * as jose from 'jose';

function parseJwt(token) {
    try {
        return jose.decodeJwt(token); // Use jose.decodeJwt para decodificar sem verificar a assinatura
    } catch (e) {
        // console.error("Erro ao decodificar token JWT (parseJwt):", e.message); // Removido log de debug
        return null;
    }
}

export async function middleware(req) {
    console.log('🛡 Middleware executado para:', req.nextUrl.pathname);

    const url = req.nextUrl.clone();
    const pathname = url.pathname;

    const loginEmpresaPath = '/empresa/LoginEmpresa';
    const loginClientePath = '/login';
    const authSuccessPath = '/auth-success';

    const tokenEmpresaCookie = req.cookies.get('token_empresa')?.value;
    const tokenClienteCookie = req.cookies.get('token_cliente')?.value;
  
    // 1. ROTAS PÚBLICAS OU INTERNAS DO NEXT.JS (SEM AUTENTICAÇÃO)
    if (
        pathname === loginEmpresaPath ||
        pathname === loginClientePath ||
        pathname === authSuccessPath ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/') ||
        pathname === '/favicon.ico' ||
        pathname === '/logo.png' ||
        pathname.startsWith('/static/') ||
        pathname === '/cadastroEmpresa' ||
        pathname === '/recuperar-senha'
    ) {
        return NextResponse.next();
    }

    let token;
    let decodedPayload;
   
    // 2. ROTAS PROTEGIDAS DA EMPRESA
    if (pathname.startsWith('/empresa')) {
        token = tokenEmpresaCookie;

        if (!token) {
            const redirectUrl = new URL(loginEmpresaPath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        try {
            const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET_KEY_EMPRESA;

            if (!secretKey) {
                // Mantido console.error para erro crítico de variável de ambiente
                console.error('Middleware: ERRO CRÍTICO: Variável de ambiente NEXT_PUBLIC_JWT_SECRET_KEY_EMPRESA não definida ou vazia!');
                throw new Error('Chave secreta de empresa não fornecida para verificar o JWT.');
            }
           
            const encodedSecret = new TextEncoder().encode(secretKey);
            const { payload } = await jose.jwtVerify(token, encodedSecret);
          
            decodedPayload = payload;
            
            
         

            if (decodedPayload.tipo !== 'empresa') {
                const redirectUrl = new URL(loginEmpresaPath, req.url);
                redirectUrl.searchParams.set('returnTo', pathname);
                return NextResponse.redirect(redirectUrl);
            }

            return NextResponse.next();

        } catch (error) {
            console.error('Middleware: Erro na verificação do token (empresa):', error.message); // Mantido
            const redirectUrl = new URL(loginEmpresaPath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // 2.1 ROTA PROTEGIDA DAS LOJAS DA EMPRESA (fora da pasta /empresa)
    if (/^\/[^\/]+\/lojas$/.test(pathname)) {
        token = tokenEmpresaCookie;

        if (!token) {
            const redirectUrl = new URL(loginEmpresaPath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        try {
            const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET_KEY_EMPRESA;

            if (!secretKey) {
                console.error('Middleware: ERRO CRÍTICO: Variável de ambiente NEXT_PUBLIC_JWT_SECRET_KEY_EMPRESA não definida ou vazia!');
                throw new Error('Chave secreta de empresa não fornecida para verificar o JWT.');
            }

            const encodedSecret = new TextEncoder().encode(secretKey);
            const { payload } = await jose.jwtVerify(token, encodedSecret);
            decodedPayload = payload;

            if (decodedPayload.tipo !== 'empresa') {
                const redirectUrl = new URL(loginEmpresaPath, req.url);
                redirectUrl.searchParams.set('returnTo', pathname);
                return NextResponse.redirect(redirectUrl);
            }

            return NextResponse.next();

        } catch (error) {
            console.error('Middleware: Erro na verificação do token (lojas):', error.message);
            const redirectUrl = new URL(loginEmpresaPath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // 3. ROTAS PROTEGIDAS DO CLIENTE
    else if (pathname.startsWith('/cliente')) {
        token = tokenClienteCookie;

        if (!token) {
            const redirectUrl = new URL(loginClientePath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        try {
            const secretKeyCliente = process.env.NEXT_PUBLIC_JWT_SECRET_KEY_CLIENTE;

            if (!secretKeyCliente) {
                console.error('Middleware: ERRO CRÍTICO: Variável de ambiente NEXT_PUBLIC_JWT_SECRET_KEY_CLIENTE não definida ou vazia!');
                throw new Error('Chave secreta de cliente não fornecida para verificar o JWT.');
            }

            const encodedSecretCliente = new TextEncoder().encode(secretKeyCliente);
            const { payload } = await jose.jwtVerify(token, encodedSecretCliente);
            decodedPayload = payload;

            if (decodedPayload.tipo !== 'cliente') {
                const redirectUrl = new URL(loginClientePath, req.url);
                redirectUrl.searchParams.set('returnTo', pathname);
                return NextResponse.redirect(redirectUrl);
            }
            return NextResponse.next();

        } catch (error) {
            console.error('Middleware: Erro na verificação do token (cliente):', error.message); // Mantido
            const redirectUrl = new URL(loginClientePath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // 4. OUTRAS ROTAS (NÃO PROTEGIDAS OU COM LÓGICA ESPECÍFICA)
    return NextResponse.next();
}

// CONFIGURAÇÃO DO MATCHER (Onde o middleware será executado)
/*export const config = {
    matcher: [
        '/((?!_next|api|favicon.ico|logo.png|static|empresa/LoginEmpresa|login|auth-success|cadastroEmpresa|recuperar-senha).*)',
    ],
};*/

//mudando matcher pra aceitar rota dinâmica
export const config = {
    matcher: [
        /*
         * Aplica o middleware a:
         * - tudo que começa com /empresa
         * - tudo que começa com /cliente
         * - qualquer rota com o padrão /[nomeEmpresa]/lojas
         */
        '/empresa/:path*',
        '/cliente/:path*',
        '/:path*/lojas',
    ],
};
