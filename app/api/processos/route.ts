import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// LISTAR PROCESSOS
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const processos = await db.processo.findMany({
      where: { tenantId: userId },
      include: {
        cliente: true,
        movimentacoes: {
          orderBy: { dataHora: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(processos);
  } catch (error) {
    return new NextResponse("Erro interno", { status: 500 });
  }
}

// CRIAR PROCESSO
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { titulo, numero, clienteId, area, valorCausa, prioridade, fase, dataPrazo } = body;

    const processo = await db.processo.create({
      data: {
        tenantId: userId,
        titulo,
        numero: numero || "S/N",
        clienteId,
        area,
        fase: fase || "Inicial",
        prioridade,
        valorCausa: parseFloat(valorCausa || 0),
        status: "ATIVO",
        dataPrazo: dataPrazo ? new Date(dataPrazo) : null,
      }
    });

    return NextResponse.json(processo);
  } catch (error) {
    return new NextResponse("Erro ao criar", { status: 500 });
  }
}

// ATUALIZAR (Mudar Urgência)
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { id, prioridade, status, resultado } = body; // Recebe ID e a nova Prioridade

    const processoAtualizado = await db.processo.update({
      where: {
        id,
        tenantId: userId // Segurança extra: garante que o processo é do usuário
      },
      data: { prioridade, status, resultado } // Atualiza os campos enviados
    });

    return NextResponse.json(processoAtualizado);
  } catch (error) {
    return new NextResponse("Erro ao atualizar", { status: 500 });
  }
}

// EXCLUIR PROCESSO
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return new NextResponse("ID necessário", { status: 400 });

    await db.processo.delete({
      where: {
        id,
        tenantId: userId
      }
    });

    return new NextResponse("Deletado com sucesso", { status: 200 });
  } catch (error) {
    return new NextResponse("Erro ao deletar", { status: 500 });
  }
}
