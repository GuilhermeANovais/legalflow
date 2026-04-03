-- Migration: legalflow_8_melhorias
-- Passo 1: Limpar processos duplicados (manter o mais antigo por tenant+numero)
DELETE FROM "Processo"
WHERE id NOT IN (
  SELECT DISTINCT ON (tenantId, numero) id
  FROM "Processo"
  ORDER BY tenantId, numero, "createdAt" ASC
);

-- Passo 2: Limpar clientes duplicados (manter o mais antigo por tenant+documento)
DELETE FROM "Client"
WHERE id NOT IN (
  SELECT DISTINCT ON (tenantId, documento) id
  FROM "Client"
  ORDER BY tenantId, documento, "createdAt" ASC
);

-- Passo 3: Adicionar campos novos ao Processo
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "parteAutora" TEXT;
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "rito" TEXT NOT NULL DEFAULT 'COMUM';

-- Passo 4: Criar tabela Audiencia
CREATE TABLE IF NOT EXISTS "audiencias" (
  "id"          TEXT NOT NULL,
  "tenantId"    TEXT NOT NULL,
  "processoId"  TEXT NOT NULL,
  "titulo"      TEXT NOT NULL,
  "dataHora"    TIMESTAMP(3) NOT NULL,
  "local"       TEXT,
  "tipo"        TEXT NOT NULL DEFAULT 'AUDIENCIA',
  "observacoes" TEXT,
  "concluida"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "audiencias_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audiencias_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "audiencias_tenantId_idx" ON "audiencias"("tenantId");
CREATE INDEX IF NOT EXISTS "audiencias_processoId_idx" ON "audiencias"("processoId");
CREATE INDEX IF NOT EXISTS "audiencias_dataHora_idx" ON "audiencias"("dataHora");

-- Passo 5: Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "Processo_tenantId_numero_key" ON "Processo"("tenantId", "numero");
CREATE UNIQUE INDEX IF NOT EXISTS "Client_tenantId_documento_key" ON "Client"("tenantId", "documento");
