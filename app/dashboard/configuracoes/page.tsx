"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Building } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar");
      }

      router.refresh(); // Atualiza o nome no menu lateral automaticamente
      alert("Nome do escritório atualizado com sucesso!");
      setNome(""); // Limpa o campo opcionalmente
    } catch (error) {
      alert("Ocorreu um erro ao salvar as configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h2>
        <p className="text-slate-500 mt-2">Gerencie os dados do seu escritório.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-slate-100 rounded-xl">
            <Building className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Dados Gerais</h3>
            <p className="text-sm text-slate-500">Informações visíveis nos relatórios e cabeçalho.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nome do Escritório</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Silva & Associados"
              disabled={loading}
              className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !nome}
            className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 h-12 px-8 transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
