"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Plus, Loader2, CheckCircle2, Circle, Trash2, Clock, MapPin, X
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TIPOS_AUDIENCIA } from "@/lib/legal-constants";

interface Audiencia {
  id: string;
  titulo: string;
  dataHora: string;
  local: string | null;
  tipo: string;
  observacoes: string | null;
  concluida: boolean;
}

const HORA_DEFAULT = "09:00";

export function AudienciasTab({ processoId }: { processoId: string }) {
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    data: "",
    hora: HORA_DEFAULT,
    local: "",
    tipo: "AUDIENCIA",
    observacoes: "",
  });

  const carregarAudiencias = useCallback(async () => {
    setLoading(true);
    try {
      const mes = format(mesSelecionado, "yyyy-MM");
      const res = await fetch(`/api/audiencias?processoId=${processoId}&mes=${mes}`);
      const data = await res.json();
      setAudiencias(Array.isArray(data) ? data : []);
    } catch {
      setAudiencias([]);
    } finally {
      setLoading(false);
    }
  }, [processoId, mesSelecionado]);

  useEffect(() => {
    carregarAudiencias();
  }, [carregarAudiencias]);

  // Dias do mês com audiências marcadas
  const diasComAudiencia = audiencias.map(a => new Date(a.dataHora));

  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesSelecionado),
    end: endOfMonth(mesSelecionado),
  });

  // Audiências do dia selecionado
  const audienciasDoDia = diaSelecionado
    ? audiencias.filter(a => isSameDay(new Date(a.dataHora), diaSelecionado))
    : audiencias;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataHora = new Date(`${formData.data}T${formData.hora}:00`).toISOString();
      const res = await fetch("/api/audiencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processoId,
          titulo: formData.titulo,
          dataHora,
          local: formData.local || null,
          tipo: formData.tipo,
          observacoes: formData.observacoes || null,
        }),
      });
      if (!res.ok) throw new Error();
      setShowForm(false);
      setFormData({ titulo: "", data: "", hora: HORA_DEFAULT, local: "", tipo: "AUDIENCIA", observacoes: "" });
      carregarAudiencias();
    } catch {
      alert("Erro ao salvar audiência.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleConcluida = async (audiencia: Audiencia) => {
    // Optimistic update
    setAudiencias(prev => prev.map(a => a.id === audiencia.id ? { ...a, concluida: !a.concluida } : a));
    try {
      await fetch("/api/audiencias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: audiencia.id, concluida: !audiencia.concluida }),
      });
    } catch {
      carregarAudiencias();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta audiência?")) return;
    setAudiencias(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/audiencias?id=${id}`, { method: "DELETE" });
    } catch {
      carregarAudiencias();
    }
  };

  const tipoLabel = (tipo: string) =>
    TIPOS_AUDIENCIA.find(t => t.value === tipo)?.label || tipo;

  // Offset do primeiro dia do mês (para alinhar no calendário)
  const primeiroDia = startOfMonth(mesSelecionado).getDay(); // 0=Dom

  return (
    <div className="space-y-5">
      {/* Header do calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setMesSelecionado(subMonths(mesSelecionado, 1)); setDiaSelecionado(null); }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-bold text-slate-800 capitalize">
            {format(mesSelecionado, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button
            onClick={() => { setMesSelecionado(addMonths(mesSelecionado, 1)); setDiaSelecionado(null); }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            ›
          </button>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={13} />
          Nova Audiência
        </button>
      </div>

      {/* Mini-calendário */}
      <div className="bg-white rounded-xl border border-slate-100 p-3">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 mb-1">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Offset (dias vazios antes do início do mês) */}
          {Array.from({ length: primeiroDia }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {diasDoMes.map(dia => {
            const temAudiencia = diasComAudiencia.some(d => isSameDay(d, dia));
            const isHoje = isSameDay(dia, new Date());
            const isSelecionado = diaSelecionado && isSameDay(dia, diaSelecionado);

            return (
              <button
                key={dia.toISOString()}
                onClick={() => setDiaSelecionado(isSelecionado ? null : dia)}
                className={`
                  relative flex items-center justify-center w-full aspect-square rounded-lg text-xs font-semibold transition-all
                  ${isSelecionado ? "bg-slate-900 text-white" : ""}
                  ${isHoje && !isSelecionado ? "border border-slate-300 text-slate-900" : ""}
                  ${!isSelecionado && !isHoje ? "hover:bg-slate-50 text-slate-600" : ""}
                `}
              >
                {format(dia, "d")}
                {temAudiencia && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelecionado ? "bg-white" : "bg-blue-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulário de nova audiência */}
      {showForm && (
        <div className="bg-blue-50/60 rounded-xl border border-blue-100 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Nova Audiência</span>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              value={formData.titulo}
              onChange={e => setFormData(p => ({ ...p, titulo: e.target.value }))}
              placeholder="Título (ex: AIJ - 1ª Audiência de Instrução)"
              className="w-full p-2.5 text-sm bg-white rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="date"
                value={formData.data}
                onChange={e => setFormData(p => ({ ...p, data: e.target.value }))}
                className="p-2.5 text-sm bg-white rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                required
                type="time"
                value={formData.hora}
                onChange={e => setFormData(p => ({ ...p, hora: e.target.value }))}
                className="p-2.5 text-sm bg-white rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={formData.local}
                onChange={e => setFormData(p => ({ ...p, local: e.target.value }))}
                placeholder="Local (ex: 1ª Vara Cível)"
                className="p-2.5 text-sm bg-white rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={formData.tipo}
                onChange={e => setFormData(p => ({ ...p, tipo: e.target.value }))}
                className="p-2.5 text-sm bg-white rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {TIPOS_AUDIENCIA.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <textarea
              value={formData.observacoes}
              onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))}
              placeholder="Observações (opcional)"
              rows={2}
              className="w-full p-2.5 text-sm bg-white rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-bold text-slate-500 px-3 py-2 hover:bg-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de audiências */}
      {diaSelecionado && (
        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Calendar size={12} />
          {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
          <button onClick={() => setDiaSelecionado(null)} className="ml-1 text-slate-400 hover:text-slate-600">
            <X size={11} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      ) : audienciasDoDia.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">
            {diaSelecionado ? "Nenhuma audiência neste dia." : "Nenhuma audiência neste mês."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {audienciasDoDia.map(audiencia => (
            <div
              key={audiencia.id}
              className={`flex gap-3 p-3 rounded-xl border transition-all ${audiencia.concluida
                ? "bg-slate-50 border-slate-100 opacity-60"
                : "bg-white border-slate-100 hover:border-slate-200"}`}
            >
              <button
                onClick={() => handleToggleConcluida(audiencia)}
                className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {audiencia.concluida
                  ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : <Circle size={16} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold text-slate-800 leading-snug ${audiencia.concluida ? "line-through text-slate-400" : ""}`}>
                  {audiencia.titulo}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock size={10} />
                    {format(new Date(audiencia.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {audiencia.local && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin size={10} />
                      {audiencia.local}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                    {tipoLabel(audiencia.tipo)}
                  </span>
                </div>
                {audiencia.observacoes && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">{audiencia.observacoes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(audiencia.id)}
                className="flex-shrink-0 p-1 text-slate-300 hover:text-red-400 transition-colors rounded-md hover:bg-red-50"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
