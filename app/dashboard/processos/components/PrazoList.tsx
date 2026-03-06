"use client";

import { format, isBefore, startOfDay, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, AlertCircle, Clock, CheckCircle2, CalendarIcon } from "lucide-react";
import { useToast } from "@/app/dashboard/components/toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Prazo {
    id: string;
    titulo: string;
    descricao: string | null;
    dataVencimento: string;
    concluido: boolean;
    dataConclusao: string | null;
}

interface PrazoListProps {
    prazos: Prazo[];
    onUpdate: () => void;
}

export function PrazoList({ prazos, onUpdate }: PrazoListProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const { showToast } = useToast();

    const toggleConclusao = async (prazo: Prazo) => {
        setLoadingId(prazo.id);
        try {
            const res = await fetch(`/api/prazos/${prazo.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ concluido: !prazo.concluido }),
            });
            if (!res.ok) throw new Error("Erro ao atualizar prazo");
            showToast(prazo.concluido ? "Prazo reaberto." : "Prazo concluído!", "success");
            onUpdate();
        } catch (error) {
            showToast("Erro ao alterar o status do prazo.", "error");
        } finally {
            setLoadingId(null);
        }
    };

    const deletePrazo = async (id: string) => {
        if (!confirm("Deseja realmente excluir este prazo?")) return;

        setLoadingId(id);
        try {
            const res = await fetch(`/api/prazos/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao excluir prazo");
            showToast("Prazo excluído.", "success");
            onUpdate();
        } catch (error) {
            showToast("Erro ao excluir prazo.", "error");
        } finally {
            setLoadingId(null);
        }
    };

    if (prazos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm font-medium">Nenhum prazo cadastrado.</p>
                <p className="text-xs mt-1 opacity-70">Adicione prazos para visualizá-los aqui.</p>
            </div>
        );
    }

    const hoje = startOfDay(new Date());

    return (
        <div className="space-y-3">
            {prazos.map(prazo => {
                const vencimento = startOfDay(new Date(prazo.dataVencimento));
                const isVencido = isBefore(vencimento, hoje) && !prazo.concluido;
                const isProximo = (isBefore(vencimento, addDays(hoje, 4)) || isSameDay(vencimento, hoje)) && !isVencido && !prazo.concluido;

                return (
                    <div
                        key={prazo.id}
                        className={cn(
                            "group flex items-center justify-between p-4 rounded-xl border transition-all",
                            prazo.concluido ? "bg-slate-50 border-slate-100 opacity-75" : "bg-white border-slate-200 shadow-sm hover:border-indigo-200",
                            isVencido && "border-red-200 bg-red-50/30",
                            isProximo && "border-orange-200 bg-orange-50/30"
                        )}
                    >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input
                                type="checkbox"
                                checked={prazo.concluido}
                                onChange={() => toggleConclusao(prazo)}
                                disabled={loadingId === prazo.id}
                                className={cn(
                                    "mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600",
                                    prazo.concluido && "accent-emerald-500",
                                    isVencido && !prazo.concluido && "border-red-400",
                                    isProximo && !prazo.concluido && "border-orange-400"
                                )}
                            />
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className={cn(
                                        "text-sm font-semibold truncate",
                                        prazo.concluido ? "text-slate-500 line-through" : "text-slate-800",
                                        isVencido && "text-red-700",
                                        isProximo && "text-orange-700"
                                    )}>
                                        {prazo.titulo}
                                    </h4>

                                    {!prazo.concluido && isVencido && (
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                            <AlertCircle size={10} /> Vencido
                                        </span>
                                    )}
                                    {!prazo.concluido && isProximo && (
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                                            <Clock size={10} /> Próximo
                                        </span>
                                    )}
                                    {prazo.concluido && (
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                            <CheckCircle2 size={10} /> Concluído
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                    <CalendarIcon size={12} className={cn(
                                        isVencido && "text-red-400",
                                        isProximo && "text-orange-400"
                                    )} />
                                    <span className={cn(
                                        (isVencido && !prazo.concluido) && "font-semibold text-red-600",
                                        (isProximo && !prazo.concluido) && "font-semibold text-orange-600"
                                    )}>
                                        {format(vencimento, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => deletePrazo(prazo.id)}
                            disabled={loadingId === prazo.id}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Excluir Prazo"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
