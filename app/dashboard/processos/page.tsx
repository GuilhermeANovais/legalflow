"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Scale, Loader2, Wand2, X, 
  CheckCircle2, Calendar, MessageCircle, 
  AlertTriangle, Clock 
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { buscarDadosCNJ } from "@/app/actions";

// Definição de tipos para segurança (opcional, mas recomendado)
interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
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
  cliente?: Cliente;
}

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buscandoCNJ, setBuscandoCNJ] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    titulo: "",
    numero: "",
    clienteId: "",
    area: "Cível",
    prioridade: "Normal",
    valorCausa: "",
    fase: "Inicial",
    dataPrazo: "" // Formato YYYY-MM-DD
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

  // 1. Excluir Processo
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede clique no card
    if (!confirm("Tem certeza que deseja excluir este processo? Essa ação é irreversível.")) return;

    // Atualização Otimista (Remove da tela antes do banco)
    setProcessos(prev => prev.filter(p => p.id !== id));

    try {
      await fetch(`/api/processos?id=${id}`, { method: "DELETE" });
    } catch (error) {
      alert("Erro ao excluir no servidor.");
      carregarDados(); // Reverte em caso de erro
    }
  };

  // 2. Mudar Prioridade (Normal/Alta/Urgente)
  const handlePrioridadeChange = async (id: string, novaPrioridade: string) => {
    // Atualização Otimista
    setProcessos(prev => prev.map(p => p.id === id ? { ...p, prioridade: novaPrioridade } : p));

    try {
      await fetch("/api/processos", {
        method: "PATCH",
        body: JSON.stringify({ id, prioridade: novaPrioridade }),
      });
    } catch (error) {
      console.error("Erro ao atualizar prioridade");
    }
  };

  // 3. Concluir/Arquivar Processo
  const handleConcluir = async (id: string, resultado: string) => {
    // Atualização Otimista: Marca como ARQUIVADO e define o resultado
    setProcessos(prev => prev.map(p => p.id === id ? { ...p, status: "ARQUIVADO", resultado } : p));
    
    try {
      await fetch("/api/processos", { 
        method: "PATCH", 
        body: JSON.stringify({ id, status: "ARQUIVADO", resultado }) 
      });
    } catch (error) {
      alert("Erro ao arquivar processo.");
    }
  };

  // 4. Abrir WhatsApp
  const handleWhatsApp = (telefone: string | null | undefined, nome: string | undefined) => {
    if (!telefone) return alert("Cliente sem telefone cadastrado.");
    const numero = telefone.replace(/\D/g, ""); // Remove tudo que não for número
    window.open(`https://wa.me/55${numero}?text=Olá ${nome}, tudo bem? Gostaria de falar sobre o andamento do seu processo.`, "_blank");
  };

  // 5. Buscar no CNJ (Integração)
  const handleBuscaCNJ = async () => {
    if (!formData.numero || formData.numero.length < 10) {
      alert("Digite um número de processo válido (pelo menos 10 dígitos).");
      return;
    }

    setBuscandoCNJ(true);
    const res = await buscarDadosCNJ(formData.numero);
    setBuscandoCNJ(false);

    if (res.found && res.dados) {
      setFormData(prev => ({
        ...prev,
        titulo: res.dados.titulo,
        area: res.dados.area,
        fase: res.dados.fase,
        valorCausa: res.dados.valorCausa.toString(),
        prioridade: res.dados.prioridade
      }));
      alert(`Processo localizado no ${res.dados.tribunal}! Campos preenchidos.`);
    } else {
      alert("Processo não encontrado ou erro na busca externa.");
    }
  };

  // 6. Salvar Novo Processo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/processos", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      setIsModalOpen(false);
      // Limpar formulário
      setFormData({ 
        titulo: "", numero: "", clienteId: "", area: "Cível", 
        prioridade: "Normal", valorCausa: "", fase: "Inicial", dataPrazo: "" 
      });
      carregarDados();
    } catch (error) {
      alert("Erro ao salvar processo.");
    }
  };

  // --- LÓGICA VISUAL ---

  // Define a cor e estado do prazo
  const getPrazoStatus = (data: string | null) => {
    if (!data) return "neutral";
    const prazo = new Date(data);
    const hoje = new Date();
    
    // Se o prazo é anterior a hoje (Vencido)
    if (isBefore(prazo, hoje)) return "vencido";
    
    // Se o prazo é nos próximos 3 dias (Atenção)
    if (isBefore(prazo, addDays(hoje, 3))) return "atencao";
    
    return "em_dia";
  };

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
          {processos.map((proc) => {
            const statusPrazo = getPrazoStatus(proc.dataPrazo);
            const isArquivado = proc.status === "ARQUIVADO";

            return (
              <div 
                key={proc.id} 
                className={`relative bg-white p-6 rounded-3xl border transition-all group ${
                  isArquivado 
                    ? 'opacity-60 grayscale bg-slate-50 border-slate-100' 
                    : 'hover:shadow-md border-slate-200 shadow-sm'
                }`}
              >
                
                {/* INDICADOR LATERAL DE PRAZO (Só aparece se ativo e com data) */}
                {!isArquivado && proc.dataPrazo && (
                  <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-colors ${
                    statusPrazo === 'vencido' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                    statusPrazo === 'atencao' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                )}

                <div className="flex justify-between items-start mb-4 pl-3">
                  {/* SELETOR DE PRIORIDADE */}
                  <div className="relative">
                    <select 
                      disabled={isArquivado}
                      value={proc.prioridade}
                      onChange={(e) => handlePrioridadeChange(proc.id, e.target.value)}
                      className={`appearance-none cursor-pointer pl-3 pr-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border outline-none transition-colors ${
                        proc.prioridade === 'Urgente' ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 
                        proc.prioridade === 'Alta' ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' :
                        'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>

                  {/* BARRA DE FERRAMENTAS DO CARD */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!isArquivado && (
                      <>
                        {/* Botão WhatsApp */}
                        <button 
                          onClick={() => handleWhatsApp(proc.cliente?.telefone, proc.cliente?.nome)} 
                          className="p-2 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors" 
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>

                        {/* Botão Concluir com Dropdown */}
                        <div className="relative group/check">
                          <button className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
                            <CheckCircle2 size={16} />
                          </button>
                          {/* Menu Dropdown Puro CSS */}
                          <div className="absolute right-0 top-8 hidden group-hover/check:flex flex-col bg-white shadow-xl border border-slate-100 rounded-xl p-2 z-20 w-32 animate-in fade-in zoom-in-95 duration-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Concluir como:</span>
                            <button onClick={() => handleConcluir(proc.id, "Procedente")} className="text-xs font-bold text-left p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors">Procedente</button>
                            <button onClick={() => handleConcluir(proc.id, "Improcedente")} className="text-xs font-bold text-left p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">Improcedente</button>
                            <button onClick={() => handleConcluir(proc.id, "Acordo")} className="text-xs font-bold text-left p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">Acordo</button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Botão Excluir */}
                    <button 
                      onClick={(e) => handleDelete(proc.id, e)} 
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" 
                      title="Excluir Processo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Título e Informações Principais */}
                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2 pl-3 min-h-[3.5rem]">
                  {isArquivado && <span className="mr-2 text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-500 font-black align-middle">ARQUIVADO</span>}
                  {proc.titulo}
                </h3>
                
                <div className="pl-3 flex justify-between items-end mb-4 mt-2">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Scale size={12} className="text-blue-500" /> {proc.numero}
                  </p>
                  
                  {/* Badge de Prazo */}
                  {!isArquivado && proc.dataPrazo && (
                     <span className={`text-xs font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                       statusPrazo === 'vencido' ? 'text-red-600 bg-red-50 border-red-100' :
                       statusPrazo === 'atencao' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                       'text-slate-500 bg-slate-50 border-slate-100'
                     }`}>
                       {statusPrazo === 'vencido' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                       {format(new Date(proc.dataPrazo), "dd/MM", { locale: ptBR })}
                     </span>
                  )}
                </div>

                <div className="pl-3 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="text-xs font-medium text-slate-600 truncate max-w-[55%]">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente</span>
                    <span className="font-bold text-slate-900 truncate">{proc.cliente?.nome || "Sem cliente"}</span>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                    isArquivado 
                      ? 'bg-slate-100 text-slate-500 border-slate-200' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {proc.resultado || proc.fase}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Novo Processo</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} /> {/* Ícone de X improvisado com Trash rodado ou use XCircle */}
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
                    onChange={e => setFormData({...formData, numero: e.target.value})} 
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                  <button 
                    type="button"
                    onClick={handleBuscaCNJ}
                    disabled={buscandoCNJ}
                    className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Preencher automaticamente"
                  >
                    {buscandoCNJ ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Use a varinha mágica para buscar dados do CNJ.</p>
              </div>

              {/* Título */}
              <div>
                <label className="text-sm font-bold text-slate-700">Título da Ação</label>
                <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900" 
                  value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} 
                  placeholder="Ex: Ação de Cobrança vs Empresa X"
                />
              </div>
              
              {/* Cliente */}
              <div>
                <label className="text-sm font-bold text-slate-700">Cliente</label>
                <select required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={formData.clienteId} onChange={e => setFormData({...formData, clienteId: e.target.value})}>
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              {/* Prazo e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-sm font-bold text-slate-700">Próximo Prazo</label>
                   <div className="relative">
                    <input 
                      type="date" 
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={formData.dataPrazo} 
                      onChange={e => setFormData({...formData, dataPrazo: e.target.value})} 
                    />
                   </div>
                </div>
                <div>
                   <label className="text-sm font-bold text-slate-700">Prioridade</label>
                   <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.prioridade} onChange={e => setFormData({...formData, prioridade: e.target.value})}>
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
                    value={formData.valorCausa} onChange={e => setFormData({...formData, valorCausa: e.target.value})} />
                </div>
                <div>
                   <label className="text-sm font-bold text-slate-700">Área</label>
                   <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900" 
                    value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                </div>
              </div>
              
              {/* Fase */}
              <div>
                 <label className="text-sm font-bold text-slate-700">Fase Atual</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900" 
                  value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">Salvar Processo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}