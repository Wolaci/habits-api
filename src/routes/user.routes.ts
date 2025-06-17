import { Router } from 'express';
import { prisma } from '../prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const router = Router();

// Criar novo usuário
router.post('/users', async (req, res) => {
  const { body } = req;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ message: 'Requisição inválida. Envie um JSON no corpo.' });
  }

  const { name, email, password } = body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Preencha todos os campos: name, email e password' });
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'E-mail já está em uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    });


    return res.status(201).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno ao criar usuário' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Preencha e-mail e senha' });

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user)
    return res.status(401).json({ message: 'Credenciais inválidas' });

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch)
    return res.status(401).json({ message: 'Credenciais inválidas' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  return res.json({ token });
});

export default router;
