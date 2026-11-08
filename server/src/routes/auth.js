import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['patient', 'doctor']).default('patient'),
  specialization: z.string().optional(),
  fee: z.coerce.number().min(0).optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    if (await User.findOne({ email: data.email.toLowerCase() })) {
      return res.status(409).json({ message: 'That email is already registered.' });
    }
    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      passwordHash: await bcrypt.hash(data.password, 10),
      profile:
        data.role === 'doctor'
          ? { specialization: data.specialization || 'General Physician', fee: data.fee ?? 500 }
          : undefined,
    });
    res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Wrong email or password.' });
    }
    res.json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toSafeJSON() }));

export default router;
