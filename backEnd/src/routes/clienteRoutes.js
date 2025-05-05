// src/app/api/clientes/route.js
import { NextResponse } from 'next/server';
const clienteController = require('@/controllers/clienteController');

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await clienteController.cadastrar({ body }, {
      json: (data) => data
    });
    
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}