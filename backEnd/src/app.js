import express from 'express';
import dotenv from 'dotenv';
import empresaRoutes from './routes/empresaRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js';
import logoutRoutes from './routes/logoutRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
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
 

// Rota padrão
app.get('/', (req, res) => {
  res.send('API do Beto Amparo está no ar!');
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Clique no link para abrir: http://localhost:${PORT}`);
});