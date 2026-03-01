"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

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

interface Transacao {
    id: string;
    tipo: "RECEITA" | "DESPESA";
    categoria: "HONORARIOS" | "CUSTAS" | "REPASSE_CLIENTE" | "OPERACIONAL_ESCRITORIO";
    valor: number;
    status: "PENDENTE" | "PAGO";
    descricao: string;
    dataVencimento: string;
    dataPagamento?: string | null;
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

export default function FinanceiroPage() {
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [processos, setProcessos] = useState<Processo[]>([]);
    const [resumo, setResumo] = useState<ResumoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRelatorioModal, setShowRelatorioModal] = useState(false);
    const [relatorios, setRelatorios] = useState<RelatorioMensal[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
    const [filtroCategoria, setFiltroCategoria] = useState<string>("TODOS");

    // Buscar dados
    const fetchData = async () => {
        try {
            const [finRes, procRes, relRes] = await Promise.all([
                fetch("/api/financeiro"),
                fetch("/api/processos"),
                fetch("/api/financeiro/relatorio"),
            ]);
            const finData = await finRes.json();
            const procData = await procRes.json();
            const relData = await relRes.json();
            setTransacoes(finData.transacoes || []);
            setResumo(finData.resumo || []);
            setProcessos(procData || []);
            setRelatorios(relData || []);
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

    // Marcar como pago
    const marcarComoPago = async (id: string) => {
        try {
            await fetch("/api/financeiro", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchData();
        } catch (error) {
            console.error("Erro ao marcar como pago:", error);
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
                    Registrar Alvará
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
                                {transacoesFiltradas.map((t) => {
                                    const cat = categoriaBadge[t.categoria];
                                    const st = statusBadge[t.status];
                                    const CatIcon = cat.icon;
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {formatDate(t.dataVencimento)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-800 font-medium max-w-xs truncate">
                                                {t.descricao}
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
                                                {t.status === "PENDENTE" ? (
                                                    <button
                                                        onClick={() => marcarComoPago(t.id)}
                                                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                                        title="Marcar como pago"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">✓</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Alvará */}
            {showModal && (
                <AlvaraModal
                    processos={processos}
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

// === MODAL REGISTRAR ALVARÁ ===

function AlvaraModal({
    processos,
    onClose,
    onSuccess,
}: {
    processos: Processo[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [processoId, setProcessoId] = useState("");
    const [valorTotal, setValorTotal] = useState("");
    const [percentual, setPercentual] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Quando seleciona um processo, pré-preenche o percentual
    const processoSelecionado = processos.find((p) => p.id === processoId);
    useEffect(() => {
        if (processoSelecionado?.honorariosPercentual) {
            setPercentual(String(processoSelecionado.honorariosPercentual));
        }
    }, [processoId, processoSelecionado]);

    // Preview em tempo real
    const preview = useMemo(() => {
        const valor = parseFloat(valorTotal.replace(/\D/g, "")) / 100;
        const perc = parseFloat(percentual);
        if (!valor || valor <= 0 || !perc || perc <= 0 || perc >= 100) return null;

        const honorarios = Math.round(valor * (perc / 100) * 100) / 100;
        const repasse = Math.round((valor - honorarios) * 100) / 100;

        return { honorarios, repasse, valor };
    }, [valorTotal, percentual]);

    // Máscara de moeda BRL
    const handleValorChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "");
        if (!digits) {
            setValorTotal("");
            return;
        }
        const val = parseInt(digits, 10) / 100;
        setValorTotal(
            val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
    };

    const handleSubmit = async () => {
        setError("");
        if (!processoId || !valorTotal || !percentual) {
            setError("Preencha todos os campos");
            return;
        }

        const valorNumerico = parseFloat(valorTotal.replace(/\./g, "").replace(",", "."));
        const percNumerico = parseFloat(percentual);

        if (valorNumerico <= 0) {
            setError("Valor deve ser maior que zero");
            return;
        }
        if (percNumerico <= 0 || percNumerico >= 100) {
            setError("Percentual deve ser entre 0 e 100");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/financeiro/alvara", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    processoId,
                    valorTotal: valorNumerico,
                    percentualHonorarios: percNumerico,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                setError(msg || "Erro ao registrar alvará");
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
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Registrar Alvará / Êxito</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            O sistema calculará automaticamente honorários e repasse
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Processo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Processo</label>
                        <select
                            value={processoId}
                            onChange={(e) => setProcessoId(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="">Selecione um processo...</option>
                            {processos
                                .filter((p) => p.status !== "ARQUIVADO")
                                .map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.numero} — {p.titulo}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Valor Total */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Valor Total Recebido (R$)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                R$
                            </span>
                            <input
                                type="text"
                                value={valorTotal}
                                onChange={(e) => handleValorChange(e.target.value)}
                                placeholder="0,00"
                                className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* % Honorários */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            % de Honorários
                            {processoSelecionado?.honorariosPercentual && (
                                <span className="text-xs text-slate-400 ml-2">
                                    (padrão do processo: {processoSelecionado.honorariosPercentual}%)
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="99.99"
                                step="0.5"
                                value={percentual}
                                onChange={(e) => setPercentual(e.target.value)}
                                placeholder="Ex: 30"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                %
                            </span>
                        </div>
                    </div>

                    {/* Preview em Tempo Real */}
                    {preview && (
                        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 p-4 space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Prévia do Desmembramento
                            </p>

                            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-emerald-100">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-emerald-600 font-medium">O escritório recebe</p>
                                    <p className="text-lg font-bold text-emerald-700">
                                        {formatCurrency(preview.honorarios)}
                                    </p>
                                </div>
                                <span className="text-xs text-emerald-500 font-medium bg-emerald-50 px-2 py-1 rounded">
                                    Honorários
                                </span>
                            </div>

                            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-blue-600 font-medium">O cliente recebe</p>
                                    <p className="text-lg font-bold text-blue-700">
                                        {formatCurrency(preview.repasse)}
                                    </p>
                                </div>
                                <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-1 rounded">
                                    Repasse
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Erro */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !processoId || !valorTotal || !percentual}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                        {submitting ? (
                            <>
                                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Registrar Alvará
                            </>
                        )}
                    </button>
                </div>
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
