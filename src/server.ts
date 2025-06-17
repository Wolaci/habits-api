import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import userRoutes from './routes/user.routes';
import habitRoutes from './routes/habit.routes';


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);


app.get('/', (req, res) => {
  res.send('API Habits funcionando!');
});

app.listen(3333, () => {
  console.log('🚀 Servidor rodando em http://localhost:3333');
});
