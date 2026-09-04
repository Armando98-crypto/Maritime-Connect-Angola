import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/**
 * Cria (ou mantém) o utilizador administrador da plataforma.
 *
 * Credenciais por omissão (permitem arrancar rapidamente em ambiente de
 * desenvolvimento). Em produção, definir SEED_ADMIN_EMAIL e
 * SEED_ADMIN_PASSWORD no ambiente antes de correr o seed.
 *
 *   npm run db:seed
 *
 * Se a conta já existir, apenas garante que fica marcada como admin — é
 * idempotente e pode ser corrido quantas vezes for preciso.
 */
async function garantirAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@maritimeconnect.ao").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin2026!";

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true },
    create: {
      nome: "Administrador",
      email,
      passwordHash,
      papel: "ARMADOR",
      isAdmin: true,
    },
    select: { id: true, nome: true, email: true, papel: true, isAdmin: true },
  });

  console.log("Administrador garantido:");
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${process.env.SEED_ADMIN_PASSWORD ? "(definida via SEED_ADMIN_PASSWORD)" : password}`);
}

async function main() {
  await garantirAdmin();
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });