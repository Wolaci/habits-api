import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { treino, ingles, estudo, dieta } = req.body;
  const userId = req.userId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

router.get('/week', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  try {
    const history = await prisma.dailyProgress.findMany({
      where: {
        userId,
        date: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const formatted = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);

      date.setHours(0, 0, 0, 0);

      const record = history.find((d) => d.date.getTime() === date.getTime());

      formatted.push({
        date: date.toISOString().split('T')[0],
        treino: record?.treino ?? false,
        ingles: record?.ingles ?? false,
        estudo: record?.estudo ?? false,
        dieta: record?.dieta ?? false,
      });
    }

    return res.json({ history: formatted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
});

router.put('/:date', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId;
  const { date } = req.params;
  const { treino, estudo, ingles, dieta } = req.body;

  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  try {
    const existing = await prisma.dailyProgress.findUnique({
      where: {
        userId_date: {
          userId,
          date: parsedDate,
        },
      },
    });

    if (existing) {
    
      await prisma.dailyProgress.update({
        where: {
          userId_date: {
            userId,
            date: parsedDate,
          },
        },
        data: {
          treino,
          estudo,
          ingles,
          dieta,
        },
      });
    } else {
    
      await prisma.dailyProgress.create({
        data: {
          userId,
          date: parsedDate,
          treino: treino ?? false,
          estudo: estudo ?? false,
          ingles: ingles ?? false,
          dieta: dieta ?? false,
        },
      });
    }

    return res.json({ message: 'Registro salvo com sucesso!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao salvar registro' });
  }
});

router.get('/summary', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId;

  try {
    const allProgress = await prisma.dailyProgress.findMany({
      where: { userId },
    });

    const totalDias = allProgress.length;

    const diasCompletos = allProgress.filter(
      (day) => day.treino && day.estudo && day.ingles && day.dieta
    ).length;

    const progresso = totalDias > 0
      ? Math.round((diasCompletos / totalDias) * 100)
      : 0;

    const mediaPorHabito = {
      treino: allProgress.filter((d) => d.treino).length,
      estudo: allProgress.filter((d) => d.estudo).length,
      ingles: allProgress.filter((d) => d.ingles).length,
      dieta: allProgress.filter((d) => d.dieta).length,
    };

    return res.json({
      totalDias,
      diasCompletos,
      progresso,
      mediaPorHabito,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao gerar resumo' });
  }
});

export default router;