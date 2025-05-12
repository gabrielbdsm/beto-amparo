// middleware.js
import { NextResponse } from 'next/server';

export function middleware(req) {
  
  const token = req.cookies.get('token');
  

  if (!token) {
    
    return NextResponse.redirect(new URL('/loginEmpresa', req.url));
  }

  
  return NextResponse.next();
}


export const config = {
  matcher: [ '/empresa', '/adicionarProduto', '/empresa/(.*)'], 
};
