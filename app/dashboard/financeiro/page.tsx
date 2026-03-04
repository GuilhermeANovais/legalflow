"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Plus,
    X,
    Check,
    FileText,
    ArrowRightLeft,
    Receipt,
    Briefcase,
    Filter,
    Calendar,
    Archive,
    Lock,
    Repeat,
    CreditCard,
    Banknote,
    ChevronDown,
    ChevronRight,
    Pencil,
    Trash2,
    Loader2
} from "lucide-react";
import { ToastProvider, useToast } from "../components/toast";

// === TIPOS ===

interface Processo {
    id: string;
    numero: string;
    titulo: string;
    status?: string;
    honorariosPercentual?: number | null;
    clienteId: string;
    cliente?: { id: string; nome: string };
}

interface Cliente {
    id: string;
    nome: string;
}

interface Transacao {
    id: string;
    tipo: "RECEITA" | "DESPESA";
    categoria: "HONORARIOS" | "CUSTAS" | "REPASSE_CLIENTE" | "OPERACIONAL_ESCRITORIO";
    valor: number;
    status: "PENDENTE" | "PAGO";
    descricao: string;
    dataVencimento: string;
    dataPagamento?: string | null;
    parcelaAtual?: number | null;
    totalParcelas?: number | null;
    isFixa?: boolean;
    processoId?: string | null;
    clienteId?: string | null;
    processo?: { id: string; numero: string; titulo: string } | null;
    cliente?: { id: string; nome: string } | null;
    createdAt: string;
}

interface ResumoItem {
    tipo: string;
    categoria: string;
    status: string;
    _sum: { valor: number | null };
}

interface RelatorioMensal {
    id: string;
    mes: number;
    ano: number;
    totalReceitas: number;
    totalDespesas: number;
    totalHonorarios: number;
    totalCustas: number;
    totalRepasses: number;
    totalOperacional: number;
    quantidadeTransacoes: number;
    saldoMes: number;
    fechadoEm: string;
}

// === HELPERS ===

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("pt-BR");
}

const categoriaBadge: Record<string, { label: string; color: string; icon: typeof DollarSign }> = {
    HONORARIOS: { label: "Honorários", color: "bg-emerald-100 text-emerald-700", icon: DollarSign },
    CUSTAS: { label: "Custas", color: "bg-amber-100 text-amber-700", icon: Receipt },
    REPASSE_CLIENTE: { label: "Repasse Cliente", color: "bg-red-100 text-red-700", icon: ArrowRightLeft },
    OPERACIONAL_ESCRITORIO: { label: "Operacional", color: "bg-blue-100 text-blue-700", icon: Briefcase },
};

const statusBadge: Record<string, { label: string; color: string }> = {
    PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    PAGO: { label: "Pago", color: "bg-green-100 text-green-700 border-green-200" },
};

// === COMPONENTE PRINCIPAL ===

