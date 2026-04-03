import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FolderOpen, Loader2, Building, Scale, AlertCircle } from "lucide-react";
import { DocumentUploader } from "@/app/dashboard/components/DocumentUploader";
import { useState, useEffect } from "react";

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

interface ProcessoVinculado {
    id: string;
    numero: string;
    titulo: string;
    area: string;
    fase: string;
    status: string;
    prioridade: string;
}


interface ClientDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCliente: Cliente | null;
    formData: any;
    setFormData: (data: any) => void;
    handleSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
}

export default function ClientDetailSheet({
    open,
    onOpenChange,
    editingCliente,
    formData,
    setFormData,
    handleSubmit,
    submitting,
}: ClientDetailSheetProps) {
    const isEditing = !!editingCliente;
    const isPF = formData.tipo === "PF";

    // Processos vinculados ao cliente
    const [processosCliente, setProcessosCliente] = useState<ProcessoVinculado[]>([]);
    const [loadingProcessos, setLoadingProcessos] = useState(false);

    useEffect(() => {
        if (isEditing && editingCliente) {
            setLoadingProcessos(true);
            fetch(`/api/processos?clienteId=${editingCliente.id}`)
                .then(r => r.json())
                .then(data => setProcessosCliente(Array.isArray(data) ? data.filter((p: ProcessoVinculado) => p) : []))
                .catch(() => setProcessosCliente([]))
                .finally(() => setLoadingProcessos(false));
        }
    }, [isEditing, editingCliente?.id]);


    const formatDocumento = (value: string, tipo: string) => {
        const numbers = value.replace(/\D/g, "");

        if (tipo === "PF") {
            const cpf = numbers.slice(0, 11);
            if (cpf.length > 9) return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            if (cpf.length > 6) return cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
            if (cpf.length > 3) return cpf.replace(/(\d{3})(\d{1,3})/, "$1.$2");
            return cpf;
        } else {
            const cnpj = numbers.slice(0, 14);
            if (cnpj.length > 12) return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
            if (cnpj.length > 8) return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
            if (cnpj.length > 5) return cnpj.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
            if (cnpj.length > 2) return cnpj.replace(/(\d{2})(\d{1,3})/, "$1.$2");
            return cnpj;
        }
    };

    const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, documento: formatDocumento(e.target.value, formData.tipo) });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white p-0 flex flex-col hide-scrollbar">
                <div className="flex-1 p-6 md:p-8">
                    <SheetHeader className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2.5 rounded-xl ${isPF ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {isPF ? <User size={20} /> : <Building size={20} />}
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {isEditing ? formData.nome || "Editar Cliente" : "Novo Cliente"}
                                </SheetTitle>
                                {isEditing && (
                                    <SheetDescription className="font-mono text-xs text-slate-500 mt-1">
                                        {formData.documento}
                                    </SheetDescription>
                                )}
                            </div>
                        </div>
                    </SheetHeader>

                    <Tabs defaultValue="dados" className="w-full">
                        {isEditing && (
                            <TabsList className="w-full grid grid-cols-3 mb-6">
                                <TabsTrigger value="dados" className="text-xs font-bold">
                                    <User size={14} className="mr-1.5" />
                                    Dados
                                </TabsTrigger>
                                <TabsTrigger value="processos" className="text-xs font-bold">
                                    <Scale size={14} className="mr-1.5" />
                                    Processos
                                </TabsTrigger>
                                <TabsTrigger value="documentos" className="text-xs font-bold">
                                    <FolderOpen size={14} className="mr-1.5" />
                                    Documentos
                                </TabsTrigger>
                            </TabsList>
                        )}

                        {/* ABA DADOS */}
                        <TabsContent value="dados" className="space-y-6 focus-visible:outline-none mt-0">
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[12px] uppercase tracking-wider font-extrabold text-slate-500 ml-1">Tipo</label>
                                            <select
                                                value={formData.tipo}
                                                onChange={(e) => {
                                                    const novoTipo = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        tipo: novoTipo,
                                                        documento: formatDocumento(formData.documento || "", novoTipo)
                                                    });
                                                }}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-sans"
                                                disabled={isEditing} // Geralmente o tipo não muda depois de criado
                                            >
                                                <option value="PF">Pessoa Física</option>
                                                <option value="PJ">Pessoa Jurídica</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] uppercase tracking-wider font-extrabold text-slate-500 ml-1">Documento</label>
                                            <input
                                                required
                                                value={formData.documento}
                                                onChange={handleDocumentoChange}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-mono"
                                                placeholder={isPF ? "000.000.000-00" : "00.000.000/0001-00"}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[12px] uppercase tracking-wider font-extrabold text-slate-500 ml-1">Nome Completo / Razão Social</label>
                                            <input
                                                required
                                                value={formData.nome}
                                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                                                placeholder=""
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] uppercase tracking-wider font-extrabold text-slate-500 ml-1">E-mail</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                                                placeholder="email@exemplo.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] uppercase tracking-wider font-extrabold text-slate-500 ml-1">WhatsApp</label>
                                            <input
                                                value={formData.telefone}
                                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                                                placeholder="(00) 90000-0000"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[12px] uppercase tracking-wider font-extrabold text-slate-500 ml-1">Endereço Completo</label>
                                            <input
                                                value={formData.endereco}
                                                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                                                placeholder="Rua, Número, Bairro, Cidade - UF"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => onOpenChange(false)}
                                            className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center gap-2 text-sm shadow-md"
                                        >
                                            {submitting && <Loader2 className="animate-spin" size={16} />}
                                            {isEditing ? "Salvar Alterações" : "Criar Cliente"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </TabsContent>

                        {/* ABA DOCUMENTOS */}
                        {isEditing && (
                            <TabsContent value="documentos" className="mt-0 focus-visible:outline-none">
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <DocumentUploader
                                        title="Documentos do Cliente"
                                        description={`Arraste arquivos ou clique para anexar ao dossiê de ${editingCliente.nome}.`}
                                        clienteId={editingCliente.id}
                                        documentosIniciais={editingCliente.documentos || []}
                                    />
                                </div>
                            </TabsContent>
                        )}

                        {/* ABA PROCESSOS VINCULADOS */}
                        {isEditing && (
                            <TabsContent value="processos" className="mt-0 focus-visible:outline-none">
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                                    <h3 className="text-[11px] uppercase font-black text-slate-400 tracking-wider">
                                        Processos Vinculados
                                    </h3>

                                    {loadingProcessos ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="animate-spin text-slate-300" size={24} />
                                        </div>
                                    ) : processosCliente.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400">
                                            <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs">Nenhum processo vinculado a este cliente.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {processosCliente.map(proc => (
                                                <div key={proc.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
                                                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                                        proc.status === "ATIVO" ? "bg-emerald-400" : "bg-slate-300"
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-semibold text-slate-800 truncate">
                                                            {proc.titulo}
                                                        </p>
                                                        <div className="flex gap-2 mt-0.5 flex-wrap">
                                                            <span className="text-[10px] font-mono text-slate-400">{proc.numero}</span>
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                                                                {proc.area}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">{proc.fase}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                        proc.prioridade === "URGENTE" ? "bg-red-100 text-red-600" :
                                                        proc.prioridade === "ALTA" ? "bg-amber-100 text-amber-600" :
                                                        "bg-slate-100 text-slate-500"
                                                    }`}>
                                                        {proc.prioridade === "MEDIA" ? "Normal" : proc.prioridade}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
