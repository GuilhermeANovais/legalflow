"use client";

import {
    Scale, X, CheckCircle2,
    AlertTriangle, Clock, RefreshCw,
    Monitor, MessageCircle, RotateCcw,
    Pencil, MoreHorizontal, User, ChevronRight
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useRef, useEffect } from "react";

// --- Tipos ---
interface Cliente {
    id: string;
    nome: string;
    telefone: string | null;
}

interface Movimentacao {
    id: string;
    codigo: number;
    nome: string;
    dataHora: string;
}

interface ProcessoHistorico {
    id: string;
    acao: string;
    descricao: string;
    createdAt: string;
}

interface Processo {
    id: string;
    titulo: string;
    numero: string;
    area: string;
    fase: string;
    prioridade: string;
    valorCausa: number;
    dataPrazo: string | null;
    status: string;
    resultado: string | null;
    arquivadoEm: string | null;
    clienteId: string;
    cliente?: Cliente;
    tribunal?: string | null;
    orgaoJulgador?: string | null;
    classeProcessual?: string | null;
    assuntoPrincipal?: string | null;
    sistema?: string | null;
    dataAjuizamento?: string | null;
    sincronizadoEm?: string | null;
    movimentacoes?: Movimentacao[];
    historico?: ProcessoHistorico[];
}

interface ProcessCardProps {
    proc: Processo;
    isSyncing: boolean;
    onEdit: (proc: Processo) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onPrioridadeChange: (id: string, novaPrioridade: string) => void;
    onArquivar: (id: string) => void;
    onReabrir: (id: string) => void;
    onWhatsApp: (telefone: string | null | undefined, nome: string | undefined) => void;
    onSincronizar: (processoId: string) => void;
    onOpenDetail: (proc: Processo) => void;
}

// --- Helpers ---
function formatarNumeroCNJ(numero: string): string {
    const clean = numero.replace(/\D/g, "");
    if (clean.length === 20) {
        return `${clean.slice(0, 7)}-${clean.slice(7, 9)}.${clean.slice(9, 13)}.${clean.slice(13, 14)}.${clean.slice(14, 16)}.${clean.slice(16, 20)}`;
    }
    return numero;
}

function getPrazoStatus(data: string | null): string {
    if (!data) return "neutral";
    const prazo = new Date(data);
    const hoje = new Date();
    if (isBefore(prazo, hoje)) return "vencido";
    if (isBefore(prazo, addDays(hoje, 3))) return "atencao";
    return "em_dia";
}

// --- Indicador de Prioridade (Dot colorido em vez de select genérico) ---
const PRIORIDADE_CONFIG = {
    Urgente: {
        dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
        ring: "ring-red-200",
        label: "text-red-600",
        bg: "bg-red-50",
    },
    Alta: {
        dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
        ring: "ring-amber-200",
        label: "text-amber-600",
        bg: "bg-amber-50",
    },
    Normal: {
        dot: "bg-slate-300",
        ring: "ring-slate-100",
        label: "text-slate-400",
        bg: "bg-slate-50",
    },
} as const;

