import express from 'express';
import dotenv from 'dotenv';
import empresaRoutes from './routes/empresaRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js';
import logoutRoutes from './routes/logoutRoutes.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import cookieParser from "cookie-parser";
dotenv.config();
const app = express();



app.use(cors({
  origin: true, 
  credentials: true
}));

app.use(cookieParser());
import expressSession from 'express-session';

app.use(
  expressSession({
    secret: 'seu-segredo-aquikkkk', 
    resave: false,              
    saveUninitialized: true,    
    cookie: { 
      httpOnly: false, 
      secure: true, // Somente se estiver em produção
      sameSite: 'none' // Se for em ambiente cross-origin
    }
  })
);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {

    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, 
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

// Suas outras rotas
app.use(express.json());
app.use(empresaRoutes);  
app.use(produtosRoutes);
app.use(logoutRoutes);
 

// Rota padrão
app.get('/', (req, res) => {
  res.send('API do Beto Amparo está no ar!');
});

// Iniciando o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Clique no link para abrir: http://localhost:${PORT}`);
});
