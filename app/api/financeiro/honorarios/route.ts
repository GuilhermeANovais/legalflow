import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { addMonths } from "date-fns";

// REGISTRAR HONORÁRIOS CONTRATUAIS PARCELADOS
// Cria entrada (opcional) + N parcelas mensais — tudo dentro de $transaction
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const {
            valorTotal,
            valorEntrada,
            numeroParcelas,
            dataVencimento1aParcela,
            processoId,
            clienteId,
            descricao,
        } = body;

        // ── Validações ─────────────────────────────────
        if (!valorTotal || !numeroParcelas || !dataVencimento1aParcela || !descricao) {
            return new NextResponse(
                "Campos obrigatórios: valorTotal, numeroParcelas, dataVencimento1aParcela, descricao",
                { status: 400 }
            );
        }

        const total = parseFloat(valorTotal);
        const entrada = valorEntrada ? parseFloat(valorEntrada) : 0;
        const parcelas = parseInt(numeroParcelas, 10);

        if (total <= 0) {
            return new NextResponse("Valor total deve ser maior que zero", { status: 400 });
        }
        if (parcelas <= 0) {
            return new NextResponse("Número de parcelas deve ser maior que zero", { status: 400 });
        }
        if (entrada < 0 || entrada >= total) {
            return new NextResponse("Valor da entrada deve ser menor que o valor total", { status: 400 });
        }

        // ── Cálculos ────────────────────────────────────
        const valorRestante = total - entrada;
        const valorParcela = Math.round((valorRestante / parcelas) * 100) / 100;

        // Ajuste de centavos na última parcela
        const valorUltimaParcela =
            Math.round((valorRestante - valorParcela * (parcelas - 1)) * 100) / 100;

        const temEntrada = entrada > 0;
        const totalTransacoes = temEntrada ? parcelas + 1 : parcelas;
        const dataBase = new Date(dataVencimento1aParcela);

        // ── Montar operações do $transaction ────────────
        const operacoes = [];

        // 1) Entrada (se houver)
        if (temEntrada) {
            operacoes.push(
                db.transacao.create({
                    data: {
                        tenantId: userId,
                        tipo: "RECEITA",
                        categoria: "HONORARIOS",
                        valor: entrada,
                        status: "PENDENTE",
                        descricao: `${descricao} — Entrada`,
                        dataVencimento: new Date(), // vencimento imediato
                        parcelaAtual: 1,
                        totalParcelas: totalTransacoes,
                        processoId: processoId || null,
                        clienteId: clienteId || null,
                    },
                })
            );
        }

        // 2) Parcelas mensais
        for (let i = 0; i < parcelas; i++) {
            const numeroDaParcela = temEntrada ? i + 2 : i + 1;
            const vencimento = addMonths(dataBase, i);
            const valor = i === parcelas - 1 ? valorUltimaParcela : valorParcela;

            operacoes.push(
                db.transacao.create({
                    data: {
                        tenantId: userId,
                        tipo: "RECEITA",
                        categoria: "HONORARIOS",
                        valor,
                        status: "PENDENTE",
                        descricao: `${descricao} — Parcela ${numeroDaParcela}/${totalTransacoes}`,
                        dataVencimento: vencimento,
                        parcelaAtual: numeroDaParcela,
                        totalParcelas: totalTransacoes,
                        processoId: processoId || null,
                        clienteId: clienteId || null,
                    },
                })
            );
        }

        // ── Execução atômica ────────────────────────────
        const transacoesCriadas = await db.$transaction(operacoes);

        return NextResponse.json({
            message: "Honorários parcelados registrados com sucesso",
            quantidade: transacoesCriadas.length,
            resumo: {
                valorTotal: total,
                valorEntrada: entrada,
                valorParcela,
                numeroParcelas: parcelas,
                totalTransacoes,
            },
        });
    } catch (error) {
        console.error("[ERRO_POST_HONORARIOS]:", error);
        return new NextResponse("Erro ao registrar honorários parcelados", { status: 500 });
    }
}
