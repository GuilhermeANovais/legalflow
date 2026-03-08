-- AlterTable
ALTER TABLE "Movimentacao" ADD COLUMN     "conteudoBruto" TEXT;

-- CreateTable
CREATE TABLE "processo_historicos" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valoresAnteriores" TEXT,
    "valoresNovos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processo_historicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_intimacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL,
    "conteudoBruto" TEXT NOT NULL,
    "resumoIA" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_intimacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT,
    "processoId" TEXT,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prazos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "dataConclusao" TIMESTAMP(3),
    "processoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prazos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processo_historicos_processoId_idx" ON "processo_historicos"("processoId");

-- CreateIndex
CREATE INDEX "processo_historicos_tenantId_idx" ON "processo_historicos"("tenantId");

-- CreateIndex
CREATE INDEX "alertas_intimacao_tenantId_idx" ON "alertas_intimacao"("tenantId");

-- CreateIndex
CREATE INDEX "alertas_intimacao_processoId_idx" ON "alertas_intimacao"("processoId");

-- CreateIndex
CREATE INDEX "documentos_tenantId_idx" ON "documentos"("tenantId");

-- CreateIndex
CREATE INDEX "documentos_clienteId_idx" ON "documentos"("clienteId");

-- CreateIndex
CREATE INDEX "documentos_processoId_idx" ON "documentos"("processoId");

-- CreateIndex
CREATE INDEX "prazos_tenantId_idx" ON "prazos"("tenantId");

-- CreateIndex
CREATE INDEX "prazos_processoId_idx" ON "prazos"("processoId");

-- CreateIndex
CREATE INDEX "prazos_usuarioId_idx" ON "prazos"("usuarioId");

-- AddForeignKey
ALTER TABLE "processo_historicos" ADD CONSTRAINT "processo_historicos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_intimacao" ADD CONSTRAINT "alertas_intimacao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prazos" ADD CONSTRAINT "prazos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
