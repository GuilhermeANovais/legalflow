"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, User, MapPin, Phone, Mail, 
  Loader2, Building, ShieldCheck 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PF",
    documento: "",
    email: "",
    telefone: "",
    endereco: ""
  });

  // Buscar clientes ao carregar
  useEffect(() => {
    fetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      const novoCliente = await res.json();
      setClientes([novoCliente, ...clientes]); // Atualiza lista local
      setIsModalOpen(false);
      setFormData({ nome: "", tipo: "PF", documento: "", email: "", telefone: "", endereco: "" }); // Limpa form
      router.refresh();
    } catch (error) {
      alert("Erro ao criar cliente");
    } finally {
      setSubmitting(false);
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
          onClick={() => setIsModalOpen(true)}
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
            <div key={cliente.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${cliente.tipo === 'PF' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {cliente.tipo === 'PF' ? <User size={24} /> : <Building size={24} />}
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase">
                  {cliente.status}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-1">{cliente.nome}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <ShieldCheck size={14} className="text-emerald-500" />
                {cliente.documento}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-50">
                {cliente.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail size={16} className="text-slate-400" /> {cliente.email}
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone size={16} className="text-slate-400" /> {cliente.telefone}
                  </div>
                )}
                {cliente.endereco && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin size={16} className="text-slate-400" /> 
                    <span className="truncate">{cliente.endereco}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-bold mb-6">Novo Cliente</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tipo</label>
                  <select 
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-slate-50"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Documento (CPF/CNPJ)</label>
                  <input 
                    required
                    value={formData.documento}
                    onChange={(e) => setFormData({...formData, documento: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-slate-50"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                  <input 
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-slate-50"
                    placeholder="Nome do cliente ou Razão Social"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">E-mail</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">WhatsApp / Telefone</label>
                  <input 
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-slate-50"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Endereço Completo</label>
                  <input 
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-slate-50"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
