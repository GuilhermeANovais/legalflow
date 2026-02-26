"use client";

import { useState, useEffect } from "react";
import {
  Plus, Scale, Loader2, Wand2, X,
  Calendar, RefreshCw, UserPlus, Users, Shield
} from "lucide-react";
import { buscarDadosCNJ } from "@/app/actions";
import { ToastProvider, useToast } from "@/app/dashboard/components/toast";
import ProcessCard from "./ProcessCard";

// Definição de tipos
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
  clienteId: string;
  polo?: string;
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

function ProcessosContent() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buscandoCNJ, setBuscandoCNJ] = useState(false);
  const [sincronizando, setSincronizando] = useState<Record<string, boolean>>({});
  const [isNovoCliente, setIsNovoCliente] = useState(false);

  const { showToast } = useToast();

  // Estado do Formulário (com campos CNJ extras)
  const [formData, setFormData] = useState({
    titulo: "",
    numero: "",
    clienteId: "",
    polo: "ATIVO",
    area: "Cível",
    prioridade: "Normal",
    valorCausa: "",
    fase: "Inicial",
    dataPrazo: "",
    // Campos de novo cliente inline
    novoClienteNome: "",
    novoClienteDocumento: "",
    novoClienteTipo: "PF",
    // Campos CNJ
    tribunal: "",
    orgaoJulgador: "",
    classeProcessual: "",
    assuntoPrincipal: "",
    sistema: "",
    dataAjuizamento: "",
  });

  // Carregar dados ao iniciar
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/processos").then(res => res.json()),
      fetch("/api/clientes").then(res => res.json())
    ]).then(([procData, cliData]) => {
      setProcessos(procData);
      setClientes(cliData);
      setLoading(false);
    }).catch(err => {
      console.error("Erro ao carregar dados:", err);
      setLoading(false);
    });
  };

  // --- AÇÕES DO USUÁRIO ---

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este processo? Essa ação é irreversível.")) return;

    setProcessos(prev => prev.filter(p => p.id !== id));

    try {
      await fetch(`/api/processos?id=${id}`, { method: "DELETE" });
      showToast("Processo excluído com sucesso.", "success");
    } catch (error) {
      showToast("Erro ao excluir no servidor.", "error");
      carregarDados();
    }
  };

  const handlePrioridadeChange = async (id: string, novaPrioridade: string) => {
    setProcessos(prev => prev.map(p => p.id === id ? { ...p, prioridade: novaPrioridade } : p));

    try {
      await fetch("/api/processos", {
        method: "PATCH",
        body: JSON.stringify({ id, prioridade: novaPrioridade }),
      });
    } catch (error) {
      showToast("Erro ao atualizar prioridade.", "error");
    }
  };

  const handleConcluir = async (id: string, resultado: string) => {
    setProcessos(prev => prev.map(p => p.id === id ? { ...p, status: "ARQUIVADO", resultado } : p));

    try {
      await fetch("/api/processos", {
        method: "PATCH",
        body: JSON.stringify({ id, status: "ARQUIVADO", resultado })
      });
      showToast(`Processo concluído como "${resultado}".`, "success");
    } catch (error) {
      showToast("Erro ao arquivar processo.", "error");
    }
  };

  const handleWhatsApp = (telefone: string | null | undefined, nome: string | undefined) => {
    if (!telefone) {
      showToast("Cliente sem telefone cadastrado.", "error");
      return;
    }
    const numero = telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${numero}?text=Olá ${nome}, tudo bem? Gostaria de falar sobre o andamento do seu processo.`, "_blank");
  };

  // Buscar no CNJ (Modal de criação)
  const handleBuscaCNJ = async () => {
    if (!formData.numero || formData.numero.replace(/\D/g, "").length < 20) {
      showToast("Digite o número completo do processo (20 dígitos).", "error");
      return;
    }

    setBuscandoCNJ(true);
    const res = await buscarDadosCNJ(formData.numero);
    setBuscandoCNJ(false);

    if (res.found && res.dados) {
      setFormData(prev => ({
        ...prev,
        titulo: res.dados!.titulo,
        area: res.dados!.area,
        fase: res.dados!.fase,
        valorCausa: res.dados!.valorCausa.toString(),
        prioridade: res.dados!.prioridade,
        // Campos CNJ extras
        tribunal: res.dados!.tribunal,
        orgaoJulgador: res.dados!.orgaoJulgador,
        classeProcessual: res.dados!.classeProcessual,
        assuntoPrincipal: res.dados!.assuntoPrincipal,
        sistema: res.dados!.sistema,
        dataAjuizamento: res.dados!.dataAjuizamento || "",
      }));
      showToast(`Processo localizado no ${res.dados.tribunal}! Campos preenchidos automaticamente.`, "success");
    } else {
      showToast(res.error || "Processo não encontrado na base do CNJ.", "error");
    }
  };

  // Sincronizar CNJ (Processo já existente)
  const handleSincronizarCNJ = async (processoId: string) => {
    setSincronizando(prev => ({ ...prev, [processoId]: true }));
    showToast("Sincronização em andamento. Os dados e movimentações serão atualizados em breve.", "info");

    try {
      const res = await fetch("/api/processos/sincronizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processoId }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Erro ao sincronizar.", "error");
      } else {
        setTimeout(() => {
          carregarDados();
          showToast("Sincronização concluída! Dados atualizados.", "success");
        }, 3000);
      }
    } catch (error) {
      showToast("Erro ao conectar com o servidor.", "error");
    } finally {
      setTimeout(() => {
        setSincronizando(prev => ({ ...prev, [processoId]: false }));
      }, 3000);
    }
  };

  // Salvar Novo Processo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Monta payload dependendo se é novo cliente ou existente
      const payload: Record<string, unknown> = {
        titulo: formData.titulo,
        numero: formData.numero,
        polo: formData.polo,
        area: formData.area,
        prioridade: formData.prioridade,
        valorCausa: formData.valorCausa,
        fase: formData.fase,
        dataPrazo: formData.dataPrazo,
        tribunal: formData.tribunal,
        orgaoJulgador: formData.orgaoJulgador,
        classeProcessual: formData.classeProcessual,
        assuntoPrincipal: formData.assuntoPrincipal,
        sistema: formData.sistema,
        dataAjuizamento: formData.dataAjuizamento,
      };

      if (isNovoCliente) {
        payload.novoCliente = {
          nome: formData.novoClienteNome,
          documento: formData.novoClienteDocumento,
          tipo: formData.novoClienteTipo,
        };
      } else {
        payload.clienteId = formData.clienteId;
      }

      const res = await fetch("/api/processos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      setIsModalOpen(false);
      setIsNovoCliente(false);
      setFormData({
        titulo: "", numero: "", clienteId: "", polo: "ATIVO", area: "Cível",
        prioridade: "Normal", valorCausa: "", fase: "Inicial", dataPrazo: "",
        novoClienteNome: "", novoClienteDocumento: "", novoClienteTipo: "PF",
        tribunal: "", orgaoJulgador: "", classeProcessual: "",
        assuntoPrincipal: "", sistema: "", dataAjuizamento: "",
      });
      carregarDados();
      showToast(isNovoCliente ? "Processo e cliente cadastrados com sucesso!" : "Processo cadastrado com sucesso!", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar processo.", "error");
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setIsNovoCliente(false);
    setFormData({
      titulo: "", numero: "", clienteId: "", polo: "ATIVO", area: "Cível",
      prioridade: "Normal", valorCausa: "", fase: "Inicial", dataPrazo: "",
      novoClienteNome: "", novoClienteDocumento: "", novoClienteTipo: "PF",
      tribunal: "", orgaoJulgador: "", classeProcessual: "",
      assuntoPrincipal: "", sistema: "", dataAjuizamento: "",
    });
  };

  const hasCnjPreview = !!(formData.tribunal || formData.classeProcessual);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Processos</h2>
          <p className="text-slate-500">Gestão inteligente de casos judiciais e prazos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Novo Processo
        </button>
      </div>

      {/* Grid de Cards */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : processos.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
          <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum processo ativo</h3>
          <p className="text-slate-500">Cadastre seu primeiro caso para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processos.map((proc) => (
            <ProcessCard
              key={proc.id}
              proc={proc}
              isSyncing={sincronizando[proc.id] || false}
              onDelete={handleDelete}
              onPrioridadeChange={handlePrioridadeChange}
              onConcluir={handleConcluir}
              onWhatsApp={handleWhatsApp}
              onSincronizar={handleSincronizarCNJ}
            />
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Novo Processo</h3>
              <button onClick={resetModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CNJ com Busca */}
              <div>
                <label className="text-sm font-bold text-slate-700">Número do Processo (CNJ)</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.numero}
                    onChange={e => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                  <button
                    type="button"
                    onClick={handleBuscaCNJ}
                    disabled={buscandoCNJ}
                    className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    title="Autopreencher com dados do CNJ"
                  >
                    {buscandoCNJ ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Use a varinha mágica para buscar dados do CNJ (20 dígitos).</p>
              </div>

              {/* Skeleton de Loading CNJ */}
              {buscandoCNJ && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
                    <RefreshCw size={14} className="animate-spin" />
                    Consultando base do CNJ...
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-blue-200/50 rounded-full w-3/4" />
                    <div className="h-3 bg-blue-200/50 rounded-full w-1/2" />
                    <div className="h-3 bg-blue-200/50 rounded-full w-2/3" />
                  </div>
                </div>
              )}

              {/* Preview dos Dados CNJ (quando preenchidos) */}
              {hasCnjPreview && !buscandoCNJ && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-100 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                    <Scale size={14} />
                    Dados do CNJ preenchidos
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {formData.tribunal && (
                      <div>
                        <span className="text-slate-400 font-bold">Tribunal:</span>
                        <span className="ml-1 font-semibold text-slate-700">{formData.tribunal}</span>
                      </div>
                    )}
                    {formData.sistema && (
                      <div>
                        <span className="text-slate-400 font-bold">Sistema:</span>
                        <span className="ml-1 font-semibold text-slate-700">{formData.sistema}</span>
                      </div>
                    )}
                    {formData.classeProcessual && (
                      <div className="col-span-2">
                        <span className="text-slate-400 font-bold">Classe:</span>
                        <span className="ml-1 font-semibold text-slate-700">{formData.classeProcessual}</span>
                      </div>
                    )}
                    {formData.assuntoPrincipal && (
                      <div className="col-span-2">
                        <span className="text-slate-400 font-bold">Assunto:</span>
                        <span className="ml-1 font-semibold text-slate-700">{formData.assuntoPrincipal}</span>
                      </div>
                    )}
                    {formData.orgaoJulgador && (
                      <div className="col-span-2">
                        <span className="text-slate-400 font-bold">Órgão:</span>
                        <span className="ml-1 font-semibold text-slate-700">{formData.orgaoJulgador}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="text-sm font-bold text-slate-700">Título da Ação</label>
                <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Ação de Cobrança vs Empresa X"
                />
              </div>

              {/* Polo de Atuação */}
              <div>
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Shield size={14} className="text-slate-400" />
                  Polo de Atuação
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, polo: "ATIVO" })}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${formData.polo === "ATIVO"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    <div className="text-xs opacity-70 mb-0.5">Polo Ativo</div>
                    Autor / Exequente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, polo: "PASSIVO" })}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${formData.polo === "PASSIVO"
                        ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    <div className="text-xs opacity-70 mb-0.5">Polo Passivo</div>
                    Réu / Executado
                  </button>
                </div>
              </div>

              {/* Cliente - Toggle entre existente e novo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    {isNovoCliente ? <UserPlus size={14} className="text-blue-500" /> : <Users size={14} className="text-slate-400" />}
                    Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNovoCliente(!isNovoCliente);
                      // Limpa campos ao alternar
                      setFormData(prev => ({
                        ...prev,
                        clienteId: "",
                        novoClienteNome: "",
                        novoClienteDocumento: "",
                        novoClienteTipo: "PF",
                      }));
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${isNovoCliente
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                  >
                    {isNovoCliente ? (
                      <><Users size={12} /> Selecionar Existente</>
                    ) : (
                      <><UserPlus size={12} /> + Novo Cliente</>
                    )}
                  </button>
                </div>

                {!isNovoCliente ? (
                  /* Select de cliente existente */
                  <select
                    required
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.clienteId}
                    onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                ) : (
                  /* Sub-formulário inline de novo cliente */
                  <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Dados do Novo Cliente</div>
                    <div>
                      <input
                        required
                        className="w-full p-3 bg-white rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={formData.novoClienteNome}
                        onChange={e => setFormData({ ...formData, novoClienteNome: e.target.value })}
                        placeholder="Nome completo ou Razão Social"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          required
                          className="w-full p-3 bg-white rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          value={formData.novoClienteDocumento}
                          onChange={e => setFormData({ ...formData, novoClienteDocumento: e.target.value })}
                          placeholder="CPF ou CNPJ"
                        />
                      </div>
                      <div>
                        <select
                          className="w-full p-3 bg-white rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={formData.novoClienteTipo}
                          onChange={e => setFormData({ ...formData, novoClienteTipo: e.target.value })}
                        >
                          <option value="PF">Pessoa Física</option>
                          <option value="PJ">Pessoa Jurídica</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prazo e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Próximo Prazo</label>
                  <input
                    type="date"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.dataPrazo}
                    onChange={e => setFormData({ ...formData, dataPrazo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Prioridade</label>
                  <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.prioridade} onChange={e => setFormData({ ...formData, prioridade: e.target.value })}>
                    <option>Normal</option>
                    <option>Alta</option>
                    <option>Urgente</option>
                  </select>
                </div>
              </div>

              {/* Valor e Area */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Valor da Causa (R$)</label>
                  <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    type="number" step="0.01"
                    value={formData.valorCausa} onChange={e => setFormData({ ...formData, valorCausa: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Área</label>
                  <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} />
                </div>
              </div>

              {/* Fase */}
              <div>
                <label className="text-sm font-bold text-slate-700">Fase Atual</label>
                <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={formData.fase} onChange={e => setFormData({ ...formData, fase: e.target.value })} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={resetModal} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">Salvar Processo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProcessosPage() {
  return (
    <ToastProvider>
      <ProcessosContent />
    </ToastProvider>
  );
}