import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ clienteId: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { nome, documento, tipo, email, telefone, endereco, status } = body;

    if (!params.clienteId) {
      return new NextResponse("ID do cliente é obrigatório", { status: 400 });
    }

    const cliente = await db.client.update({
      where: {
        id: params.clienteId,
        tenantId: userId,
      },
      data: {
        nome,
        documento,
        tipo,
        email,
        telefone,
        endereco,
        status,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.log("[CLIENTE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ clienteId: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    if (!params.clienteId) {
      return new NextResponse("ID do cliente é obrigatório", { status: 400 });
    }

    // Validação: bloquear exclusão se houver processos associados
    const processosCount = await db.processo.count({
      where: { clienteId: params.clienteId },
    });

    if (processosCount > 0) {
      return NextResponse.json(
        { error: `Não é possível apagar um cliente com ${processosCount} processo(s) associado(s). Remova os processos primeiro.` },
        { status: 400 }
      );
    }

    // Apagar transações órfãs vinculadas ao cliente (sem processo)
    await db.transacao.deleteMany({
      where: { clienteId: params.clienteId, tenantId: userId },
    });

    const cliente = await db.client.delete({
      where: {
        id: params.clienteId,
        tenantId: userId,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.log("[CLIENTE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
