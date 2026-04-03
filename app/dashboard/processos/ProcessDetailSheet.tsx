"use client";

import {
    Scale, Calendar, RefreshCw, Gavel, MapPin, FileText,
    Monitor, Sparkles, Loader2, UserCheck, Brain, X,
    User, Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { consultarIA } from "@/app/actions";
import { DocumentUploader, DocumentInfo } from "@/app/dashboard/components/DocumentUploader";
import { PrazoTab } from "./components/PrazoTab";
import { AudienciasTab } from "./components/AudienciasTab";
import { FinanceiroTab } from "./components/FinanceiroTab";

import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
    valoresAnteriores?: string | null;
    valoresNovos?: string | null;
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
    documentos?: DocumentInfo[];
    parteAutora?: string | null;
    parteContraria?: string | null;
}

interface ProcessDetailSheetProps {
    processo: Processo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatarNumeroCNJ(numero: string): string {
    const clean = numero.replace(/\D/g, "");
    if (clean.length === 20) {
        return `${clean.slice(0, 7)}-${clean.slice(7, 9)}.${clean.slice(9, 13)}.${clean.slice(13, 14)}.${clean.slice(14, 16)}.${clean.slice(16, 20)}`;
    }
    return numero;
}

// ================================================
// ABA RESUMO
// ================================================
function TabResumo({ proc }: { proc: Processo }) {
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

    const hasCnjData = !!(proc.tribunal || proc.classeProcessual);

    return (
        <div className="space-y-5">
            {/* Detalhes CNJ */}
            {hasCnjData && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-100/80 p-4">
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">
                        Dados do CNJ
                    </h4>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                        {proc.classeProcessual && (
                            <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                    <Gavel size={9} /> Classe
                                </span>
                                <p className="text-[12px] font-semibold text-slate-700 leading-snug mt-0.5">
                                    {proc.classeProcessual}
                                </p>
                            </div>
                        )}
                        {proc.assuntoPrincipal && (
                            <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                    <FileText size={9} /> Assunto
                                </span>
                                <p className="text-[12px] font-semibold text-slate-700 leading-snug mt-0.5">
                                    {proc.assuntoPrincipal}
                                </p>
                            </div>
                        )}
                        {proc.orgaoJulgador && (
                            <div className="col-span-2">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                    <MapPin size={9} /> Órgão Julgador
                                </span>
                                <p className="text-[12px] font-semibold text-slate-700 leading-snug mt-0.5">
                                    {proc.orgaoJulgador}
                                </p>
                            </div>
                        )}
                        {proc.tribunal && (
                            <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                    <Monitor size={9} /> Tribunal
                                </span>
                                <p className="text-[12px] font-semibold text-slate-700 mt-0.5">
                                    {[proc.tribunal, proc.sistema].filter(Boolean).join(" • ")}
                                </p>
                            </div>
                        )}
                        {proc.dataAjuizamento && (
                            <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                    <Calendar size={9} /> Ajuizamento
                                </span>
                                <p className="text-[12px] font-semibold text-slate-700 mt-0.5">
                                    {format(new Date(proc.dataAjuizamento), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Última Sincronização */}
            {proc.sincronizadoEm && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <RefreshCw size={12} className="text-blue-400" />
                    Última sinc.: {format(new Date(proc.sincronizadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
            )}

            {/* Dados do Cliente */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                    <User size={10} /> Cliente
                </h4>
                <p className="text-sm font-bold text-slate-900">
                    {proc.cliente?.nome || "Sem cliente vinculado"}
                </p>
                {proc.cliente?.telefone && (
                    <p className="text-[11px] text-slate-500 mt-1">
                        Tel: {proc.cliente.telefone}
                    </p>
                )}
            </div>

            {/* Informações do Processo */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-slate-100 p-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Área</span>
                    <p className="text-[12px] font-bold text-slate-800 mt-0.5">{proc.area}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Fase</span>
                    <p className="text-[12px] font-bold text-slate-800 mt-0.5">{proc.fase}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Prioridade</span>
                    <p className={`text-[12px] font-bold mt-0.5 ${proc.prioridade === "Urgente" ? "text-red-600" : proc.prioridade === "Alta" ? "text-orange-600" : "text-slate-600"}`}>
                        {proc.prioridade}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Valor da Causa</span>
                    <p className="text-[12px] font-bold text-slate-800 mt-0.5">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(proc.valorCausa || 0)}
                    </p>
                </div>
                {proc.dataPrazo && (
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                            <Clock size={9} /> Prazo
                        </span>
                        <p className="text-[12px] font-bold text-slate-800 mt-0.5">
                            {format(new Date(proc.dataPrazo), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                    </div>
                )}
            </div>

            {/* Partes do processo */}
            {(proc.parteAutora || proc.parteContraria) && (
                <div className="bg-white rounded-xl border border-slate-100 p-4">
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">Partes</h4>
                    <div className="space-y-2">
                        {proc.parteAutora && (
                            <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex-shrink-0">Autor</span>
                                <span className="text-[12px] font-semibold text-slate-700">{proc.parteAutora}</span>
                            </div>
                        )}
                        {proc.parteContraria && (
                            <div className="flex items-start gap-2">
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex-shrink-0">Réu</span>
                                <span className="text-[12px] font-semibold text-slate-700">{proc.parteContraria}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Painel IA */}
            {proc.status !== "ARQUIVADO" && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 rounded-xl border border-indigo-100/80 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200">
                                <Sparkles size={12} />
                            </div>
                            <span className="text-[11px] font-bold text-indigo-900">Legal AI</span>
                        </div>
                        {iaResultado && (
                            <button
                                onClick={() => { setIaAberto(false); setIaResultado(""); }}
                                className="p-1 hover:bg-indigo-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

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

                    <div className="bg-white/70 rounded-lg p-3 border border-slate-100 min-h-[80px] max-h-[300px] overflow-y-auto">
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
            )}
        </div>
    );
}

function parseMudancas(jsonStr?: string | null) {
    if (!jsonStr) return null;
    try {
        return JSON.parse(jsonStr) as Record<string, any>;
    } catch {
        return null;
    }
}

// ================================================
// ABA MOVIMENTAÇÕES
// ================================================
function TabMovimentacoes({ proc }: { proc: Processo }) {
    const movimentacoes = proc.movimentacoes || [];
    const historico = proc.historico || [];

    return (
        <div className="space-y-6">
            {/* Movimentações CNJ */}
            <div>
                <h4 className="text-[10px] uppercase font-black text-blue-500 tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Movimentações CNJ ({movimentacoes.length})
                </h4>

                {movimentacoes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Scale className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">Nenhuma movimentação registrada.</p>
                        <p className="text-[10px] mt-1">Sincronize o processo para buscar do CNJ.</p>
                    </div>
                ) : (
                    <div className="relative pl-4 space-y-3 max-h-[400px] overflow-y-auto">
                        <div className="absolute left-[5px] top-1 bottom-3 w-px bg-gradient-to-b from-blue-300 via-slate-200 to-transparent" />

                        {movimentacoes.map((mov, idx) => (
                            <div key={mov.id || idx} className="relative flex gap-3">
                                <div
                                    className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 ${idx === 0
                                        ? "bg-blue-500 border-blue-300 shadow-[0_0_6px_rgba(59,130,246,0.4)]"
                                        : "bg-white border-slate-300"
                                        }`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-semibold text-slate-700 leading-snug">
                                        {mov.nome}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {format(new Date(mov.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Histórico do Sistema */}
            {historico.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] uppercase font-black text-emerald-500 tracking-wider mb-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Histórico do Sistema ({historico.length})
                    </h4>

                    <div className="relative pl-4 space-y-3 max-h-[300px] overflow-y-auto">
                        <div className="absolute left-[5px] top-1 bottom-3 w-px bg-gradient-to-b from-emerald-300 via-slate-200 to-transparent" />

                        {historico.map((hist, idx) => (
                            <div key={hist.id} className="relative flex gap-3">
                                <div
                                    className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 ${idx === 0
                                        ? "bg-emerald-500 border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                                        : "bg-white border-slate-300"
                                        }`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-semibold text-slate-700 leading-snug line-clamp-2">
                                        {hist.descricao}
                                    </p>
                                    {(() => {
                                        const ant = parseMudancas(hist.valoresAnteriores);
                                        const nov = parseMudancas(hist.valoresNovos);
                                        if (!ant || !nov) return null;

                                        const chaves = Object.keys(nov).filter(k =>
                                            !['updatedAt', 'id', 'tenantId', 'processoId', 'createdAt'].includes(k) &&
                                            ant[k] !== nov[k]
                                        );

                                        if (chaves.length === 0) return null;

                                        return (
                                            <div className="mt-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1.5">
                                                <p className="font-semibold text-slate-500 mb-1">Detalhes da alteração:</p>
                                                {chaves.map((key) => {
                                                    const de = ant[key];
                                                    const para = nov[key];

                                                    const formatValor = (v: any) => {
                                                        if (v === null || v === undefined || v === '') return <span className="text-slate-400 italic">vazio</span>;
                                                        if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
                                                        if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) {
                                                            try {
                                                                return format(new Date(v), "dd/MM/yyyy", { locale: ptBR });
                                                            } catch {
                                                                return v;
                                                            }
                                                        }
                                                        return String(v);
                                                    };

                                                    return (
                                                        <div key={key} className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] gap-2 items-start text-slate-600">
                                                            <span className="font-medium text-slate-700 capitalize">
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </span>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                                <span className="line-through text-slate-400">{formatValor(de)}</span>
                                                                <span className="hidden sm:inline text-slate-300">→</span>
                                                                <span className="font-medium text-emerald-600">{formatValor(para)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {format(new Date(hist.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ================================================
// ABA DOCUMENTOS
// ================================================
function TabDocumentos({ proc }: { proc: Processo }) {
    return (
        <div>
            <DocumentUploader
                title="Documentos do Processo"
                description="Gerencie petições, procurações e provas deste processo."
                processoId={proc.id}
                documentosIniciais={proc.documentos || []}
            />
        </div>
    );
}

// ================================================
// SHEET PRINCIPAL
// ================================================
export default function ProcessDetailSheet({
    processo,
    open,
    onOpenChange,
}: ProcessDetailSheetProps) {
    if (!processo) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl overflow-y-auto p-0"
                showCloseButton={true}
            >
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white sticky top-0 z-10">
                    <SheetTitle className="text-lg font-bold text-slate-900 leading-snug pr-8">
                        {processo.titulo}
                    </SheetTitle>
                    <SheetDescription asChild>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                <Scale size={11} className="text-blue-500 flex-shrink-0" />
                                {formatarNumeroCNJ(processo.numero)}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${processo.status === "ARQUIVADO"
                                ? "bg-slate-700 text-white border-slate-600"
                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                }`}>
                                {processo.status === "ARQUIVADO"
                                    ? `Arquivado — ${processo.resultado || "Sem resultado"}`
                                    : processo.fase
                                }
                            </span>
                        </div>
                    </SheetDescription>
                </SheetHeader>

                {/* Tabs */}
                <div className="px-6 py-4">
                    <Tabs defaultValue="resumo">
                        <TabsList className="w-full grid border-b border-slate-100 flex overflow-x-auto no-scrollbar scroll-smooth" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
                            <TabsTrigger value="resumo" className="text-xs font-bold">
                                Resumo
                            </TabsTrigger>
                            <TabsTrigger value="movimentacoes" className="text-xs font-bold">
                                Movimentações
                            </TabsTrigger>
                            <TabsTrigger value="documentos" className="text-xs font-bold">
                                Documentos
                            </TabsTrigger>
                            <TabsTrigger value="prazos" className="text-xs font-bold">
                                Prazos
                            </TabsTrigger>
                            <TabsTrigger value="audiencias" className="text-xs font-bold">
                                Audiências
                            </TabsTrigger>
                            <TabsTrigger value="financeiro" className="text-xs font-bold">
                                Financeiro
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="resumo">
                            <TabResumo proc={processo} />
                        </TabsContent>

                        <TabsContent value="movimentacoes">
                            <TabMovimentacoes proc={processo} />
                        </TabsContent>

                        <TabsContent value="documentos">
                            <TabDocumentos proc={processo} />
                        </TabsContent>

                        <TabsContent value="prazos">
                            <PrazoTab processoId={processo.id} movimentacoes={processo.movimentacoes} />
                        </TabsContent>

                        <TabsContent value="audiencias">
                            <AudienciasTab processoId={processo.id} />
                        </TabsContent>

                        <TabsContent value="financeiro">
                            <FinanceiroTab processoId={processo.id} clienteId={processo.clienteId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
