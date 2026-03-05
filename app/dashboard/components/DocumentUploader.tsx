"use client";

import { useState, useRef } from "react";
import {
    UploadCloud, FileText, Image as ImageIcon,
    FileCheck, Download, Trash2, FileIcon, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { uploadDocument, getDownloadUrl, deleteDocument } from "@/app/actions/documentos";

export interface DocumentInfo {
    id: string;
    nomeOriginal: string;
    tamanhoBytes: number;
    tipoMime: string;
    criadoEm: string | Date;
    fileKey: string;
}

interface DocumentUploaderProps {
    documentosIniciais?: DocumentInfo[];
    title?: string;
    description?: string;
    clienteId?: string | null;
    processoId?: string | null;
}

export function DocumentUploader({
    documentosIniciais = [],
    title = "Documentos Anexados",
    description = "Faça o upload de RG, CNH, procurações e outros documentos relevantes.",
    clienteId = null,
    processoId = null
}: DocumentUploaderProps) {
    const [documentos, setDocumentos] = useState<DocumentInfo[]>(documentosIniciais);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Formatar tamanho do arquivo
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Ícone baseado no tipo MIME
    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes("pdf")) return <FileText className="text-red-500" size={24} />;
        if (mimeType.includes("image")) return <ImageIcon className="text-blue-500" size={24} />;
        if (mimeType.includes("word")) return <FileCheck className="text-blue-700" size={24} />;
        return <FileIcon className="text-slate-500" size={24} />;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await realUpload(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await realUpload(Array.from(e.target.files));
        }
    };

    const realUpload = async (files: File[]) => {
        setIsUploading(true);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                if (clienteId) formData.append("clienteId", clienteId);
                if (processoId) formData.append("processoId", processoId);

                const result = await uploadDocument(formData);
                if (result.success && result.documento) {
                    setDocumentos(prev => [result.documento as unknown as DocumentInfo, ...prev]);
                } else {
                    console.error("Erro no upload:", result.error);
                    alert("Erro ao enviar o arquivo: " + file.name);
                }
            }
        } catch (error) {
            console.error("Erro crítico:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este documento?")) return;

        try {
            const res = await deleteDocument(id);
            if (res.success) {
                setDocumentos(prev => prev.filter(doc => doc.id !== id));
            } else {
                alert("Falha ao excluir o documento.");
            }
        } catch (e) {
            alert("Erro ao excluir.");
        }
    };

    const handleDownload = async (doc: DocumentInfo) => {
        if (!doc.fileKey) return;
        try {
            const res = await getDownloadUrl(doc.fileKey);
            if (res.success && res.url) {
                // Abre em nova aba para download ou visualização
                window.open(res.url, "_blank");
            } else {
                alert("Não foi possível gerar o link de download.");
            }
        } catch (error) {
            alert("Erro ao tentar baixar o documento.");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500">{description}</p>
            </div>

            {/* Drag & Drop Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.01]"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
            >
                <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    {isUploading ? (
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                    ) : (
                        <UploadCloud className="text-slate-400" size={24} />
                    )}
                </div>

                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    {isUploading ? "Enviando arquivos..." : "Clique ou arraste arquivos para esta área"}
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                    Suporta PDF, DOCX, JPG, PNG. Tamanho máximo recomendado por arquivo: 10MB (S3).
                </p>

                <button
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    Selecionar Arquivos
                </button>
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Lista de Documentos */}
            {documentos.length > 0 && (
                <div className="space-y-3 pt-2">
                    {documentos.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="p-2 bg-slate-50 rounded-lg">
                                {getFileIcon(doc.tipoMime)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    {doc.nomeOriginal}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span>{formatBytes(doc.tamanhoBytes)}</span>
                                    <span>•</span>
                                    <span>
                                        Enviado em {format(new Date(doc.criadoEm), "dd MMM yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDownload(doc)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Baixar Arquivo"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir Arquivo"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
