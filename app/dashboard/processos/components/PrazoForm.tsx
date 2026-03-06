"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
import { useToast } from "@/app/dashboard/components/toast";

interface PrazoFormProps {
    processoId: string;
    onSuccess: () => void;
}

export function PrazoForm({ processoId, onSuccess }: PrazoFormProps) {
    const [titulo, setTitulo] = useState("");
    const [dataVencimento, setDataVencimento] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!titulo.trim() || !dataVencimento) {
            showToast("O título e a data de vencimento são obrigatórios.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/processos/${processoId}/prazos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titulo,
                    dataVencimento,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao criar prazo");
            }

            showToast("Prazo adicionado com sucesso!", "success");
            setTitulo("");
            setDataVencimento("");
            onSuccess();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Adicionar Novo Prazo</h4>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1.5">
                    <label htmlFor="titulo" className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Título</label>
                    <input
                        id="titulo"
                        placeholder="Ex: Contestação, Audiência..."
                        value={titulo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                    />
                </div>
                <div className="sm:w-40 space-y-1.5">
                    <label htmlFor="data" className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Vencimento</label>
                    <div className="relative">
                        <input
                            id="data"
                            type="date"
                            value={dataVencimento}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataVencimento(e.target.value)}
                            className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="h-9 inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto px-4 text-sm font-medium shadow transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} className="mr-1.5" />}
                        Salvar
                    </button>
                </div>
            </div>
        </form>
    );
}
