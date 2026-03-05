"use client";

import { useState, useEffect } from "react";
import {
  Plus, User, MapPin, Phone, Mail,
  Loader2, Building, ShieldCheck, Pencil, Trash2, AlertTriangle, FolderOpen
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ToastProvider, useToast } from "@/app/dashboard/components/toast";
import ClientCard from "./ClientCard";
import ClientDetailSheet from "./ClientDetailSheet";

function ClientesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado de edição
  const [editingCliente, setEditingCliente] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"dados" | "documentos">("dados");

  // Estado do AlertDialog de exclusão
  const [deletingCliente, setDeletingCliente] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estado do Formulário
  const emptyForm = {
    nome: "",
    tipo: "PF",
    documento: "",
    email: "",
    telefone: "",
    endereco: ""
  };
  const [formData, setFormData] = useState(emptyForm);

  // Buscar clientes ao carregar
  const fetchClientes = () => {
    setLoading(true);
    fetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Abrir modal de edição
  const handleOpenEdit = (cliente: any) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome || "",
      tipo: cliente.tipo || "PF",
      documento: cliente.documento || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      endereco: cliente.endereco || "",
    });
    setIsModalOpen(true);
  };

  // Abrir modal de criação
  const handleOpenCreate = () => {
    setEditingCliente(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    setFormData(emptyForm);
    setActiveTab("dados");
  };

  // Submeter (criar ou editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingCliente) {
        // PATCH — Editar
        const res = await fetch(`/api/clientes/${editingCliente.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error();

        setClientes((prev) =>
          prev.map((c) => (c.id === editingCliente.id ? { ...c, ...formData } : c))
        );
        showToast("Cliente atualizado com sucesso!", "success");
      } else {
        // POST — Criar
        const res = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error();

        const novoCliente = await res.json();
        setClientes([novoCliente, ...clientes]);
        showToast("Cliente criado com sucesso!", "success");
      }

      handleCloseModal();
      router.refresh();
    } catch {
      showToast("Erro ao salvar cliente.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir
  const handleDelete = async () => {
    if (!deletingCliente) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/clientes/${deletingCliente.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Erro ao apagar cliente.", "error");
        setDeletingCliente(null);
        setDeleting(false);
        return;
      }

      setClientes((prev) => prev.filter((c) => c.id !== deletingCliente.id));
      showToast("Cliente apagado com sucesso!", "success");
      setDeletingCliente(null);
    } catch {
      showToast("Erro ao apagar cliente.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Clientes</h2>
          <p className="text-slate-500">Cadastre e gerencie sua base de contatos.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : clientes.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum cliente encontrado</h3>
          <p className="text-slate-500">Comece adicionando o primeiro cliente da sua carteira.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <ClientCard
              key={cliente.id}
              cliente={cliente}
              onEdit={handleOpenEdit}
              onDelete={(c, e) => { e.stopPropagation(); setDeletingCliente(c); }}
              onOpenDetail={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Sheet de Criação / Edição de Cliente */}
      <ClientDetailSheet
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
          else setIsModalOpen(true);
        }}
        editingCliente={editingCliente}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* AlertDialog de Confirmação de Exclusão */}
      {deletingCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão</h3>
                <p className="text-xs text-slate-500">Esta ação é irreversível</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Tem a certeza que deseja apagar <strong>{deletingCliente.nome}</strong>?
              Todos os dados deste cliente serão perdidos permanentemente.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingCliente(null)}
                disabled={deleting}
                className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting && <Loader2 className="animate-spin" size={14} />}
                Apagar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientesPage() {
  return (
    <ToastProvider>
      <ClientesContent />
    </ToastProvider>
  );
}
