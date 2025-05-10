import express from 'express';
import dotenv from 'dotenv';
import empresaRoutes from './routes/empresaRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js';
import logoutRoutes from './routes/logoutRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração do __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Configuração do CORS
//app.use(cors('localhost:3000'));

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Configuração do multer para salvar as imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Defina o diretório onde as imagens serão salvas
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Defina o nome do arquivo com base no timestamp para evitar conflitos
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Criando o middleware do multer com limites e tipo de arquivo
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50MB
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
}).single('image'); // 'image' é o nome do campo no formulário

// Rota para upload de imagem
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).send({ message: err.message });
    }
    res.send({ message: 'Imagem enviada com sucesso!', file: req.file });
  });
});


app.use(express.json());
app.use(cors(corsOptions));
app.use(empresaRoutes);  
app.use(produtosRoutes);
app.use(logoutRoutes);
app.use(clienteRoutes);


// Rota padrão
app.get('/', (req, res) => {
  res.send('API do Beto Amparo está no ar!');
});

// Iniciando o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Clique no link para abrir: http://localhost:${PORT}`);
});