function PrioritySelector({
    value,
    onChange,
    stopPropagation,
}: {
    value: string;
    onChange: (val: string) => void;
    stopPropagation: (e: React.MouseEvent) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const config = PRIORIDADE_CONFIG[value as keyof typeof PRIORIDADE_CONFIG] || PRIORIDADE_CONFIG.Normal;

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => { stopPropagation(e); setOpen(!open); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 border border-transparent hover:border-slate-200 hover:bg-slate-50 ${config.label}`}
            >
                <span className={`w-2 h-2 rounded-full ${config.dot} transition-all`} />
                {value}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60 py-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-150">
                    {(["Normal", "Alta", "Urgente"] as const).map((opt) => {
                        const c = PRIORIDADE_CONFIG[opt];
                        const isActive = value === opt;
                        return (
                            <button
                                key={opt}
                                onClick={(e) => { stopPropagation(e); onChange(opt); setOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold transition-colors ${isActive ? `${c.bg} ${c.label}` : "text-slate-500 hover:bg-slate-50"}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                {opt}
                                {isActive && <CheckCircle2 size={10} className="ml-auto opacity-60" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// --- Menu de ações (⋯) ---
function ActionsMenu({
    proc, isSyncing, onEdit, onDelete, onArquivar, onWhatsApp, onSincronizar
}: {
    proc: Processo;
    isSyncing: boolean;
    onEdit: (proc: Processo) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onArquivar: (id: string) => void;
    onWhatsApp: (telefone: string | null | undefined, nome: string | undefined) => void;
    onSincronizar: (processoId: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const actions = [
        { icon: Pencil, label: "Editar", onClick: (e: React.MouseEvent) => { e.stopPropagation(); onEdit(proc); setOpen(false); }, color: "text-blue-600" },
        { icon: RefreshCw, label: "Sincronizar CNJ", onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSincronizar(proc.id); setOpen(false); }, color: "text-blue-600", spin: isSyncing },
        { icon: MessageCircle, label: "WhatsApp", onClick: (e: React.MouseEvent) => { e.stopPropagation(); onWhatsApp(proc.cliente?.telefone, proc.cliente?.nome); setOpen(false); }, color: "text-green-600" },
        { icon: CheckCircle2, label: "Arquivar", onClick: (e: React.MouseEvent) => { e.stopPropagation(); onArquivar(proc.id); setOpen(false); }, color: "text-emerald-600" },
        { icon: X, label: "Excluir", onClick: (e: React.MouseEvent) => { onDelete(proc.id, e); setOpen(false); }, color: "text-red-500", separator: true },
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className={`p-1.5 rounded-lg transition-all duration-200 ${open ? "bg-slate-100 text-slate-600" : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"}`}
            >
                <MoreHorizontal size={16} />
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    {actions.map((action, i) => (
                        <div key={action.label}>
                            {action.separator && <div className="h-px bg-slate-100 my-1" />}
                            <button
                                onClick={action.onClick}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <action.icon size={13} className={`${action.color} ${action.spin ? "animate-spin" : ""}`} />
                                {action.label}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


// ================================================================
// CARD PRINCIPAL
// ================================================================
export default function ProcessCard({
    proc, isSyncing, onEdit, onDelete, onPrioridadeChange,
    onArquivar, onReabrir, onWhatsApp, onSincronizar, onOpenDetail
}: ProcessCardProps) {
    const statusPrazo = getPrazoStatus(proc.dataPrazo);
    const isArquivado = proc.status === "ARQUIVADO";
    const hasCnjData = !!(proc.tribunal || proc.classeProcessual);

    return (
        <div
            onClick={() => onOpenDetail(proc)}
            className={`relative bg-white rounded-2xl border transition-all duration-300 group cursor-pointer ${isArquivado
                ? "opacity-50 bg-slate-50/80 border-slate-100"
                : "hover:shadow-xl hover:shadow-slate-900/[0.06] border-slate-200/80 shadow-sm shadow-slate-100 hover:border-slate-300/80 hover:-translate-y-0.5"
                }`}
        >
            {/* Barra lateral de prazo — gradiente mais sofisticado */}
            {!isArquivado && proc.dataPrazo && (
                <div
                    className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${statusPrazo === "vencido"
                        ? "bg-gradient-to-b from-red-500 via-red-400 to-red-300"
                        : statusPrazo === "atencao"
                            ? "bg-gradient-to-b from-amber-500 via-amber-400 to-amber-300"
                            : "bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-200"
                        }`}
                />
            )}

            {/* ========== TOP ROW — Prioridade + Menu ========== */}
            <div className="px-5 pt-4 pb-0">
                <div className="flex justify-between items-center">
                    {!isArquivado ? (
                        <PrioritySelector
                            value={proc.prioridade}
                            onChange={(val) => onPrioridadeChange(proc.id, val)}
                            stopPropagation={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-200">
                            <CheckCircle2 size={9} />
                            {proc.resultado || "Arquivado"}
                        </span>
                    )}

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!isArquivado ? (
                            <ActionsMenu
                                proc={proc}
                                isSyncing={isSyncing}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onArquivar={onArquivar}
                                onWhatsApp={onWhatsApp}
                                onSincronizar={onSincronizar}
                            />
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onReabrir(proc.id); }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Reabrir Processo"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== CORPO ========== */}
            <div className="px-5 pt-3 pb-4 space-y-3">
                {/* Título */}
                <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-[1.35] tracking-[-0.01em]">
                    {proc.titulo}
                </h3>

                {/* Metadados — layout inline limpo */}
                <div className="space-y-1.5">
                    {/* NPU */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Scale size={11} className="text-slate-300 flex-shrink-0" />
                        <span className="font-mono tracking-tight">
                            {formatarNumeroCNJ(proc.numero)}
                        </span>
                    </div>

                    {/* Tribunal */}
                    {hasCnjData && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Monitor size={11} className="text-slate-300 flex-shrink-0" />
                            <span className="font-medium truncate">
                                {[proc.tribunal, proc.sistema].filter(Boolean).join(" · ")}
                            </span>
                        </div>
                    )}

                    {/* Valor da Causa */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-400">R$</span>
                        <span className="font-medium tracking-tight">
                            {proc.valorCausa ? proc.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
                        </span>
                    </div>

                    {/* Prazo — pulsante se vencido */}
                    {!isArquivado && proc.dataPrazo && (
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${statusPrazo === "vencido"
                            ? "text-red-500"
                            : statusPrazo === "atencao"
                                ? "text-amber-500"
                                : "text-slate-400"
                            }`}
                        >
                            {statusPrazo === "vencido"
                                ? <AlertTriangle size={11} className="animate-pulse flex-shrink-0" />
                                : <Clock size={11} className="flex-shrink-0" />
                            }
                            <span>
                                {statusPrazo === "vencido" ? "Vencido " : "Prazo "}
                                {format(new Date(proc.dataPrazo), "dd 'de' MMM", { locale: ptBR })}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ========== FOOTER ========== */}
            <div className="px-5 py-3 border-t border-slate-100/80 flex justify-between items-center bg-slate-50/40">
                <div className="flex items-center gap-2 min-w-0 max-w-[60%]">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-slate-400" />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-700 truncate">
                        {proc.cliente?.nome || "Sem cliente"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isArquivado && proc.arquivadoEm ? (
                        <span className="text-[10px] text-slate-400 font-medium">
                            {format(new Date(proc.arquivadoEm), "dd/MM/yy", { locale: ptBR })}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">
                            {proc.fase}
                        </span>
                    )}
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
            </div>
        </div>
    );
}
