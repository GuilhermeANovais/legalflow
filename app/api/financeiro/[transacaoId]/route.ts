import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// ATUALIZAR TRANSAÇÃO (PATCH genérico)
export async function PATCH(
    req: Request,
    context: { params: Promise<{ transacaoId: string }> }
) {
    try {
        const params = await context.params;
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        if (!params.transacaoId) {
            return new NextResponse("ID da transação é obrigatório", { status: 400 });
        }

        const body = await req.json();
        const {
            tipo, categoria, valor, descricao, dataVencimento,
            status, dataPagamento, processoId, clienteId, isFixa,
        } = body;

        const data: Record<string, unknown> = {};
        if (tipo !== undefined) data.tipo = tipo;
        if (categoria !== undefined) data.categoria = categoria;
        if (valor !== undefined) data.valor = parseFloat(valor);
        if (descricao !== undefined) data.descricao = descricao;
        if (dataVencimento !== undefined) data.dataVencimento = new Date(dataVencimento);
        if (status !== undefined) data.status = status;
        if (dataPagamento !== undefined) data.dataPagamento = dataPagamento ? new Date(dataPagamento) : null;
        if (processoId !== undefined) data.processoId = processoId || null;
        if (clienteId !== undefined) data.clienteId = clienteId || null;
        if (isFixa !== undefined) data.isFixa = isFixa;

        const transacao = await db.transacao.update({
            where: {
                id: params.transacaoId,
                tenantId: userId,
            },
            data,
        });

        return NextResponse.json(transacao);
    } catch (error) {
        console.log("[TRANSACAO_PATCH]", error);
        return new NextResponse("Erro ao atualizar transação", { status: 500 });
    }
}

// EXCLUIR TRANSAÇÃO (Hard delete)
export async function DELETE(
    req: Request,
    context: { params: Promise<{ transacaoId: string }> }
) {
    try {
        const params = await context.params;
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        if (!params.transacaoId) {
            return new NextResponse("ID da transação é obrigatório", { status: 400 });
        }

        await db.transacao.delete({
            where: {
                id: params.transacaoId,
                tenantId: userId,
            },
        });

        return NextResponse.json({ success: true, message: "Transação excluída com sucesso" });
    } catch (error) {
        console.log("[TRANSACAO_DELETE]", error);
        return new NextResponse("Erro ao excluir transação", { status: 500 });
    }
}
