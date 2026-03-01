import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// SPLIT AUTOMÁTICO DE ALVARÁ / ÊXITO
// Recebe valorTotal + percentualHonorarios e cria 2 lançamentos atômicos
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { processoId, valorTotal, percentualHonorarios } = body;

        // Validações
        if (!processoId || !valorTotal || !percentualHonorarios) {
            return new NextResponse(
                "Campos obrigatórios: processoId, valorTotal, percentualHonorarios",
                { status: 400 }
            );
        }

        const valor = parseFloat(valorTotal);
        const percentual = parseFloat(percentualHonorarios);

        if (valor <= 0) {
            return new NextResponse("Valor total deve ser maior que zero", { status: 400 });
        }
        if (percentual <= 0 || percentual >= 100) {
            return new NextResponse("Percentual de honorários deve ser entre 0 e 100", { status: 400 });
        }

        // Busca o processo para validar e pegar o clienteId
        const processo = await db.processo.findFirst({
            where: { id: processoId, tenantId: userId },
            select: { id: true, numero: true, titulo: true, clienteId: true },
        });

        if (!processo) {
            return new NextResponse("Processo não encontrado", { status: 404 });
        }

        // Cálculo do split
        const valorHonorarios = Math.round(valor * (percentual / 100) * 100) / 100;
        const valorRepasse = Math.round((valor - valorHonorarios) * 100) / 100;

        const agora = new Date();

        // Transação atômica: cria os 2 lançamentos juntos
        const [transacaoHonorarios, transacaoRepasse] = await db.$transaction([
            db.transacao.create({
                data: {
                    tenantId: userId,
                    tipo: "RECEITA",
                    categoria: "HONORARIOS",
                    valor: valorHonorarios,
                    status: "PENDENTE",
                    descricao: `Honorários (${percentual}%) — Alvará ${processo.numero}`,
                    dataVencimento: agora,
                    processoId: processo.id,
                    clienteId: processo.clienteId,
                },
            }),
            db.transacao.create({
                data: {
                    tenantId: userId,
                    tipo: "DESPESA",
                    categoria: "REPASSE_CLIENTE",
                    valor: valorRepasse,
                    status: "PENDENTE",
                    descricao: `Repasse ao cliente — Alvará ${processo.numero}`,
                    dataVencimento: agora,
                    processoId: processo.id,
                    clienteId: processo.clienteId,
                },
            }),
        ]);

        return NextResponse.json({
            message: "Alvará registrado com sucesso",
            honorarios: transacaoHonorarios,
            repasse: transacaoRepasse,
            resumo: {
                valorTotal: valor,
                percentual,
                valorHonorarios,
                valorRepasse,
            },
        });
    } catch (error) {
        console.error("[ERRO_POST_ALVARA]:", error);
        return new NextResponse("Erro ao registrar alvará", { status: 500 });
    }
}
