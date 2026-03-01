-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "relatorios_mensais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "totalReceitas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDespesas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHonorarios" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCustas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRepasses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOperacional" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidadeTransacoes" INTEGER NOT NULL DEFAULT 0,
    "saldoMes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorios_mensais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relatorios_mensais_tenantId_idx" ON "relatorios_mensais"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "relatorios_mensais_tenantId_mes_ano_key" ON "relatorios_mensais"("tenantId", "mes", "ano");

-- CreateIndex
CREATE INDEX "transacoes_deletedAt_idx" ON "transacoes"("deletedAt");