function FinanceiroContent() {
    const { showToast } = useToast();
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [processos, setProcessos] = useState<Processo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [resumo, setResumo] = useState<ResumoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRelatorioModal, setShowRelatorioModal] = useState(false);
    const [relatorios, setRelatorios] = useState<RelatorioMensal[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
    const [filtroCategoria, setFiltroCategoria] = useState<string>("TODOS");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Estados para edição/exclusão
    const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
    const [deletingTransacao, setDeletingTransacao] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Buscar dados
    const fetchData = async () => {
        try {
            const [finRes, procRes, relRes, cliRes] = await Promise.all([
                fetch("/api/financeiro"),
                fetch("/api/processos"),
                fetch("/api/financeiro/relatorio"),
                fetch("/api/clientes"),
            ]);
            const finData = await finRes.json();
            const procData = await procRes.json();
            const relData = await relRes.json();
            const cliData = await cliRes.json();
            setTransacoes(finData.transacoes || []);
            setResumo(finData.resumo || []);
            setProcessos(procData || []);
            setRelatorios(relData || []);
            setClientes(Array.isArray(cliData) ? cliData : cliData.clientes || []);
        } catch (error) {
            console.error("Erro ao carregar dados financeiros:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Cálculos para os cards
    const cards = useMemo(() => {
        const calcular = (tipo?: string, categoria?: string, status?: string) => {
            return resumo
                .filter((r) => {
                    if (tipo && r.tipo !== tipo) return false;
                    if (categoria && r.categoria !== categoria) return false;
                    if (status && r.status !== status) return false;
                    return true;
                })
                .reduce((sum, r) => sum + (r._sum.valor || 0), 0);
        };

        return {
            saldoHonorarios: calcular("RECEITA", "HONORARIOS", "PAGO"),
            aReceber: calcular("RECEITA", undefined, "PENDENTE"),
            aPagar: calcular("DESPESA", undefined, "PENDENTE"),
            repassesPendentes: calcular(undefined, "REPASSE_CLIENTE", "PENDENTE"),
        };
    }, [resumo]);

    // Transações filtradas
    const transacoesFiltradas = useMemo(() => {
        return transacoes.filter((t) => {
            if (filtroStatus !== "TODOS" && t.status !== filtroStatus) return false;
            if (filtroCategoria !== "TODOS" && t.categoria !== filtroCategoria) return false;
            return true;
        });
    }, [transacoes, filtroStatus, filtroCategoria]);


    // Transações Agrupadas
    const transacoesAgrupadas = useMemo(() => {
        type GroupType = {
            isGroup: true;
            id: string; // group key
            baseDescricao: string;
            items: Transacao[];
            valorTotal: number;
            todasPagas: boolean;
            parcelasPagas: number;
            totalParcelas: number;
        };
        type ItemType = { isGroup: false; item: Transacao };

        const result: (GroupType | ItemType)[] = [];
        const groupsMap = new Map<string, Transacao[]>();

        // Agrupar itens que fazem parte de um parcelamento
        transacoesFiltradas.forEach((t) => {
            if (t.totalParcelas && t.totalParcelas > 1) {
                // Tenta extrair a base da descrição removendo o sufixo " — Parcela X/Y" ou " — Entrada"
                let baseDescricao = t.descricao;
                const matchParcela = baseDescricao.match(/ — Parcela \d+\/\d+$/);
                if (matchParcela) baseDescricao = baseDescricao.slice(0, matchParcela.index);
                const matchEntrada = baseDescricao.match(/ — Entrada$/);
                if (matchEntrada) baseDescricao = baseDescricao.slice(0, matchEntrada.index);

                // Chave única para o grupo
                const key = `${baseDescricao}|${t.processo?.id || "sem-processo"}|${t.cliente?.id || "sem-cliente"}`;
                if (!groupsMap.has(key)) groupsMap.set(key, []);
                groupsMap.get(key)!.push(t);
            } else {
                result.push({ isGroup: false, item: t });
            }
        });

        // Montar os grupos
        for (const [key, items] of groupsMap.entries()) {
            // Se por algum motivo só tiver 1 item no parcelamento, exibe solto
            if (items.length === 1) {
                result.push({ isGroup: false, item: items[0] });
                continue;
            }

            // Ordenar itens do grupo: dataVencimento crescente, com nulls no fim (se houver)
            items.sort((a, b) => {
                if (!a.dataVencimento) return 1;
                if (!b.dataVencimento) return -1;
                return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
            });

            const parcelasPagas = items.filter((i) => i.status === "PAGO").length;
            const totalParcelas = items.length;
            const todasPagas = parcelasPagas === totalParcelas;
            const valorTotal = items.reduce((sum, i) => sum + i.valor, 0);

            // Usar o primeiro item para pegar dados base (ex: categoria, tipo)
            const baseDescricao = key.split("|")[0];

            result.push({
                isGroup: true,
                id: key,
                baseDescricao,
                items,
                valorTotal,
                todasPagas,
                parcelasPagas,
                totalParcelas,
            });
        }

        // Ordenar o resultado final baseado na dataVencimento do item "mais recente/relevante"
        result.sort((a, b) => {
            const dateA = a.isGroup ? a.items[0].dataVencimento : a.item.dataVencimento;
            const dateB = b.isGroup ? b.items[0].dataVencimento : b.item.dataVencimento;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateB).getTime() - new Date(dateA).getTime(); // Mais recente primeiro na tabela geral
        });

        return result;
    }, [transacoesFiltradas]);


    // Marcar como pago
    const marcarComoPago = async (id: string) => {
        try {
            await fetch("/api/financeiro", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            showToast("Mensalidade paga com sucesso", "success");
            fetchData();
        } catch (error) {
            console.error("Erro ao marcar como pago:", error);
            showToast("Erro ao processar", "error");
        }
    };

    // Excluir transação
    const handleConfirmDelete = async () => {
        if (!deletingTransacao) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/financeiro/${deletingTransacao}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao excluir transação");
            }
            showToast("Transação excluída com sucesso!", "success");
            setDeletingTransacao(null);
            fetchData();
        } catch (error: any) {
            showToast(error.message || "Erro ao excluir", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-slate-200 rounded-xl" />
                    ))}
                </div>
                <div className="h-64 bg-slate-200 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Gestão de honorários, custas e repasses
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Nova Transação
                </button>
                <button
                    onClick={() => setShowRelatorioModal(true)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <Lock className="h-4 w-4" />
                    Fechar Mês
                </button>
            </div>

            {/* Alerta de Repasses Pendentes */}
            {cards.repassesPendentes > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-4 animate-pulse-soft">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-red-800 text-base">
                            ⚠️ Repasses Pendentes ao Cliente
                        </h3>
                        <p className="text-red-600 text-sm mt-0.5">
                            Você possui{" "}
                            <span className="font-bold text-lg">{formatCurrency(cards.repassesPendentes)}</span>{" "}
                            em valores que precisam ser repassados aos clientes.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFiltroCategoria("REPASSE_CLIENTE");
                            setFiltroStatus("PENDENTE");
                        }}
                        className="text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                    >
                        Ver Repasses
                    </button>
                </div>
            )}

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Honorários Recebidos"
                    value={cards.saldoHonorarios}
                    icon={DollarSign}
                    color="emerald"
                    description="Total de honorários pagos"
                />
                <SummaryCard
                    title="A Receber"
                    value={cards.aReceber}
                    icon={TrendingUp}
                    color="blue"
                    description="Receitas pendentes"
                />
                <SummaryCard
                    title="A Pagar"
                    value={cards.aPagar}
                    icon={TrendingDown}
                    color="amber"
                    description="Despesas pendentes"
                />
                <SummaryCard
                    title="Repasses Pendentes"
                    value={cards.repassesPendentes}
                    icon={AlertTriangle}
                    color="red"
                    description="Dinheiro retido do cliente"
                    highlight
                />
            </div>

            {/* Filtros + Tabela */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-400" />
                        Transações
                    </h2>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
                        >
                            <option value="TODOS">Todos Status</option>
                            <option value="PENDENTE">Pendente</option>
                            <option value="PAGO">Pago</option>
                        </select>
                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
                        >
                            <option value="TODOS">Todas Categorias</option>
                            <option value="HONORARIOS">Honorários</option>
                            <option value="CUSTAS">Custas</option>
                            <option value="REPASSE_CLIENTE">Repasse Cliente</option>
                            <option value="OPERACIONAL_ESCRITORIO">Operacional</option>
                        </select>
                    </div>
                </div>

                {transacoesFiltradas.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhuma transação encontrada</p>
                        <p className="text-slate-400 text-sm mt-1">
                            Registre um alvará ou crie uma transação manual
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Descrição</th>
                                    <th className="px-4 py-3">Processo</th>
                                    <th className="px-4 py-3">Categoria</th>
                                    <th className="px-4 py-3 text-right">Valor</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transacoesAgrupadas.map((row) => {
                                    if (!row.isGroup) {
                                        // ITEM SOLTO (Standalone)
                                        const t = row.item;
                                        const cat = categoriaBadge[t.categoria];
                                        const st = statusBadge[t.status];
                                        const CatIcon = cat.icon;
                                        return (
                                            <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {formatDate(t.dataVencimento)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-800 font-medium max-w-xs">
                                                    <div className="truncate">{t.descricao}</div>
                                                    <div className="flex gap-1.5 mt-1">
                                                        {t.parcelaAtual && t.totalParcelas && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700">
                                                                <CreditCard className="h-2.5 w-2.5" />
                                                                {t.parcelaAtual}/{t.totalParcelas}
                                                            </span>
                                                        )}
                                                        {t.isFixa && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 text-sky-700">
                                                                <Repeat className="h-2.5 w-2.5" />
                                                                Fixa
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-500">
                                                    {t.processo?.numero || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                                                        <CatIcon className="h-3 w-3" />
                                                        {cat.label}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-sm font-semibold text-right ${t.tipo === "RECEITA" ? "text-emerald-600" : "text-red-600"
                                                    }`}>
                                                    {t.tipo === "RECEITA" ? "+" : "−"} {formatCurrency(t.valor)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {t.status === "PENDENTE" ? (
                                                            <button
                                                                onClick={() => marcarComoPago(t.id)}
                                                                className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                                                title="Marcar como pago"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-zinc-300 text-xs px-1.5 pt-1">✓</span>
                                                        )}
                                                        <button onClick={() => setEditingTransacao(t)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => setDeletingTransacao(t.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Apagar">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // GRUPO DE PARCELAS (Master Row)
                                    const isExpanded = expandedGroups.has(row.id);
                                    const headItem = row.items[0]; // Usado para processo, categoria base, etc.
                                    const cat = categoriaBadge[headItem.categoria];
                                    const CatIcon = cat.icon;
                                    const masterSt = row.todasPagas ? statusBadge["PAGO"] : statusBadge["PENDENTE"];

                                    return (
                                        <React.Fragment key={row.id}>
                                            <tr
                                                className="hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/30"
                                                onClick={() => {
                                                    const next = new Set(expandedGroups);
                                                    if (isExpanded) next.delete(row.id);
                                                    else next.add(row.id);
                                                    setExpandedGroups(next);
                                                }}
                                            >
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {formatDate(headItem.dataVencimento)} {/* Mostra a primeira data */}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-800 font-medium max-w-xs">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                                        )}
                                                        <span className="truncate">{row.baseDescricao}</span>
                                                    </div>
                                                    <div className="flex gap-1.5 mt-1 ml-6">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700">
                                                            <CreditCard className="h-2.5 w-2.5" />
                                                            {row.parcelasPagas}/{row.totalParcelas} pagas
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-500">
                                                    {headItem.processo?.numero || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                                                        <CatIcon className="h-3 w-3" />
                                                        {cat.label}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-sm font-semibold text-right ${headItem.tipo === "RECEITA" ? "text-emerald-600" : "text-red-600"
                                                    }`}>
                                                    {headItem.tipo === "RECEITA" ? "+" : "−"} {formatCurrency(row.valorTotal)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${masterSt.color}`}>
                                                        {row.todasPagas ? "Totalmente Pago" : "Parcial"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-400 text-xs">
                                                    {/* Sem botão de pagar mestre, expande para pagar individual */}
                                                </td>
                                            </tr>

                                            {/* CHILD ROWS (Parcelas) */}
                                            {isExpanded && row.items.map((t) => {
                                                const subSt = statusBadge[t.status];
                                                return (
                                                    <tr key={t.id} className="group bg-slate-50/50 hover:bg-slate-100/50 transition-colors border-l-4 border-l-violet-200">
                                                        <td className="px-4 py-2.5 text-xs text-slate-500 pl-6">
                                                            {formatDate(t.dataVencimento)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-slate-600">
                                                            <div className="pl-6 flex items-center gap-2">
                                                                <span className="text-violet-600 font-medium">#{t.parcelaAtual || 'E'}:</span>
                                                                <span className="truncate max-w-[200px]">{t.descricao.replace(row.baseDescricao, '').replace(/^ — /, '')}</span>
                                                            </div>
                                                        </td>
                                                        <td colSpan={2}>{/* Pula processo e categoria pra não repetir */}</td>
                                                        <td className={`px-4 py-2.5 text-xs font-semibold text-right ${t.tipo === "RECEITA" ? "text-emerald-600" : "text-red-600"}`}>
                                                            {formatCurrency(t.valor)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${subSt.color}`}>
                                                                {subSt.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {t.status === "PENDENTE" ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            marcarComoPago(t.id);
                                                                        }}
                                                                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 p-1 rounded transition-colors"
                                                                        title="Marcar como pago"
                                                                    >
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-slate-300 text-xs px-1 pt-0.5">✓</span>
                                                                )}
                                                                <button onClick={(e) => { e.stopPropagation(); setEditingTransacao(t); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-all" title="Editar">
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); setDeletingTransacao(t.id); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-all" title="Apagar">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Nova Transação */}
            {showModal && (
                <NovaTransacaoModal
                    processos={processos}
                    clientes={clientes}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchData();
                    }}
                />
            )}

            {/* Modal de Fechamento Mensal */}
            {showRelatorioModal && (
                <FechamentoMensalModal
                    relatoriosExistentes={relatorios}
                    onClose={() => setShowRelatorioModal(false)}
                    onSuccess={() => {
                        setShowRelatorioModal(false);
                        fetchData();
                    }}
                />
            )}

            {/* Relatórios Mensais */}
            {relatorios.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Archive className="h-5 w-5 text-slate-400" />
                            Relatórios Mensais
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Meses fechados — transações arquivadas via soft delete</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {relatorios.map((r) => {
                            const nomeMes = new Date(r.ano, r.mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                            return (
                                <div key={r.id} className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all bg-gradient-to-br from-slate-50 to-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                            <span className="font-semibold text-slate-800 capitalize">{nomeMes}</span>
                                        </div>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            {r.quantidadeTransacoes} transações
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Receitas</span>
                                            <span className="text-emerald-600 font-medium">{formatCurrency(r.totalReceitas)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Despesas</span>
                                            <span className="text-red-500 font-medium">{formatCurrency(r.totalDespesas)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Honorários</span>
                                            <span className="text-emerald-600 font-medium">{formatCurrency(r.totalHonorarios)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Repasses</span>
                                            <span className="text-blue-600 font-medium">{formatCurrency(r.totalRepasses)}</span>
                                        </div>
                                        <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between">
                                            <span className="font-semibold text-slate-700">Saldo do Mês</span>
                                            <span className={`font-bold ${r.saldoMes >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                {formatCurrency(r.saldoMes)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3">
                                        Fechado em {formatDate(r.fechadoEm)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal de Editar Transação */}
            {editingTransacao && (
                <EditarTransacaoModal
                    transacao={editingTransacao}
                    processos={processos}
                    clientes={clientes}
                    onClose={() => setEditingTransacao(null)}
                    onSuccess={() => {
                        showToast("Transação atualizada com sucesso!", "success");
                        setEditingTransacao(null);
                        fetchData();
                    }}
                />
            )}

            {/* AlertDialog de Exclusão */}
            {deletingTransacao && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    Excluir Transação?
                                </h3>
                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                    Tem certeza que deseja apagar esta transação? Essa ação recalculará os saldos e o fechamento. Esta ação <strong>não pode ser desfeita.</strong>
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingTransacao(null)}
                                        disabled={isDeleting}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</>
                                        ) : (
                                            <><Trash2 className="w-4 h-4" /> Sim, excluir</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// === CARD DE RESUMO ===

function SummaryCard({
    title,
    value,
    icon: Icon,
    color,
    description,
    highlight,
}: {
    title: string;
    value: number;
    icon: typeof DollarSign;
    color: string;
    description: string;
    highlight?: boolean;
}) {
    const colorMap: Record<string, { bg: string; icon: string; text: string; border: string }> = {
        emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", text: "text-emerald-700", border: "border-emerald-200" },
        blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "text-blue-700", border: "border-blue-200" },
        amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", text: "text-amber-700", border: "border-amber-200" },
        red: { bg: "bg-red-50", icon: "bg-red-100 text-red-600", text: "text-red-700", border: "border-red-200" },
    };

    const c = colorMap[color] || colorMap.blue;

    return (
        <div className={`rounded-xl border p-5 transition-all ${highlight && value > 0
            ? `${c.bg} ${c.border} border-2 shadow-md animate-pulse-soft`
            : `bg-white border-slate-200 shadow-sm hover:shadow-md`
            }`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${c.icon}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className={`text-2xl font-bold ${highlight && value > 0 ? c.text : "text-slate-900"}`}>
                {formatCurrency(value)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
    );
}

// === MODAL UNIFICADO — NOVA TRANSAÇÃO ===

type TabId = "avista" | "parcelado" | "exito";

function NovaTransacaoModal({
    processos,
    clientes,
    onClose,
    onSuccess,
}: {
    processos: Processo[];
    clientes: Cliente[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [tab, setTab] = useState<TabId>("avista");

    const tabs: { id: TabId; label: string; icon: typeof DollarSign; desc: string }[] = [
        { id: "avista", label: "À Vista", icon: Banknote, desc: "Receita ou despesa simples" },
        { id: "parcelado", label: "Parcelado", icon: CreditCard, desc: "Honorários contratuais em parcelas" },
        { id: "exito", label: "Êxito (Alvará)", icon: ArrowRightLeft, desc: "Split honorários + repasse" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-up max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Nova Transação</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {tabs.find((t) => t.id === tab)?.desc}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 flex-shrink-0">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1">
                    {tab === "avista" && (
                        <TabAVista processos={processos} clientes={clientes} onSuccess={onSuccess} />
                    )}
                    {tab === "parcelado" && (
                        <TabParcelado processos={processos} clientes={clientes} onSuccess={onSuccess} />
                    )}
                    {tab === "exito" && (
                        <TabExito processos={processos} onSuccess={onSuccess} />
                    )}
                </div>
            </div>
        </div>
    );
}

// === MODAL DE EDIÇÃO DE TRANSAÇÃO ===

function EditarTransacaoModal({
    transacao,
    processos,
    clientes,
    onClose,
    onSuccess,
}: {
    transacao: Transacao;
    processos: Processo[];
    clientes: Cliente[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">(transacao.tipo);
    const [categoria, setCategoria] = useState(transacao.categoria);
    const [valor, setValor] = useState(
        transacao.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    const [descricao, setDescricao] = useState(transacao.descricao);
    const [dataVencimento, setDataVencimento] = useState(transacao.dataVencimento ? transacao.dataVencimento.split("T")[0] : "");
    const [dataPagamento, setDataPagamento] = useState(transacao.dataPagamento ? transacao.dataPagamento.split("T")[0] : "");
    const [status, setStatus] = useState(transacao.status);
    const [processoId, setProcessoId] = useState(transacao.processoId || "");
    const [clienteId, setClienteId] = useState(transacao.clienteId || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleValorChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "");
        if (!digits) { setValor(""); return; }
        const val = parseInt(digits, 10) / 100;
        setValor(val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const handleSubmit = async () => {
        setError("");
        if (!valor || !descricao || !dataVencimento) {
            setError("Preencha os campos obrigatórios");
            return;
        }
        const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
        if (valorNumerico <= 0) { setError("Valor deve ser maior que zero"); return; }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/financeiro/${transacao.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo,
                    categoria,
                    valor: valorNumerico,
                    descricao,
                    dataVencimento,
                    dataPagamento: status === "PAGO" ? (dataPagamento || new Date().toISOString().split("T")[0]) : null,
                    status,
                    processoId: processoId || null,
                    clienteId: clienteId || null,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                // try parse JSON for error message
                let msg = text;
                try {
                    const j = JSON.parse(text);
                    if (j.error) msg = j.error;
                } catch { /* empty */ }
                setError(msg);
                return;
            }
            onSuccess();
        } catch { setError("Erro de conexão"); } finally { setSubmitting(false); }
    };

    const processosAtivos = useMemo(() => processos.filter((p) => p.status !== "ARQUIVADO"), [processos]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-up max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Editar Transação</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Altere os dados do registro financeiro</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {/* Tipo e Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="RECEITA">Receita</option>
                                <option value="DESPESA">Despesa</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="PENDENTE">Pendente</option>
                                <option value="PAGO">Pago</option>
                            </select>
                        </div>
                    </div>

                    {/* Categoria */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                            <option value="HONORARIOS">Honorários</option>
                            <option value="CUSTAS">Custas</option>
                            <option value="OPERACIONAL_ESCRITORIO">Operacional do Escritório</option>
                            <option value="REPASSE_CLIENTE">Repasse ao Cliente</option>
                        </select>
                    </div>

                    {/* Valor & Descricao */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                                <input type="text" value={valor} onChange={(e) => handleValorChange(e.target.value)} placeholder="0,00" className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                            <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Breve descrição" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Vencimento</label>
                            <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        {status === "PAGO" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Pagamento</label>
                                <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                        )}
                    </div>

                    {/* Processo e Cliente */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Processo (opcional)</label>
                            <select value={processoId} onChange={(e) => setProcessoId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">Nenhum</option>
                                {processosAtivos.map((p) => (
                                    <option key={p.id} value={p.id}>{p.numero} — {p.titulo}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente (opcional)</label>
                            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">Nenhum</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Error */}
                    {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 flex-shrink-0 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !valor || !descricao || !dataVencimento}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                        {submitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Check className="h-4 w-4" /> Salvar Alterações</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── TAB À VISTA ─────────────────────────────────────

function TabAVista({
    processos,
    clientes,
    onSuccess,
}: {
    processos: Processo[];
    clientes: Cliente[];
    onSuccess: () => void;
}) {
    const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("RECEITA");
    const [categoria, setCategoria] = useState("HONORARIOS");
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [dataVencimento, setDataVencimento] = useState("");
    const [processoId, setProcessoId] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [isFixa, setIsFixa] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleValorChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "");
        if (!digits) { setValor(""); return; }
        const val = parseInt(digits, 10) / 100;
        setValor(val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const handleSubmit = async () => {
        setError("");
        if (!valor || !descricao) {
            setError("Preencha valor e descrição");
            return;
        }
        const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
        if (valorNumerico <= 0) { setError("Valor deve ser maior que zero"); return; }

        setSubmitting(true);
        try {
            const res = await fetch("/api/financeiro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo,
                    categoria,
                    valor: valorNumerico,
                    descricao,
                    dataVencimento: dataVencimento || undefined,
                    processoId: processoId || undefined,
                    clienteId: clienteId || undefined,
                    isFixa: tipo === "DESPESA" ? isFixa : false,
                }),
            });
            if (!res.ok) { setError(await res.text()); return; }
            onSuccess();
        } catch { setError("Erro de conexão"); } finally { setSubmitting(false); }
    };

    const processosAtivos = useMemo(() => processos.filter((p) => p.status !== "ARQUIVADO"), [processos]);

    return (
        <div className="p-6 space-y-4">
            {/* Tipo */}
            <div className="flex gap-2">
                {(["RECEITA", "DESPESA"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => { setTipo(t); setIsFixa(false); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${tipo === t
                            ? t === "RECEITA"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-red-500 bg-red-50 text-red-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                    >
                        {t === "RECEITA" ? "📈 Receita" : "📉 Despesa"}
                    </button>
                ))}
            </div>

            {/* Categoria */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="HONORARIOS">Honorários</option>
                    <option value="CUSTAS">Custas</option>
                    <option value="OPERACIONAL_ESCRITORIO">Operacional do Escritório</option>
                    {tipo === "DESPESA" && <option value="REPASSE_CLIENTE">Repasse ao Cliente</option>}
                </select>
            </div>

            {/* Valor */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                    <input type="text" value={valor} onChange={(e) => handleValorChange(e.target.value)} placeholder="0,00" className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
            </div>

            {/* Descrição */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Honorários contrato 001/2026" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>

            {/* Data de Vencimento */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Vencimento</label>
                <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>

            {/* Despesa Fixa */}
            {tipo === "DESPESA" && (
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <input
                        type="checkbox"
                        id="isFixa"
                        checked={isFixa}
                        onChange={(e) => setIsFixa(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isFixa" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Despesa Fixa Mensal (Recorrente)
                    </label>
                </div>
            )}

            {/* Processo e Cliente */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Processo (opcional)</label>
                    <select value={processoId} onChange={(e) => setProcessoId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <option value="">Nenhum</option>
                        {processosAtivos.map((p) => (
                            <option key={p.id} value={p.id}>{p.numero} — {p.titulo}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente (opcional)</label>
                    <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <option value="">Nenhum</option>
                        {clientes.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Checkbox Despesa Fixa */}
            {tipo === "DESPESA" && (
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" checked={isFixa} onChange={(e) => setIsFixa(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <div>
                        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <Repeat className="h-3.5 w-3.5 text-sky-600" />
                            Despesa Fixa Mensal
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">Ex: aluguel, software, contabilidade</p>
                    </div>
                </label>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            {/* Submit */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !valor || !descricao}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    {submitting ? (
                        <><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Registrando...</>
                    ) : (
                        <><Check className="h-4 w-4" /> Registrar</>
                    )}
                </button>
            </div>
        </div>
    );
}

// ── TAB PARCELADO ───────────────────────────────────

function TabParcelado({
    processos,
    clientes,
    onSuccess,
}: {
    processos: Processo[];
    clientes: Cliente[];
    onSuccess: () => void;
}) {
    const [valorTotal, setValorTotal] = useState("");
    const [valorEntrada, setValorEntrada] = useState("");
    const [numeroParcelas, setNumeroParcelas] = useState("12");
    const [dataVencimento, setDataVencimento] = useState("");
    const [descricao, setDescricao] = useState("");
    const [processoId, setProcessoId] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleMoneyChange = (raw: string, setter: (v: string) => void) => {
        const digits = raw.replace(/\D/g, "");
        if (!digits) { setter(""); return; }
        const val = parseInt(digits, 10) / 100;
        setter(val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const parseValor = (v: string) => parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;

    // Preview em tempo real
    const preview = useMemo(() => {
        const total = parseValor(valorTotal);
        const entrada = parseValor(valorEntrada);
        const parcelas = parseInt(numeroParcelas, 10);

        if (total <= 0 || parcelas <= 0) return null;
        if (entrada >= total) return null;

        const restante = total - entrada;
        const valorParcela = Math.round((restante / parcelas) * 100) / 100;
        const totalTransacoes = entrada > 0 ? parcelas + 1 : parcelas;

        return { entrada, valorParcela, parcelas, totalTransacoes, total };
    }, [valorTotal, valorEntrada, numeroParcelas]);

    const handleSubmit = async () => {
        setError("");
        if (!valorTotal || !numeroParcelas || !dataVencimento || !descricao) {
            setError("Preencha todos os campos obrigatórios");
            return;
        }
        const total = parseValor(valorTotal);
        const entrada = parseValor(valorEntrada);
        if (total <= 0) { setError("Valor total deve ser maior que zero"); return; }
        if (entrada >= total) { setError("Entrada deve ser menor que o valor total"); return; }

        setSubmitting(true);
        try {
            const res = await fetch("/api/financeiro/honorarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    valorTotal: total,
                    valorEntrada: entrada || undefined,
                    numeroParcelas: parseInt(numeroParcelas, 10),
                    dataVencimento1aParcela: dataVencimento,
                    descricao,
                    processoId: processoId || undefined,
                    clienteId: clienteId || undefined,
                }),
            });
            if (!res.ok) { setError(await res.text()); return; }
            onSuccess();
        } catch { setError("Erro de conexão"); } finally { setSubmitting(false); }
    };

    const processosAtivos = useMemo(() => processos.filter((p) => p.status !== "ARQUIVADO"), [processos]);

    return (
        <div className="p-6 space-y-4">
            {/* Valor Total */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Total dos Honorários (R$)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                    <input type="text" value={valorTotal} onChange={(e) => handleMoneyChange(e.target.value, setValorTotal)} placeholder="0,00" className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Valor da Entrada */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Ent. (opcional, R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                        <input type="text" value={valorEntrada} onChange={(e) => handleMoneyChange(e.target.value, setValorEntrada)} placeholder="0,00" className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                </div>

                {/* Número de Parcelas */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nº de Parcelas</label>
                    <input type="number" min="1" max="120" value={numeroParcelas} onChange={(e) => setNumeroParcelas(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
            </div>

            {/* Data 1ª Parcela */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimento da 1ª Parcela</label>
                <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>

            {/* Descrição */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Honorários contratuais — Caso Silva" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>

            {/* Processo e Cliente */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Processo (opcional)</label>
                    <select value={processoId} onChange={(e) => setProcessoId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <option value="">Nenhum</option>
                        {processosAtivos.map((p) => (
                            <option key={p.id} value={p.id}>{p.numero} — {p.titulo}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente (opcional)</label>
                    <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <option value="">Nenhum</option>
                        {clientes.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Preview */}
            {preview && (
                <div className="rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        Prévia do Parcelamento
                    </p>
                    <div className="space-y-1.5">
                        {preview.entrada > 0 && (
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">1x</span>
                                <span className="text-sm text-slate-700">Entrada de <b className="text-emerald-700">{formatCurrency(preview.entrada)}</b></span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-violet-100">
                            <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{preview.parcelas}x</span>
                            <span className="text-sm text-slate-700">de <b className="text-violet-700">{formatCurrency(preview.valorParcela)}</b></span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 pt-1 border-t border-violet-100 mt-2">
                        Total: <b>{formatCurrency(preview.total)}</b> em {preview.totalTransacoes} lançamento{preview.totalTransacoes > 1 ? "s" : ""}
                    </p>
                </div>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            {/* Submit */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !valorTotal || !numeroParcelas || !dataVencimento || !descricao}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    {submitting ? (
                        <><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Gerando parcelas...</>
                    ) : (
                        <><Check className="h-4 w-4" /> Gerar Parcelas</>
                    )}
                </button>
            </div>
        </div>
    );
}

// ── TAB ÊXITO (ALVARÁ) ─────────────────────────────

function TabExito({
    processos,
    onSuccess,
}: {
    processos: Processo[];
    onSuccess: () => void;
}) {
    const [processoId, setProcessoId] = useState("");
    const [valorTotal, setValorTotal] = useState("");
    const [percentual, setPercentual] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const processoSelecionado = processos.find((p) => p.id === processoId);
    useEffect(() => {
        if (processoSelecionado?.honorariosPercentual) {
            setPercentual(String(processoSelecionado.honorariosPercentual));
        }
    }, [processoId, processoSelecionado]);

    const preview = useMemo(() => {
        const valor = parseFloat(valorTotal.replace(/\D/g, "")) / 100;
        const perc = parseFloat(percentual);
        if (!valor || valor <= 0 || !perc || perc <= 0 || perc >= 100) return null;
        const honorarios = Math.round(valor * (perc / 100) * 100) / 100;
        const repasse = Math.round((valor - honorarios) * 100) / 100;
        return { honorarios, repasse, valor };
    }, [valorTotal, percentual]);

    const handleValorChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "");
        if (!digits) { setValorTotal(""); return; }
        const val = parseInt(digits, 10) / 100;
        setValorTotal(val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const handleSubmit = async () => {
        setError("");
        if (!processoId || !valorTotal || !percentual) { setError("Preencha todos os campos"); return; }
        const valorNumerico = parseFloat(valorTotal.replace(/\./g, "").replace(",", "."));
        const percNumerico = parseFloat(percentual);
        if (valorNumerico <= 0) { setError("Valor deve ser maior que zero"); return; }
        if (percNumerico <= 0 || percNumerico >= 100) { setError("Percentual deve ser entre 0 e 100"); return; }

        setSubmitting(true);
        try {
            const res = await fetch("/api/financeiro/alvara", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ processoId, valorTotal: valorNumerico, percentualHonorarios: percNumerico }),
            });
            if (!res.ok) { setError(await res.text()); return; }
            onSuccess();
        } catch { setError("Erro de conexão"); } finally { setSubmitting(false); }
    };

    const processosAtivos = useMemo(() => processos.filter((p) => p.status !== "ARQUIVADO"), [processos]);

    return (
        <div className="p-6 space-y-4">
            {/* Processo */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Processo</label>
                <select value={processoId} onChange={(e) => setProcessoId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Selecione um processo...</option>
                    {processosAtivos.map((p) => (
                        <option key={p.id} value={p.id}>{p.numero} — {p.titulo}</option>
                    ))}
                </select>
            </div>

            {/* Valor Total */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Total Recebido (R$)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                    <input type="text" value={valorTotal} onChange={(e) => handleValorChange(e.target.value)} placeholder="0,00" className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
            </div>

            {/* % Honorários */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    % de Honorários
                    {processoSelecionado?.honorariosPercentual && (
                        <span className="text-xs text-slate-400 ml-2">(padrão do processo: {processoSelecionado.honorariosPercentual}%)</span>
                    )}
                </label>
                <div className="relative">
                    <input type="number" min="0" max="99.99" step="0.5" value={percentual} onChange={(e) => setPercentual(e.target.value)} placeholder="Ex: 30" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
            </div>

            {/* Preview */}
            {preview && (
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prévia do Desmembramento</p>
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-emerald-100">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-emerald-600 font-medium">O escritório recebe</p>
                            <p className="text-lg font-bold text-emerald-700">{formatCurrency(preview.honorarios)}</p>
                        </div>
                        <span className="text-xs text-emerald-500 font-medium bg-emerald-50 px-2 py-1 rounded">Honorários</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-blue-600 font-medium">O cliente recebe</p>
                            <p className="text-lg font-bold text-blue-700">{formatCurrency(preview.repasse)}</p>
                        </div>
                        <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-1 rounded">Repasse</span>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            {/* Submit */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !processoId || !valorTotal || !percentual}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    {submitting ? (
                        <><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Registrando...</>
                    ) : (
                        <><Check className="h-4 w-4" /> Registrar Alvará</>
                    )}
                </button>
            </div>
        </div>
    );
}

// === MODAL FECHAMENTO MENSAL ===

function FechamentoMensalModal({
    relatoriosExistentes,
    onClose,
    onSuccess,
}: {
    relatoriosExistentes: RelatorioMensal[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const dataAtual = new Date();
    const [mes, setMes] = useState(String(dataAtual.getMonth() + 1));
    const [ano, setAno] = useState(String(dataAtual.getFullYear()));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const anos = Array.from({ length: 5 }, (_, i) => dataAtual.getFullYear() - 2 + i);

    const handleSubmit = async () => {
        setError("");

        // Verifica se já existe localmente
        const existe = relatoriosExistentes.find(
            (r) => r.mes === parseInt(mes) && r.ano === parseInt(ano)
        );
        if (existe) {
            setError(`O relatório de ${meses[parseInt(mes) - 1]} de ${ano} já foi fechado.`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/financeiro/relatorio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mes, ano }),
            });

            if (!res.ok) {
                const msg = await res.text();
                setError(msg || "Erro ao executar fechamento mensal");
                return;
            }

            onSuccess();
        } catch {
            setError("Erro de conexão");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-slate-700" />
                            Fechamento Mensal
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Gera extrato e arquiva transações do período
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p>
                            <strong>Atenção:</strong> Ao fechar o mês, as transações atuais serão movidas para o histórico (soft delete) e não constarão mais nas pendências ativas. Certifique-se de que nada ficou pendente no mês escolhido.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mês</label>
                            <select
                                value={mes}
                                onChange={(e) => setMes(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-800"
                            >
                                {meses.map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ano</label>
                            <select
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-800"
                            >
                                {anos.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm"
                    >
                        {submitting ? "Processando..." : (
                            <>
                                <Lock className="h-4 w-4" />
                                Confirmar Fechamento
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function FinanceiroPage() {
    return (
        <ToastProvider>
            <FinanceiroContent />
        </ToastProvider>
    );
}
