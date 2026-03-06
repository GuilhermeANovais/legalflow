import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        const tenantId = orgId || userId;

        if (!tenantId) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { concluido, titulo, descricao, dataVencimento } = body;

        let dataConclusao = undefined;
        if (concluido === true) {
            dataConclusao = new Date();
        } else if (concluido === false) {
            dataConclusao = null;
        }

        const updatedPrazo = await prisma.prazo.update({
            where: { id, tenantId }, // ensure it belongs to the tenant
            data: {
                ...(concluido !== undefined && { concluido }),
                ...(dataConclusao !== undefined && { dataConclusao }),
                ...(titulo !== undefined && { titulo }),
                ...(descricao !== undefined && { descricao }),
                ...(dataVencimento !== undefined && { dataVencimento: new Date(dataVencimento) }),
            },
        });

        return NextResponse.json(updatedPrazo);
    } catch (error) {
        console.error("[PRAZOS_PATCH]", error);
        return NextResponse.json(
            { error: "Erro interno do servidor ao atualizar prazo." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        const tenantId = orgId || userId;

        if (!tenantId) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        await prisma.prazo.delete({
            where: { id, tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[PRAZOS_DELETE]", error);
        return NextResponse.json(
            { error: "Erro interno do servidor ao excluir prazo." },
            { status: 500 }
        );
    }
}
