import express from 'express';
import dotenv from 'dotenv';
import empresaRoutes from './routes/empresaRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js';
import logoutRoutes from './routes/logoutRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
//import { fileURLToPath } from 'url';
import carrinhoRoutes from './routes/carrinhoRoutes.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();

// Configuração do CORS
//app.use(cors('localhost:3000'));

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// CORS
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Configuração do Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const isValid = filetypes.test(path.extname(file.originalname).toLowerCase()) && filetypes.test(file.mimetype);
    if (isValid) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas!'), false);
  },
}).single('image');

// Rota de upload para o bucket 'loja'
app.post('/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;

    const { data, error } = await supabase.storage
      .from('loja')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) return res.status(500).json({ message: error.message });

    const { data: publicUrlData } = supabase.storage.from('loja').getPublicUrl(fileName);

    res.json({ message: 'Imagem enviada com sucesso!', url: publicUrlData.publicUrl });
  });
});

/*
app.use(express.json());
app.use(cors(corsOptions));
*/
import lojaRoutes from './routes/lojaRoutes.js';

app.use('/api', empresaRoutes);
app.use(produtosRoutes);
app.use(logoutRoutes);
app.use(carrinhoRoutes);
app.use('/api', lojaRoutes);
app.use('/api', clienteRoutes);
app.use('/api', loginRoutes);
app.use(pedidoRoutes);


// Rota padrão
app.get('/', (req, res) => {
  res.send('API do Beto Amparo está no ar!');
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Clique no link para abrir: http://localhost:${PORT}`);
});