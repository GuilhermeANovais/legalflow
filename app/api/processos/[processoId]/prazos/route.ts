import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";

// GET /api/processos/[processoId]/prazos - Retorna os prazos do processo
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ processoId: string }> } // Atualizado para Promise para contornar problemas de tipagem Next.js 15
) {
    try {
        const { userId, orgId } = await auth();
        const tenantId = orgId || userId;

        if (!tenantId) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { processoId } = await context.params;

        const prazos = await prisma.prazo.findMany({
            where: {
                processoId: processoId,
                tenantId: tenantId,
            },
            orderBy: {
                dataVencimento: "asc",
            },
        });

        return NextResponse.json(prazos);
    } catch (error) {
        console.error("[PRAZOS_GET]", error);
        return NextResponse.json(
            { error: "Erro interno do servidor ao carregar prazos." },
            { status: 500 }
        );
    }
}

// POST /api/processos/[processoId]/prazos - Cria um novo prazo para o processo
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ processoId: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        const tenantId = orgId || userId;

        if (!tenantId) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { processoId } = await context.params;
        const body = await request.json();
        const { titulo, descricao, dataVencimento, concluido, dataConclusao, usuarioId } = body;

        if (!titulo || !dataVencimento) {
            return NextResponse.json(
                { error: "Título e Data de Vencimento são obrigatórios." },
                { status: 400 }
            );
        }

        const novoPrazo = await prisma.prazo.create({
            data: {
                tenantId,
                processoId: processoId,
                titulo,
                descricao,
                dataVencimento: new Date(dataVencimento),
                concluido: concluido || false,
                dataConclusao: dataConclusao ? new Date(dataConclusao) : null,
                usuarioId: usuarioId || userId, // Define o responsavel
            },
        });

        return NextResponse.json(novoPrazo, { status: 201 });
    } catch (error) {
        console.error("[PRAZOS_POST]", error);
        return NextResponse.json(
            { error: "Erro interno do servidor ao criar prazo." },
            { status: 500 }
        );
    }
}
