import { PrismaClient } from "@prisma/client";

/**
 * Em desenvolvimento, o Next.js recarrega módulos a cada alteração de
 * ficheiro (hot reload). Sem isto, cada recarga criaria uma nova
 * instância do PrismaClient e, rapidamente, esgotaríamos as ligações
 * disponíveis à base de dados. Guardamos a instância no objecto global,
 * que sobrevive aos recarregamentos.
 */
const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = prisma;
}
