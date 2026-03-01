import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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
    const {
      titulo, numero, clienteId, area, valorCausa, prioridade, fase, dataPrazo,
      polo, novoCliente,
      // Campos CNJ (vindos do autopreencher)
      tribunal, orgaoJulgador, classeProcessual, assuntoPrincipal, sistema, dataAjuizamento
    } = body;

    // Validação: precisa de clienteId OU novoCliente
    if (!clienteId && !novoCliente) {
      return new NextResponse("Cliente é obrigatório. Selecione um existente ou cadastre um novo.", { status: 400 });
    }

    if (novoCliente && (!novoCliente.nome || !novoCliente.documento)) {
      return new NextResponse("Nome e CPF/CNPJ são obrigatórios para novo cliente.", { status: 400 });
    }

    const hasCnjData = !!(tribunal || classeProcessual);

    // Função auxiliar para validar datas e evitar o erro "Invalid Date" do Prisma
    const parseDateSafe = (dateString: string | null | undefined) => {
      if (!dateString) return null;
      const dateObj = new Date(dateString);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    };

    // Prepara os dados do processo (sem clienteId por enquanto)
    const processoData = {
      tenantId: userId,
      titulo,
      numero: numero || "S/N",
      area,
      fase: fase || "Inicial",
      prioridade,
      polo: polo || "ATIVO",
      valorCausa: parseFloat(valorCausa || 0),
      status: "ATIVO",
      dataPrazo: parseDateSafe(dataPrazo),
      // Campos CNJ (se vieram do autopreencher)
      ...(hasCnjData && {
        tribunal,
        orgaoJulgador,
        classeProcessual,
        assuntoPrincipal,
        sistema,
        dataAjuizamento: parseDateSafe(dataAjuizamento),
        sincronizadoEm: new Date(),
      }),
    };

    // Criação atômica via transação Prisma
    const processo = await db.$transaction(async (tx) => {
      let finalClienteId = clienteId;

      // Se vier novoCliente, cria primeiro
      if (!clienteId && novoCliente) {
        const clienteCriado = await tx.client.create({
          data: {
            tenantId: userId,
            nome: novoCliente.nome,
            documento: novoCliente.documento,
            tipo: novoCliente.tipo || "PF",
            status: "ATIVO",
          },
        });
        finalClienteId = clienteCriado.id;
      }

      return tx.processo.create({
        data: {
          ...processoData,
          clienteId: finalClienteId,
        },
      });
    });

    return NextResponse.json(processo);
  } catch (error) {
    console.error("[ERRO_POST_PROCESSO]:", error);
    return new NextResponse("Erro ao criar", { status: 500 });
  }
}

// ATUALIZAR (Prioridade, Arquivar ou Desarquivar)
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { id, prioridade, status, resultado } = body;

    if (!id) return new NextResponse("ID é obrigatório", { status: 400 });

    // Monta o objeto de dados condicionalmente
    const data: Record<string, unknown> = {};

    if (prioridade !== undefined) {
      data.prioridade = prioridade;
    }

    if (status === "ARQUIVADO") {
      // Arquivar: exige resultado e registra data
      if (!resultado) {
        return new NextResponse("Resultado é obrigatório para arquivar.", { status: 400 });
      }
      data.status = "ARQUIVADO";
      data.resultado = resultado;
      data.arquivadoEm = new Date();
    } else if (status === "ATIVO") {
      // Desarquivar: limpa resultado e data de arquivamento
      data.status = "ATIVO";
      data.resultado = null;
      data.arquivadoEm = null;
    }

    const processoAtualizado = await db.processo.update({
      where: {
        id,
        tenantId: userId
      },
      data
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
