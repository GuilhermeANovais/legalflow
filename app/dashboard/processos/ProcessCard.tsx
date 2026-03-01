"use client";

import {
    Scale, X, CheckCircle2, Calendar,
    MessageCircle, AlertTriangle, Clock, RefreshCw,
    Gavel, MapPin, FileText, Monitor, ChevronDown,
    Sparkles, Loader2, UserCheck, Brain, RotateCcw
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { consultarIA } from "@/app/actions";

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
}

interface ProcessCardProps {
    proc: Processo;
    isSyncing: boolean;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onPrioridadeChange: (id: string, novaPrioridade: string) => void;
    onArquivar: (id: string) => void;
    onReabrir: (id: string) => void;
    onWhatsApp: (telefone: string | null | undefined, nome: string | undefined) => void;
    onSincronizar: (processoId: string) => void;
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

export default function ProcessCard({
    proc, isSyncing, onDelete, onPrioridadeChange,
    onArquivar, onReabrir, onWhatsApp, onSincronizar
}: ProcessCardProps) {
    const [expanded, setExpanded] = useState(false);
    const statusPrazo = getPrazoStatus(proc.dataPrazo);
    const isArquivado = proc.status === "ARQUIVADO";
    const hasCnjData = !!(proc.tribunal || proc.classeProcessual);
    const ultimasMovs = (proc.movimentacoes || []).slice(0, 3);

    // --- Estados IA ---
    const [iaAberto, setIaAberto] = useState(false);
    const [iaLoading, setIaLoading] = useState(false);
    const [iaResultado, setIaResultado] = useState("");
    const [iaModo, setIaModo] = useState<'CLIENTE' | 'JURIDICO'>('CLIENTE');

    const handleIA = async (modo: 'CLIENTE' | 'JURIDICO') => {
        setIaModo(modo);
        setIaLoading(true);
        setIaResultado("");
        try {
            const texto = await consultarIA(proc.titulo, proc.numero, proc.fase, modo);
            setIaResultado(texto || "Sem resposta da IA.");
        } catch {
            setIaResultado("Erro ao conectar com o consultor IA.");
        } finally {
            setIaLoading(false);
        }
    };

    return (
        <div
            className={`relative bg-white rounded-2xl border transition-all group overflow-hidden ${isArquivado
                ? "opacity-60 grayscale bg-slate-50 border-slate-100"
                : "hover:shadow-lg hover:shadow-slate-200/50 border-slate-200 shadow-sm"
                }`}
        >
            {/* Indicador lateral de prazo */}
            {!isArquivado && proc.dataPrazo && (
                <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${statusPrazo === "vencido"
                        ? "bg-gradient-to-b from-red-500 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                        : statusPrazo === "atencao"
                            ? "bg-gradient-to-b from-amber-400 to-amber-300"
                            : "bg-gradient-to-b from-emerald-400 to-emerald-300"
                        }`}
                />
            )}

            {/* ========== HEADER ========== */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex justify-between items-start mb-3">
                    {/* Prioridade */}
                    {!isArquivado ? (
                        <select
                            value={proc.prioridade}
                            onChange={(e) => onPrioridadeChange(proc.id, e.target.value)}
                            className={`appearance-none cursor-pointer pl-3 pr-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border outline-none transition-colors ${proc.prioridade === "Urgente"
                                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                : proc.prioridade === "Alta"
                                    ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                }`}
                        >
                            <option value="Normal">Normal</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    ) : (
                        /* Badge de Arquivado com Resultado */
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-700 text-white border border-slate-600 shadow-sm">
                            <CheckCircle2 size={10} />
                            Arquivado — {proc.resultado || "Sem resultado"}
                        </span>
                    )}

                    {/* Toolbar de ações */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!isArquivado ? (
                            <>
                                {/* Botão IA */}
                                <button
                                    onClick={() => setIaAberto(!iaAberto)}
                                    className={`p-1.5 rounded-lg transition-colors ${iaAberto
                                        ? "text-indigo-600 bg-indigo-50"
                                        : "text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                        }`}
                                    title="Consultar IA"
                                >
                                    <Sparkles size={14} />
                                </button>
                                <button
                                    onClick={() => onSincronizar(proc.id)}
                                    disabled={isSyncing}
                                    className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Sincronizar com CNJ"
                                >
                                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                                </button>
                                <button
                                    onClick={() => onWhatsApp(proc.cliente?.telefone, proc.cliente?.nome)}
                                    className="p-1.5 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Enviar WhatsApp"
                                >
                                    <MessageCircle size={14} />
                                </button>
                                {/* Botão Arquivar */}
                                <button
                                    onClick={() => onArquivar(proc.id)}
                                    className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Arquivar Processo"
                                >
                                    <CheckCircle2 size={14} />
                                </button>
                                {/* Botão Excluir */}
                                <button
                                    onClick={(e) => onDelete(proc.id, e)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir Processo"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            /* Botão Reabrir (apenas cards arquivados) */
                            <button
                                onClick={() => onReabrir(proc.id)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Reabrir Processo"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Título */}
                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 leading-snug min-h-[2.75rem]">
                    {proc.titulo}
                </h3>

                {/* Número do Processo (formatado CNJ) + Badge Tribunal/Sistema */}
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Scale size={11} className="text-blue-500 flex-shrink-0" />
                        {formatarNumeroCNJ(proc.numero)}
                    </p>

                    {/* Badge Tribunal + Sistema */}
                    {hasCnjData && (
                        <span className="text-[10px] font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Monitor size={10} className="text-blue-500" />
                            {[proc.tribunal, proc.sistema].filter(Boolean).join(" • ")}
                        </span>
                    )}

                    {/* Badge Prazo */}
                    {!isArquivado && proc.dataPrazo && (
                        <span
                            className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg border ml-auto ${statusPrazo === "vencido"
                                ? "text-red-600 bg-red-50 border-red-200"
                                : statusPrazo === "atencao"
                                    ? "text-amber-600 bg-amber-50 border-amber-200"
                                    : "text-slate-500 bg-slate-50 border-slate-200"
                                }`}
                        >
                            {statusPrazo === "vencido" ? <AlertTriangle size={10} /> : <Clock size={10} />}
                            {format(new Date(proc.dataPrazo), "dd/MM", { locale: ptBR })}
                        </span>
                    )}
                </div>
            </div>

            {/* ========== CORPO (Grid de Detalhes CNJ) ========== */}
            {hasCnjData && (
                <div className="px-5 py-3 mx-3 mb-2 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-100/80">
                    <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                        {/* Esquerda: Detalhes do Rito */}
                        <div className="space-y-2">
                            {proc.classeProcessual && (
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                        <Gavel size={9} /> Classe
                                    </span>
                                    <p className="text-[11px] font-semibold text-slate-700 leading-snug mt-0.5">
                                        {proc.classeProcessual}
                                    </p>
                                </div>
                            )}
                            {proc.assuntoPrincipal && (
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                        <FileText size={9} /> Assunto
                                    </span>
                                    <p className="text-[11px] font-semibold text-slate-700 leading-snug mt-0.5">
                                        {proc.assuntoPrincipal}
                                    </p>
                                </div>
                            )}
                            {proc.orgaoJulgador && (
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                        <MapPin size={9} /> Órgão
                                    </span>
                                    <p className="text-[11px] font-semibold text-slate-700 leading-snug mt-0.5 line-clamp-2">
                                        {proc.orgaoJulgador}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Direita: Datas */}
                        <div className="space-y-2">
                            {proc.dataAjuizamento && (
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                        <Calendar size={9} /> Ajuizamento
                                    </span>
                                    <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                                        {format(new Date(proc.dataAjuizamento), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                            )}
                            {proc.sincronizadoEm && (
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                        <RefreshCw size={9} /> Última sinc.
                                    </span>
                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                        {format(new Date(proc.sincronizadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== MOVIMENTAÇÕES (Timeline) ========== */}
            {ultimasMovs.length > 0 && (
                <div className="px-5 pb-1">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider hover:text-slate-600 transition-colors py-1.5"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Últimas Movimentações
                        </span>
                        <ChevronDown
                            size={12}
                            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        />
                    </button>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="relative pl-4 pb-3 space-y-2.5">
                            {/* Linha vertical da timeline */}
                            <div className="absolute left-[5px] top-1 bottom-3 w-px bg-gradient-to-b from-blue-300 via-slate-200 to-transparent" />

                            {ultimasMovs.map((mov, idx) => (
                                <div key={mov.id || idx} className="relative flex gap-3">
                                    {/* Dot da timeline */}
                                    <div
                                        className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 ${idx === 0
                                            ? "bg-blue-500 border-blue-300 shadow-[0_0_6px_rgba(59,130,246,0.4)]"
                                            : "bg-white border-slate-300"
                                            }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2">
                                            {mov.nome}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {format(new Date(mov.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== PAINEL IA ========== */}
            {iaAberto && !isArquivado && (
                <div className="px-5 pb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 rounded-xl border border-indigo-100/80 p-4 space-y-3">
                        {/* Header do painel */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200">
                                    <Sparkles size={12} />
                                </div>
                                <span className="text-[11px] font-bold text-indigo-900">Legal AI</span>
                            </div>
                            <button
                                onClick={() => { setIaAberto(false); setIaResultado(""); }}
                                className="p-1 hover:bg-indigo-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        {/* Botões de modo */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleIA('CLIENTE')}
                                disabled={iaLoading}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-[11px] transition-all border ${iaModo === 'CLIENTE' && (iaLoading || iaResultado)
                                    ? 'border-indigo-200 bg-indigo-100/80 text-indigo-700'
                                    : 'border-slate-200 hover:bg-white/80 text-slate-600'
                                    } disabled:opacity-50`}
                            >
                                {iaLoading && iaModo === 'CLIENTE' ? <Loader2 className="animate-spin" size={12} /> : <UserCheck size={12} />}
                                Resumo Cliente
                            </button>
                            <button
                                onClick={() => handleIA('JURIDICO')}
                                disabled={iaLoading}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-[11px] transition-all border ${iaModo === 'JURIDICO' && (iaLoading || iaResultado)
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'border-slate-200 hover:bg-white/80 text-slate-600'
                                    } disabled:opacity-50`}
                            >
                                {iaLoading && iaModo === 'JURIDICO' ? <Loader2 className="animate-spin" size={12} /> : <Gavel size={12} />}
                                Base Legal
                            </button>
                        </div>

                        {/* Resultado */}
                        <div className="bg-white/70 rounded-lg p-3 border border-slate-100 min-h-[80px] max-h-[200px] overflow-y-auto">
                            {iaResultado ? (
                                <div className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700">
                                    {iaResultado.split('\n').map((line, i) => {
                                        const cleanLine = line.replace(/\*\*/g, '');
                                        const isTitle = line.includes('**');
                                        return (
                                            <div key={i} className={`mb-1.5 ${isTitle ? 'font-bold text-slate-900 mt-2' : ''}`}>
                                                {cleanLine}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 py-4">
                                    <Brain size={28} strokeWidth={1.5} />
                                    <p className="text-[10px] font-medium mt-2 text-center max-w-[180px]">
                                        Escolha &quot;Resumo Cliente&quot; ou &quot;Base Legal&quot; para consultar a IA.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== FOOTER ========== */}
            <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs font-medium text-slate-600 truncate max-w-[55%]">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente</span>
                    <span className="font-bold text-slate-900 truncate">
                        {proc.cliente?.nome || "Sem cliente"}
                    </span>
                </div>
                {isArquivado && proc.arquivadoEm ? (
                    <div className="text-right">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Arquivado em</span>
                        <span className="text-[11px] font-bold text-slate-500">
                            {format(new Date(proc.arquivadoEm), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                    </div>
                ) : (
                    <div
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${isArquivado
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            }`}
                    >
                        {proc.fase}
                    </div>
                )}
            </div>
        </div>
    );
}
