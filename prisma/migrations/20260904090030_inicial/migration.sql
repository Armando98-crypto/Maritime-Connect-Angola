-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ARMADOR', 'AGENTE');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('ABERTO', 'ATRIBUIDO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoProposta" AS ENUM ('PENDENTE', 'ACEITE', 'RECUSADA');

-- CreateEnum
CREATE TYPE "EstadoComissao" AS ENUM ('PENDENTE', 'PAGA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_agente" (
    "userId" TEXT NOT NULL,
    "nomeEmpresa" TEXT NOT NULL,
    "numeroLicenca" TEXT NOT NULL,
    "licencaVerificada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "perfis_agente_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "armadorId" TEXT NOT NULL,
    "navio" TEXT NOT NULL,
    "dataPrevistaChegada" TIMESTAMP(3) NOT NULL,
    "detalhes" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'ABERTO',
    "propostaAceiteId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "preco" DECIMAL(12,2) NOT NULL,
    "prazoDias" INTEGER NOT NULL,
    "estado" "EstadoProposta" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "propostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "valorBase" DECIMAL(12,2) NOT NULL,
    "percentagem" DECIMAL(4,2) NOT NULL,
    "valorComissao" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoComissao" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_agente_numeroLicenca_key" ON "perfis_agente"("numeroLicenca");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_propostaAceiteId_key" ON "pedidos"("propostaAceiteId");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "propostas_pedidoId_idx" ON "propostas"("pedidoId");

-- CreateIndex
CREATE INDEX "propostas_agenteId_idx" ON "propostas"("agenteId");

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_pedidoId_key" ON "comissoes"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_pedidoId_key" ON "avaliacoes"("pedidoId");

-- AddForeignKey
ALTER TABLE "perfis_agente" ADD CONSTRAINT "perfis_agente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_armadorId_fkey" FOREIGN KEY ("armadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_propostaAceiteId_fkey" FOREIGN KEY ("propostaAceiteId") REFERENCES "propostas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
