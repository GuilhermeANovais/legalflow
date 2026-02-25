import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { consultarCNJ } from "@/lib/cnj";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { processoId } = body;

        if (!processoId) {
            return NextResponse.json(
                { error: "processoId é obrigatório" },
                { status: 400 }
            );
        }

        // Verifica ownership
        const processo = await db.processo.findFirst({
            where: { id: processoId, tenantId: userId },
        });

        if (!processo) {
            return NextResponse.json(
                { error: "Processo não encontrado" },
                { status: 404 }
            );
        }

        // Retorna 202 imediatamente e executa a sincronização em background
        // Captura o userId para usar no closure
        const tenantId = userId;

        // Fire-and-forget: executa em background sem bloquear a resposta
        (async () => {
            try {
                const resultado = await consultarCNJ(processo.numero);

                if (!resultado.found || !resultado.dados) {
                    console.error(
                        `Sincronização falhou para processo ${processoId}: ${resultado.error}`
                    );
                    return;
                }

                const dados = resultado.dados;

                // Atualiza os campos do processo
                await db.processo.update({
                    where: { id: processoId },
                    data: {
                        tribunal: dados.tribunal,
                        orgaoJulgador: dados.orgaoJulgador,
                        classeProcessual: dados.classeProcessual,
                        dataAjuizamento: dados.dataAjuizamento
                            ? new Date(dados.dataAjuizamento)
                            : null,
                        sincronizadoEm: new Date(),
                    },
                });

                // Upsert de movimentações (skipDuplicates garante idempotência)
                if (dados.movimentos.length > 0) {
                    await db.movimentacao.createMany({
                        data: dados.movimentos.map((mov) => ({
                            processoId,
                            codigo: mov.codigo,
                            nome: mov.nome,
                            dataHora: new Date(mov.dataHora),
                        })),
                        skipDuplicates: true,
                    });
                }

                // Invalida o cache da página de processos
                revalidatePath("/dashboard/processos");

                console.log(
                    `Sincronização concluída para processo ${processoId}: ${dados.movimentos.length} movimentações processadas.`
                );
            } catch (error) {
                console.error(`Erro na sincronização background do processo ${processoId}:`, error);
            }
        })();

        return NextResponse.json(
            { message: "Sincronização iniciada com sucesso." },
            { status: 202 }
        );
    } catch (error) {
        console.error("Erro ao iniciar sincronização:", error);
        return new NextResponse("Erro interno", { status: 500 });
    }
}
