import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/User';
import 'dotenv/config';

async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password || password.length < 8 || password === 'ChangeMe123456!') {
    throw new Error('Provide ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 chars) in .env');
  }
  await connectDatabase();
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== 'admin') {
        throw new Error('Email already belongs to a regular user; choose another ADMIN_EMAIL');
      }
      console.info('Admin account already exists; no changes made.');
      return;
    }
    await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'admin' });
    console.info('Admin account created:', email);
  } finally {
    await disconnectDatabase();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
