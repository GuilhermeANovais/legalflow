import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// LISTAR TRANSAÇÕES
export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const categoria = searchParams.get("categoria");

        const where: Record<string, unknown> = { tenantId: userId, deletedAt: null };
        if (status) where.status = status;
        if (categoria) where.categoria = categoria;

        const transacoes = await db.transacao.findMany({
            where,
            include: {
                processo: { select: { id: true, numero: true, titulo: true } },
                cliente: { select: { id: true, nome: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Resumo financeiro para os cards do dashboard
        const resumo = await db.transacao.groupBy({
            by: ["tipo", "categoria", "status"],
            where: { tenantId: userId, deletedAt: null },
            _sum: { valor: true },
        });

        return NextResponse.json({ transacoes, resumo });
    } catch (error) {
        console.error("[ERRO_GET_FINANCEIRO]:", error);
        return new NextResponse("Erro interno", { status: 500 });
    }
}

// CRIAR TRANSAÇÃO MANUAL
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { tipo, categoria, valor, descricao, dataVencimento, processoId, clienteId } = body;

        if (!tipo || !categoria || !valor || !descricao) {
            return new NextResponse("Campos obrigatórios: tipo, categoria, valor, descricao", { status: 400 });
        }

        const transacao = await db.transacao.create({
            data: {
                tenantId: userId,
                tipo,
                categoria,
                valor: parseFloat(valor),
                descricao,
                dataVencimento: dataVencimento ? new Date(dataVencimento) : new Date(),
                processoId: processoId || null,
                clienteId: clienteId || null,
            },
        });

        return NextResponse.json(transacao);
    } catch (error) {
        console.error("[ERRO_POST_FINANCEIRO]:", error);
        return new NextResponse("Erro ao criar transação", { status: 500 });
    }
}

// MARCAR COMO PAGO
export async function PATCH(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { id } = body;

        if (!id) return new NextResponse("ID é obrigatório", { status: 400 });

        const transacao = await db.transacao.update({
            where: { id, tenantId: userId },
            data: {
                status: "PAGO",
                dataPagamento: new Date(),
            },
        });

        return NextResponse.json(transacao);
    } catch (error) {
        console.error("[ERRO_PATCH_FINANCEIRO]:", error);
        return new NextResponse("Erro ao atualizar transação", { status: 500 });
    }
}
