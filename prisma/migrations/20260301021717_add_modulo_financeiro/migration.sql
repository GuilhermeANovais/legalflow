-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "CategoriaTransacao" AS ENUM ('HONORARIOS', 'CUSTAS', 'REPASSE_CLIENTE', 'OPERACIONAL_ESCRITORIO');

-- CreateEnum
CREATE TYPE "StatusTransacao" AS ENUM ('PENDENTE', 'PAGO');

-- AlterTable
ALTER TABLE "Processo" ADD COLUMN     "honorariosPercentual" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "categoria" "CategoriaTransacao" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" "StatusTransacao" NOT NULL DEFAULT 'PENDENTE',
    "descricao" TEXT NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "processoId" TEXT,
    "clienteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transacoes_tenantId_idx" ON "transacoes"("tenantId");

-- CreateIndex
CREATE INDEX "transacoes_processoId_idx" ON "transacoes"("processoId");

-- CreateIndex
CREATE INDEX "transacoes_clienteId_idx" ON "transacoes"("clienteId");

-- CreateIndex
CREATE INDEX "transacoes_status_idx" ON "transacoes"("status");

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
