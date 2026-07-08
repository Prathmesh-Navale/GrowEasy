import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import importRoutes from './routes/importRoutes.js';
import leadSourceRoutes from './routes/leadSourceRoutes.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002'
  ],
  credentials: true
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/import', upload.single('file'), importRoutes);
app.use('/api/lead-sources', leadSourceRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});


