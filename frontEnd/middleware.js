import { NextResponse } from 'next/server';



function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (e) {
    return null;
  }
}

export function middleware(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  let token;
  let decoded;

  
  if (pathname.startsWith('/empresa')) {
    token = req.cookies.get('token_empresa')?.value;
    decoded = token ? parseJwt(token) : null;

    if (!decoded || decoded.tipo !== 'empresa') {
      url.pathname = '/loginEmpresa';
      return NextResponse.redirect(url);
    }

  } else if (pathname.startsWith('/cliente')) {
    token = req.cookies.get('token_cliente')?.value;
    decoded = token ? parseJwt(token) : null;

    if (!decoded || decoded.tipo !== 'cliente') {
      url.pathname = '/loginCliente';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/empresa/:path*', '/cliente/:path*'],
};
