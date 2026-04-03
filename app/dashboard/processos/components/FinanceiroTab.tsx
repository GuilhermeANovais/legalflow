"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Loader2, CheckCircle2, Circle, X
} from "lucide-react";

interface Transacao {
  id: string;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  valor: number;
  status: "PENDENTE" | "PAGO";
  descricao: string;
  dataVencimento: string;
  dataPagamento: string | null;
}

const CATEGORIAS = [
  { value: "HONORARIOS", label: "Honorários" },
  { value: "CUSTAS", label: "Custas Processuais" },
  { value: "REPASSE_CLIENTE", label: "Repasse ao Cliente" },
  { value: "OPERACIONAL_ESCRITORIO", label: "Operacional Escritório" },
];

export function FinanceiroTab({ processoId, clienteId }: { processoId: string; clienteId: string }) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "RECEITA",
    categoria: "HONORARIOS",
    valor: "",
    descricao: "",
    dataVencimento: "",
  });

  const carregarTransacoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financeiro?processoId=${processoId}`);
      const data = await res.json();
      // A API retorna { transacoes, resumo } — filtramos por processoId
      const lista: Transacao[] = (data.transacoes || []).filter(
        (t: Transacao & { processoId?: string }) => t.processoId === processoId
      );
      setTransacoes(lista);
    } catch {
      setTransacoes([]);
    } finally {
      setLoading(false);
    }
  }, [processoId]);

  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);

  // Cálculos do resumo
  const totalReceitas = transacoes
    .filter(t => t.tipo === "RECEITA" && t.status === "PAGO")
    .reduce((s, t) => s + t.valor, 0);
  const totalPendente = transacoes
    .filter(t => t.status === "PENDENTE")
    .reduce((s, t) => s + t.valor, 0);
  const totalDespesas = transacoes
    .filter(t => t.tipo === "DESPESA")
    .reduce((s, t) => s + t.valor, 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const valorNum = parseFloat(formData.valor.replace(/\./g, "").replace(",", "."));
      if (isNaN(valorNum) || valorNum <= 0) {
        alert("Valor inválido.");
        return;
      }
      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: formData.tipo,
          categoria: formData.categoria,
          valor: valorNum,
          descricao: formData.descricao,
          dataVencimento: formData.dataVencimento || new Date().toISOString(),
          processoId,
          clienteId,
        }),
      });
      if (!res.ok) throw new Error();
      setShowForm(false);
      setFormData({ tipo: "RECEITA", categoria: "HONORARIOS", valor: "", descricao: "", dataVencimento: "" });
      carregarTransacoes();
    } catch {
      alert("Erro ao lançar transação.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarcarPago = async (id: string) => {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, status: "PAGO" as const, dataPagamento: new Date().toISOString() } : t));
    try {
      await fetch("/api/financeiro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      carregarTransacoes();
    }
  };

  const handleValorChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) { setFormData(p => ({ ...p, valor: "" })); return; }
    const val = parseInt(digits, 10) / 100;
    setFormData(p => ({ ...p, valor: val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }));
  };

  const categoriaLabel = (cat: string) =>
    CATEGORIAS.find(c => c.value === cat)?.label || cat;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={12} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Recebido</span>
          </div>
          <p className="text-sm font-black text-emerald-700">{fmt(totalReceitas)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Circle size={12} className="text-amber-600" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pendente</span>
          </div>
          <p className="text-sm font-black text-amber-700">{fmt(totalPendente)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={12} className="text-red-500" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Despesas</span>
          </div>
          <p className="text-sm font-black text-red-600">{fmt(totalDespesas)}</p>
        </div>
      </div>

      {/* Botão + Formulário */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={13} />
          Nova Transação
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lançar Transação</span>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Tipo: RECEITA / DESPESA */}
            <div className="grid grid-cols-2 gap-2">
              {(["RECEITA", "DESPESA"] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, tipo }))}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${formData.tipo === tipo
                    ? tipo === "RECEITA"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-red-400 bg-red-50 text-red-600"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                >
                  {tipo === "RECEITA" ? "💚 Receita" : "🔴 Despesa"}
                </button>
              ))}
            </div>

            <select
              value={formData.categoria}
              onChange={e => setFormData(p => ({ ...p, categoria: e.target.value }))}
              className="w-full p-2.5 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <input
              required
              value={formData.descricao}
              onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))}
              placeholder="Descrição"
              className="w-full p-2.5 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                required
                value={formData.valor}
                onChange={e => handleValorChange(e.target.value)}
                placeholder="R$ 0,00"
                className="p-2.5 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono"
              />
              <input
                type="date"
                value={formData.dataVencimento}
                onChange={e => setFormData(p => ({ ...p, dataVencimento: e.target.value }))}
                className="p-2.5 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="text-xs font-bold text-slate-500 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                {submitting && <Loader2 size={12} className="animate-spin" />}
                Lançar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de transações */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      ) : transacoes.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Nenhuma transação vinculada a este processo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transacoes.map(t => (
            <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${t.status === "PAGO" ? "bg-slate-50 border-slate-100 opacity-70" : "bg-white border-slate-100 hover:border-slate-200"}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.tipo === "RECEITA" ? "bg-emerald-400" : "bg-red-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{t.descricao}</p>
                <span className="text-[10px] text-slate-400">{categoriaLabel(t.categoria)}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-black ${t.tipo === "RECEITA" ? "text-emerald-600" : "text-red-500"}`}>
                  {t.tipo === "RECEITA" ? "+" : "-"}{fmt(t.valor)}
                </p>
                {t.status === "PENDENTE" ? (
                  <button
                    onClick={() => handleMarcarPago(t.id)}
                    className="text-[10px] font-bold text-amber-600 hover:text-emerald-600 transition-colors"
                  >
                    Marcar pago
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 justify-end">
                    <CheckCircle2 size={9} /> Pago
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
