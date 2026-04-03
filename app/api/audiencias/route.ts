import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — Listar audiências (filtrado por processoId ou data)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const processoId = searchParams.get("processoId");
    const mes = searchParams.get("mes"); // formato: YYYY-MM
    const diaStr = searchParams.get("dia"); // formato: YYYY-MM-DD

    const where: Record<string, unknown> = { tenantId: userId };

    if (processoId) where.processoId = processoId;

    if (diaStr) {
      const inicio = new Date(diaStr + "T00:00:00.000Z");
      const fim = new Date(diaStr + "T23:59:59.999Z");
      where.dataHora = { gte: inicio, lte: fim };
    } else if (mes) {
      const [ano, mesNum] = mes.split("-").map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);
      where.dataHora = { gte: inicio, lte: fim };
    }

    const audiencias = await db.audiencia.findMany({
      where,
      include: {
        processo: { select: { id: true, numero: true, titulo: true } },
      },
      orderBy: { dataHora: "asc" },
    });

    return NextResponse.json(audiencias);
  } catch (error) {
    console.error("[ERRO_GET_AUDIENCIAS]:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

// POST — Criar audiência
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { processoId, titulo, dataHora, local, tipo, observacoes } = body;

    if (!processoId || !titulo || !dataHora) {
      return new NextResponse("processoId, titulo e dataHora são obrigatórios", { status: 400 });
    }

    // Verifica se o processo pertence ao tenant
    const processo = await db.processo.findFirst({
      where: { id: processoId, tenantId: userId },
    });
    if (!processo) return new NextResponse("Processo não encontrado", { status: 404 });

    const audiencia = await db.audiencia.create({
      data: {
        tenantId: userId,
        processoId,
        titulo,
        dataHora: new Date(dataHora),
        local: local || null,
        tipo: tipo || "AUDIENCIA",
        observacoes: observacoes || null,
      },
    });

    return NextResponse.json(audiencia);
  } catch (error) {
    console.error("[ERRO_POST_AUDIENCIAS]:", error);
    return new NextResponse("Erro ao criar audiência", { status: 500 });
  }
}

// PATCH — Atualizar ou marcar como concluída
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { id, titulo, dataHora, local, tipo, observacoes, concluida } = body;

    if (!id) return new NextResponse("ID é obrigatório", { status: 400 });

    const audiencia = await db.audiencia.update({
      where: { id, tenantId: userId },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(dataHora !== undefined && { dataHora: new Date(dataHora) }),
        ...(local !== undefined && { local }),
        ...(tipo !== undefined && { tipo }),
        ...(observacoes !== undefined && { observacoes }),
        ...(concluida !== undefined && { concluida }),
      },
    });

    return NextResponse.json(audiencia);
  } catch (error) {
    console.error("[ERRO_PATCH_AUDIENCIAS]:", error);
    return new NextResponse("Erro ao atualizar audiência", { status: 500 });
  }
}

// DELETE — Excluir audiência
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return new NextResponse("ID necessário", { status: 400 });

    await db.audiencia.delete({ where: { id, tenantId: userId } });

    return new NextResponse("Deletado", { status: 200 });
  } catch (error) {
    return new NextResponse("Erro ao deletar", { status: 500 });
  }
}
