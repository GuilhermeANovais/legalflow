// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  CalendarDays,
  Clock,
  Briefcase
} from "lucide-react";
import { startOfMonth, subMonths, startOfDay, endOfDay, addDays, format, isBefore, isToday, isTomorrow, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinanceChart, StatusChart } from "./components/charts";

export const metadata = {
  title: "Dashboard - LegalFlow",
  description: "Visão geral e KPIs do seu escritório no LegalFlow.",
};

async function getDashboardData(userId: string) {
  const hoje = new Date();
  const primeiroDiaMesAtual = startOfMonth(hoje);
  const primeiroDiaMesAnterior = startOfMonth(subMonths(hoje, 1));
  const seisMesesAtras = startOfMonth(subMonths(hoje, 5));

  const [
    receitasMesAtualAgg,
    receitasMesAnteriorAgg,
    repassesPendentesAgg,
    processosArquivados,
    prazosProximos7DiasCount,
    transacoesUltimos6Meses,
    processosStatus,
    proximosPrazos,
    ultimasMovimentacoes
  ] = await Promise.all([
    db.transacao.aggregate({
      _sum: { valor: true },
      where: {
        tenantId: userId,
        tipo: 'RECEITA',
        categoria: 'HONORARIOS',
        status: 'PAGO',
        deletedAt: null,
        dataPagamento: { gte: primeiroDiaMesAtual }
      }
    }),
    db.transacao.aggregate({
      _sum: { valor: true },
      where: {
        tenantId: userId,
        tipo: 'RECEITA',
        categoria: 'HONORARIOS',
        status: 'PAGO',
        deletedAt: null,
        dataPagamento: { gte: primeiroDiaMesAnterior, lt: primeiroDiaMesAtual }
      }
    }),
    db.transacao.aggregate({
      _sum: { valor: true },
      where: {
        tenantId: userId,
        categoria: 'REPASSE_CLIENTE',
        status: 'PENDENTE',
        deletedAt: null
      }
    }),
    db.processo.findMany({
      where: { tenantId: userId, status: 'ARQUIVADO' },
      select: { resultado: true }
    }),
    db.prazo.count({
      where: {
        tenantId: userId,
        concluido: false,
        dataVencimento: { gte: startOfDay(hoje), lte: endOfDay(addDays(hoje, 7)) }
      }
    }),
    db.transacao.findMany({
      where: {
        tenantId: userId,
        status: 'PAGO',
        dataPagamento: { gte: seisMesesAtras },
        categoria: { not: 'REPASSE_CLIENTE' },
        deletedAt: null
      },
      select: { valor: true, tipo: true, dataPagamento: true }
    }),
    db.processo.groupBy({
      by: ['fase'],
      where: { tenantId: userId, status: 'ATIVO' },
      _count: { id: true }
    }),
    db.prazo.findMany({
      where: { tenantId: userId, concluido: false },
      orderBy: { dataVencimento: 'asc' },
      take: 5,
      include: { processo: { select: { titulo: true, numero: true } } }
    }),
    db.movimentacao.findMany({
      where: { processo: { tenantId: userId } },
      orderBy: { dataHora: 'desc' },
      take: 5,
      include: { processo: { select: { titulo: true, numero: true } } }
    })
  ]);

  const honorariosMesAtual = receitasMesAtualAgg._sum.valor || 0;
  const honorariosMesAnterior = receitasMesAnteriorAgg._sum.valor || 0;

  const diffHonorarios = honorariosMesAtual - honorariosMesAnterior;
  const percHonorarios = honorariosMesAnterior > 0
    ? (diffHonorarios / honorariosMesAnterior) * 100
    : (honorariosMesAtual > 0 ? 100 : 0);

  const totalRepassesPendentes = repassesPendentesAgg._sum.valor || 0;

  const totalArquivados = processosArquivados.length;
  const processosVitoriosos = processosArquivados.filter((p: any) => {
    const res = p.resultado?.toLowerCase() || '';
    return res.includes('procedente') || res.includes('acordo');
  }).length;

  const taxaExito = totalArquivados > 0 ? Math.round((processosVitoriosos / totalArquivados) * 100) : 0;

  // Montar Gráfico Financeiro
  const monthlyDataMap = new Map<string, { month: string, receitas: number, despesas: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(hoje, i);
    const monthKey = format(d, 'MMM/yy', { locale: ptBR });
    monthlyDataMap.set(monthKey, { month: monthKey, receitas: 0, despesas: 0 });
  }

  transacoesUltimos6Meses.forEach((t: any) => {
    if (!t.dataPagamento) return;
    const monthKey = format(t.dataPagamento, 'MMM/yy', { locale: ptBR });
    if (monthlyDataMap.has(monthKey)) {
      const data = monthlyDataMap.get(monthKey)!;
      if (t.tipo === 'RECEITA') data.receitas += t.valor;
      if (t.tipo === 'DESPESA') data.despesas += t.valor;
    }
  });

  const financeData = Array.from(monthlyDataMap.values());

  // Montar Gráfico de Status
  const statusData = processosStatus.map((p: any) => ({
    name: p.fase || 'Sem Fase',
    value: p._count.id
  })).sort((a: any, b: any) => b.value - a.value);

  return {
    kpis: {
      honorariosMesAtual,
      percHonorarios,
      totalRepassesPendentes,
      taxaExito,
      prazosProximos7DiasCount
    },
    charts: {
      financeData,
      statusData
    },
    lists: {
      proximosPrazos,
      ultimasMovimentacoes
    }
  };
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { kpis, charts, lists } = await getDashboardData(userId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
        <p className="text-zinc-500 mt-2">Visão operacional e estratégica do seu escritório de advocacia.</p>
      </div>

      {/* 1. TOPO: KPIs Críticos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Honorários do Mês */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Honorários do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.honorariosMesAtual)}
            </div>
            <p className={`text-xs mt-1 flex items-center font-medium ${kpis.percHonorarios >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {kpis.percHonorarios > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {kpis.percHonorarios > 0 ? '+' : ''}{kpis.percHonorarios.toFixed(1)}% <span className="text-zinc-500 font-normal ml-1">vs mês anterior</span>
            </p>
          </CardContent>
        </Card>

        {/* Repasses Pendentes (URGENTE) */}
        <Card className="shadow-sm border-red-200 bg-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-red-700">Repasses Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalRepassesPendentes)}
            </div>
            <p className="text-xs text-red-600/80 mt-1 font-medium">Atenção: Valores retidos de clientes</p>
          </CardContent>
        </Card>

        {/* Taxa de Êxito */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Taxa de Êxito</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{kpis.taxaExito}%</div>
            <p className="text-xs text-zinc-500 mt-1">Procedentes/Acordos nos encerrados</p>
          </CardContent>
        </Card>

        {/* Prazos Próximos 7 Dias */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Prazos (Próx. 7 dias)</CardTitle>
            <CalendarDays className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{kpis.prazosProximos7DiasCount}</div>
            <p className="text-xs text-zinc-500 mt-1">Acordos ou contestações a vencer</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. MEIO: Gráficos de Crescimento */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-800">Crescimento Financeiro (6 Meses)</CardTitle>
            <CardDescription>Receitas de honorários vs Despesas totais</CardDescription>
          </CardHeader>
          <CardContent>
            <FinanceChart data={charts.financeData} />
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-800">Carteira por Fase</CardTitle>
            <CardDescription>Distribuição de processos em andamento</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusChart data={charts.statusData} />
          </CardContent>
        </Card>
      </div>

      {/* 3. BASE: Ação Imediata */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {/* Radar de Prazos */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="pb-3 border-b border-zinc-100 mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-zinc-700" />
              <CardTitle className="text-lg text-zinc-800">Radar de Prazos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {lists.proximosPrazos.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-500 text-sm">
                Nenhum prazo pendente no momento.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px] text-zinc-500">Vencimento</TableHead>
                    <TableHead className="text-zinc-500">Tarefa / Processo</TableHead>
                    <TableHead className="text-right text-zinc-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.proximosPrazos.map((prazo: any) => {
                    const hoje = new Date();
                    const endOfThisWeek = endOfWeek(hoje, { weekStartsOn: 0 }); // Domingo
                    const vHojeAmanha = isToday(prazo.dataVencimento) || isTomorrow(prazo.dataVencimento);
                    const vEstaSemana = !vHojeAmanha && isBefore(prazo.dataVencimento, endOfThisWeek);

                    return (
                      <TableRow key={prazo.id}>
                        <TableCell className="font-medium text-zinc-900 whitespace-nowrap">
                          {format(prazo.dataVencimento, 'dd/MM/yy')}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-zinc-900 line-clamp-1">{prazo.titulo}</p>
                          <p className="text-xs text-zinc-500 line-clamp-1">{prazo.processo?.titulo || prazo.processo?.numero}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          {vHojeAmanha ? (
                            <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 border-transparent text-white">Urgente</Badge>
                          ) : vEstaSemana ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Esta Semana</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-transparent">No Prazo</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Últimas Movimentações */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="pb-3 border-b border-zinc-100 mb-2">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-zinc-700" />
              <CardTitle className="text-lg text-zinc-800">Últimas Movimentações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {lists.ultimasMovimentacoes.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-500 text-sm">
                Nenhuma movimentação registrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px] text-zinc-500">Data</TableHead>
                    <TableHead className="text-zinc-500">Movimentação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.ultimasMovimentacoes.map((mov: any) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-zinc-500 text-sm whitespace-nowrap">
                        {format(mov.dataHora, 'dd/MM')}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-zinc-900 line-clamp-2">{mov.nome}</p>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">Processo: {mov.processo?.numero || mov.processo?.titulo}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

