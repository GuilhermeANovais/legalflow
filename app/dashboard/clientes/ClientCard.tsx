"use client";

import {
    User, Building, Pencil, Trash2, Mail, Phone, MapPin, ShieldCheck, ChevronRight
} from "lucide-react";

interface Cliente {
    id: string;
    nome: string;
    tipo: string;
    documento: string;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
    status: string;
    documentos?: any[];
}

interface ClientCardProps {
    cliente: Cliente;
    onEdit: (cliente: Cliente) => void;
    onDelete: (cliente: Cliente, e: React.MouseEvent) => void;
    onOpenDetail: (cliente: Cliente) => void;
}

export default function ClientCard({
    cliente, onEdit, onDelete, onOpenDetail
}: ClientCardProps) {
    const isPF = cliente.tipo === "PF";

    return (
        <div
            onClick={() => onOpenDetail(cliente)}
            className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-100 cursor-pointer transition-all duration-300 group overflow-hidden hover:shadow-xl hover:shadow-slate-900/[0.06] hover:border-slate-300/80 hover:-translate-y-0.5"
        >
            {/* Faixa indicadora lateral */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${isPF
                ? "bg-gradient-to-b from-blue-500 via-blue-400 to-indigo-300"
                : "bg-gradient-to-b from-purple-500 via-purple-400 to-fuchsia-300"
                }`} />

            <div className="p-5 w-full h-full">
                {/* Cabeçalho */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isPF
                            ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                            : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                            }`}>
                            {isPF ? <User size={16} /> : <Building size={16} />}
                        </div>
                        {/* Status badge sutil */}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                            {cliente.status}
                        </span>
                    </div>

                    {/* Ações (Hover) */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(cliente); }}
                            className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Cliente"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={(e) => onDelete(cliente, e)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Cliente"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Corpo principal */}
                <div className="space-y-3">
                    <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-[1.35] tracking-[-0.01em]">
                        {cliente.nome}
                    </h3>

                    <div className="space-y-1.5">
                        {/* Documento */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <ShieldCheck size={11} className={isPF ? "text-blue-400" : "text-purple-400"} />
                            <span className="font-mono tracking-tight">{cliente.documento}</span>
                        </div>

                        {/* Email */}
                        {cliente.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Mail size={11} className="flex-shrink-0" />
                                <span className="truncate">{cliente.email}</span>
                            </div>
                        )}

                        {/* Telefone */}
                        {cliente.telefone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <Phone size={11} className="flex-shrink-0" />
                                <span>{cliente.telefone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Seta hover */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </div>
    );
}
