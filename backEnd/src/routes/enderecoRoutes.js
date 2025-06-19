import express from 'express';
import {
    buscarEnderecoCliente,
    salvarEnderecoCliente
} from '../controllers/client/enderecoController.js';

const router = express.Router();

router.get('/clientes/:clienteId/endereco',  buscarEnderecoCliente);
router.post('/clientes/:clienteId/endereco', salvarEnderecoCliente);

export default router;