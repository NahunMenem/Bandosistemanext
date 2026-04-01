import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Uso: npx ts-node scripts/create-user.ts <usuario> <contraseña>');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.usuario.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  });

  console.log(`Usuario "${user.username}" creado/actualizado correctamente.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
