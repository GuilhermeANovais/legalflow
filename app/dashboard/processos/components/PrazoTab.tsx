"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, CalendarDays } from "lucide-react";
import { PrazoForm } from "./PrazoForm";
import { PrazoList, Prazo } from "./PrazoList";
import { verificarRadarPrazos } from "@/lib/radarPrazos";

interface Movimentacao {
    id: string;
    nome: string;
    dataHora: string;
    codigo: number;
}

interface PrazoTabProps {
    processoId: string;
    movimentacoes?: Movimentacao[];
}

export function PrazoTab({ processoId, movimentacoes = [] }: PrazoTabProps) {
    const [prazos, setPrazos] = useState<Prazo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPrazos = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/processos/${processoId}/prazos`);
            if (res.ok) {
                const data = await res.json();
                setPrazos(data);
            }
        } catch (error) {
            console.error("Erro ao buscar prazos", error);
        } finally {
            setIsLoading(false);
        }
    }, [processoId]);

    useEffect(() => {
        fetchPrazos();
    }, [fetchPrazos]);

    const temAlerta = verificarRadarPrazos(movimentacoes);

    return (
        <div className="space-y-6">
            {/* Radar de Prazos */}
            {temAlerta && (
                <div className="bg-amber-50 border border-orange-200 rounded-xl p-4 flex gap-3 shadow-sm">
                    <AlertTriangle className="text-orange-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-orange-800">Possível Prazo Identificado</h4>
                        <p className="text-xs text-orange-700 leading-snug mt-1">
                            O radar identificou movimentações automáticas recentes com palavras como "Intimação" ou "Prazo".
                            Verifique o conteúdo completo e cadastre a tarefa abaixo se necessário.
                        </p>
                    </div>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <CalendarDays className="text-indigo-600 w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-800">Controle de Prazos</h3>
            </div>

            {/* Formulário */}
            <PrazoForm processoId={processoId} onSuccess={fetchPrazos} />

            {/* Lista */}
            <div className="pt-2">
                <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-3">
                    Próximas Tarefas e Prazos
                </h4>

                {isLoading ? (
                    <div className="flex justify-center p-8 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <PrazoList prazos={prazos} onUpdate={fetchPrazos} />
                )}
            </div>
        </div>
    );
}
