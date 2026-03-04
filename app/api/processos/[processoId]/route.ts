import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// ATUALIZAR PROCESSO (PATCH genérico)
export async function PATCH(
    req: Request,
    context: { params: Promise<{ processoId: string }> }
) {
    try {
        const params = await context.params;
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        if (!params.processoId) {
            return new NextResponse("ID do processo é obrigatório", { status: 400 });
        }

        const body = await req.json();
        const {
            titulo, numero, area, fase, prioridade, valorCausa,
            dataPrazo, polo, parteContraria, clienteId,
            honorariosPercentual,
        } = body;

        // Função auxiliar para validar datas
        const parseDateSafe = (dateString: string | null | undefined) => {
            if (!dateString) return undefined; // undefined = não alterar
            const dateObj = new Date(dateString);
            return isNaN(dateObj.getTime()) ? undefined : dateObj;
        };

        // Monta objeto data condicionalmente (undefined = campo não alterado)
        const data: Record<string, unknown> = {};
        if (titulo !== undefined) data.titulo = titulo;
        if (numero !== undefined) data.numero = numero;
        if (area !== undefined) data.area = area;
        if (fase !== undefined) data.fase = fase;
        if (prioridade !== undefined) data.prioridade = prioridade;
        if (valorCausa !== undefined) data.valorCausa = parseFloat(valorCausa);
        if (dataPrazo !== undefined) data.dataPrazo = dataPrazo ? parseDateSafe(dataPrazo) : null;
        if (polo !== undefined) data.polo = polo;
        if (parteContraria !== undefined) data.parteContraria = parteContraria;
        if (clienteId !== undefined) data.clienteId = clienteId;
        if (honorariosPercentual !== undefined) {
            data.honorariosPercentual = honorariosPercentual ? parseFloat(honorariosPercentual) : null;
        }

        const processoAnterior = await db.processo.findUnique({
            where: { id: params.processoId, tenantId: userId }
        });

        if (!processoAnterior) {
            return new NextResponse("Processo não encontrado", { status: 404 });
        }

        const keysChanged = Object.keys(data).filter(
            (key) => (processoAnterior as any)[key] !== data[key]
        );

        const atualizado = await db.$transaction(async (tx) => {
            const proc = await tx.processo.update({
                where: {
                    id: params.processoId,
                    tenantId: userId,
                },
                data,
            });

            if (keysChanged.length > 0) {
                await tx.processoHistorico.create({
                    data: {
                        processoId: proc.id,
                        tenantId: userId,
                        acao: "EDITADO",
                        descricao: "Processo editado manualmente no formulário.",
                        valoresAnteriores: JSON.stringify(
                            Object.fromEntries(keysChanged.map(k => [k, (processoAnterior as any)[k]]))
                        ),
                        valoresNovos: JSON.stringify(
                            Object.fromEntries(keysChanged.map(k => [k, data[k]]))
                        ),
                    }
                });
            }

            return proc;
        });

        return NextResponse.json(atualizado);
    } catch (error) {
        console.log("[PROCESSO_PATCH]", error);
        return new NextResponse("Erro ao atualizar processo", { status: 500 });
    }
}

// EXCLUIR PROCESSO (DELETE com cascata em transações)
export async function DELETE(
    req: Request,
    context: { params: Promise<{ processoId: string }> }
) {
    try {
        const params = await context.params;
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        if (!params.processoId) {
            return new NextResponse("ID do processo é obrigatório", { status: 400 });
        }

        // Transação atômica: apagar transações associadas + processo
        // (Movimentações já têm onDelete: Cascade no schema)
        await db.$transaction(async (tx) => {
            // 1. Apagar transações vinculadas ao processo
            await tx.transacao.deleteMany({
                where: { processoId: params.processoId },
            });

            // 2. Apagar o processo (movimentações caem em cascata)
            await tx.processo.delete({
                where: {
                    id: params.processoId,
                    tenantId: userId,
                },
            });
        });

        return NextResponse.json({ success: true, message: "Processo excluído com sucesso" });
    } catch (error) {
        console.log("[PROCESSO_DELETE]", error);
        return new NextResponse("Erro ao excluir processo", { status: 500 });
    }
}
