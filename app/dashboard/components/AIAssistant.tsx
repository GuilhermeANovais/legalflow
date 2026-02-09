"use client";

import { useState } from "react";
import { Sparkles, Loader2, Brain, Gavel, UserCheck } from "lucide-react";
import { consultarIA } from "@/app/actions"; 

export default function AIAssistant({ processos }: { processos: any[] }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  // Garante que seleciona o primeiro se houver processos, senão fica vazio
  const [processoSelecionado, setProcessoSelecionado] = useState(processos?.[0]?.id || "");
  const [modo, setModo] = useState<'CLIENTE' | 'JURIDICO'>('CLIENTE');

  // --- CORREÇÃO AQUI: Adicionei o "=>" que faltava ---
  const handleConsultar = async (modoEscolhido: 'CLIENTE' | 'JURIDICO') => {
    const proc = processos.find(p => p.id === processoSelecionado);
    if (!proc) return;

    setModo(modoEscolhido);
    setLoading(true);
    setResultado(""); 

    try {
      const texto = await consultarIA(proc.titulo, proc.numero, proc.fase, modoEscolhido);
      setResultado(texto || "Sem resposta da IA.");
    } catch (error) {
      setResultado("Erro ao conectar com o consultor IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Legal AI</h3>
          <p className="text-xs text-slate-500 font-medium">Assistente Jurídico Inteligente</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecione o Processo</label>
            <select 
                value={processoSelecionado}
                onChange={(e) => setProcessoSelecionado(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
            >
                {processos && processos.length > 0 ? (
                  processos.map(p => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))
                ) : (
                  <option value="">Nenhum processo ativo</option>
                )}
            </select>
        </div>

        {/* Botões de Seleção de Modo */}
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={() => handleConsultar('CLIENTE')}
                disabled={loading || !processos || processos.length === 0}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                  modo === 'CLIENTE' 
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
            >
                {loading && modo === 'CLIENTE' ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
                Resumo Cliente
            </button>

            <button 
                onClick={() => handleConsultar('JURIDICO')}
                disabled={loading || !processos || processos.length === 0}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                   modo === 'JURIDICO'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
            >
                {loading && modo === 'JURIDICO' ? <Loader2 className="animate-spin" size={16} /> : <Gavel size={16} />}
                Base Legal
            </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-2xl p-6 overflow-y-auto border border-slate-100 min-h-[250px] max-h-[400px]">
        {resultado ? (
          <div className="prose prose-sm prose-slate max-w-none">
             <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                {/* Lógica simples para formatar o texto da IA */}
                {resultado.split('\n').map((line, i) => {
                    // Remove asteriscos duplos (markdown bold) para limpar, ou renderiza estilizado
                    const cleanLine = line.replace(/\*\*/g, '');
                    const isTitle = line.includes('**');
                    
                    return (
                        <div key={i} className={`mb-2 ${isTitle ? 'font-bold text-slate-900 mt-4' : ''}`}>
                            {cleanLine}
                        </div>
                    );
                })}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <Brain size={48} strokeWidth={1.5} />
            <p className="text-sm font-medium mt-4 text-center max-w-[200px]">
              Escolha "Resumo Cliente" para atendimento ou "Base Legal" para pesquisa jurídica.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
