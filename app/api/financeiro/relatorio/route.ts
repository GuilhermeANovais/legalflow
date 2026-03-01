import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GERAR RELATÓRIO MENSAL + SOFT DELETE DAS TRANSAÇÕES DO MÊS
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { mes, ano } = body;

        if (!mes || !ano) {
            return new NextResponse("Campos obrigatórios: mes (1-12) e ano", { status: 400 });
        }

        const mesNum = parseInt(mes);
        const anoNum = parseInt(ano);

        if (mesNum < 1 || mesNum > 12) {
            return new NextResponse("Mês deve ser entre 1 e 12", { status: 400 });
        }

        // Verifica se já existe relatório para este mês
        const relatorioExistente = await db.relatorioMensal.findUnique({
            where: {
                tenantId_mes_ano: { tenantId: userId, mes: mesNum, ano: anoNum },
            },
        });

        if (relatorioExistente) {
            return new NextResponse(
                `Relatório de ${String(mesNum).padStart(2, "0")}/${anoNum} já foi gerado anteriormente`,
                { status: 409 }
            );
        }

        // Intervalo do mês
        const inicioMes = new Date(anoNum, mesNum - 1, 1); // Primeiro dia do mês
        const fimMes = new Date(anoNum, mesNum, 1);         // Primeiro dia do mês seguinte

        // Busca todas as transações do mês (somente não-deletadas)
        const transacoesDoMes = await db.transacao.findMany({
            where: {
                tenantId: userId,
                deletedAt: null,
                createdAt: {
                    gte: inicioMes,
                    lt: fimMes,
                },
            },
        });

        if (transacoesDoMes.length === 0) {
            return new NextResponse(
                `Nenhuma transação encontrada no mês ${String(mesNum).padStart(2, "0")}/${anoNum}`,
                { status: 404 }
            );
        }

        // Calcula os totais
        const totais = transacoesDoMes.reduce(
            (acc: any, t: any) => {
                if (t.tipo === "RECEITA") acc.totalReceitas += t.valor;
                if (t.tipo === "DESPESA") acc.totalDespesas += t.valor;
                if (t.categoria === "HONORARIOS") acc.totalHonorarios += t.valor;
                if (t.categoria === "CUSTAS") acc.totalCustas += t.valor;
                if (t.categoria === "REPASSE_CLIENTE") acc.totalRepasses += t.valor;
                if (t.categoria === "OPERACIONAL_ESCRITORIO") acc.totalOperacional += t.valor;
                return acc;
            },
            {
                totalReceitas: 0,
                totalDespesas: 0,
                totalHonorarios: 0,
                totalCustas: 0,
                totalRepasses: 0,
                totalOperacional: 0,
            }
        );

        const saldoMes = totais.totalReceitas - totais.totalDespesas;
        const idsTransacoes = transacoesDoMes.map((t) => t.id);
        const agora = new Date();

        // Transação atômica: cria relatório + soft delete das transações do mês
        const relatorio = await db.$transaction(async (tx: any) => {
            // 1. Cria o relatório mensal (snapshot)
            const rel = await tx.relatorioMensal.create({
                data: {
                    tenantId: userId,
                    mes: mesNum,
                    ano: anoNum,
                    ...totais,
                    quantidadeTransacoes: transacoesDoMes.length,
                    saldoMes,
                    fechadoEm: agora,
                },
            });

            // 2. Soft delete: marca todas as transações do mês com deletedAt
            await tx.transacao.updateMany({
                where: {
                    id: { in: idsTransacoes },
                    tenantId: userId,
                },
                data: {
                    deletedAt: agora,
                },
            });

            return rel;
        });

        return NextResponse.json({
            message: `Relatório ${String(mesNum).padStart(2, "0")}/${anoNum} gerado com sucesso`,
            relatorio,
            transacoesArquivadas: transacoesDoMes.length,
        });
    } catch (error) {
        console.error("[ERRO_POST_RELATORIO]:", error);
        return new NextResponse("Erro ao gerar relatório mensal", { status: 500 });
    }
}

// LISTAR RELATÓRIOS MENSAIS
export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const relatorios = await db.relatorioMensal.findMany({
            where: { tenantId: userId },
            orderBy: [{ ano: "desc" }, { mes: "desc" }],
        });

        return NextResponse.json(relatorios);
    } catch (error) {
        console.error("[ERRO_GET_RELATORIOS]:", error);
        return new NextResponse("Erro interno", { status: 500 });
    }
}
