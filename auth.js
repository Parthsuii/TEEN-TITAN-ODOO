const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '7d';

router.use(cookieParser());

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name }
    });

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 });

    const { password: _, ...rest } = user;
    res.status(201).json({ user: rest });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { emailOrSku, password } = req.body;
    if (!emailOrSku || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrSku }, { name: emailOrSku }] }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 });

    const { password: _p, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// 4. ME
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ user: null });
    const data = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: data.sub } });
    if (!user) return res.status(401).json({ user: null });
    const { password: _p, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    res.status(401).json({ user: null });
  }
});

// 5. FORGOT PASSWORD (SIMULATION MODE)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const resetLink = `http://localhost:5173/reset-password?token=${user.id}`;

  // --- 👇 THIS PREVENTS THE GMAIL ERROR 👇 ---
  console.log("\n========================================");
  console.log("📧 EMAIL SIMULATION (Check here instead of Gmail)");
  console.log(`TO: ${email}`);
  console.log(`LINK: ${resetLink}`);
  console.log("========================================\n");

  res.json({ message: "Reset link generated! Check your Server Terminal." });
});

module.exports = router;