-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "isFixa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parcelaAtual" INTEGER,
ADD COLUMN     "totalParcelas" INTEGER;
