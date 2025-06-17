import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';



const router = Router();

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { treino, ingles, estudo, dieta } = req.body;
  const userId = req.userId;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zera horas pra comparar só data

  try {
    const alreadyExists = await prisma.dailyProgress.findUnique({
      where: { date: today },
    });

    if (alreadyExists) {
      return res.status(400).json({ message: 'Progresso de hoje já registrado.' });
    }

    const progress = await prisma.dailyProgress.create({
      data: {
        date: today,
        treino,
        ingles,
        estudo,
        dieta,
        userId,
      },
    });

    return res.status(201).json(progress);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao registrar hábitos' });
  }
});

export default router;