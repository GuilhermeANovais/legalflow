// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users, Scale, Activity, TrendingUp } from "lucide-react";
import AIAssistant from "./components/AIAssistant"; // Verifique se o caminho está correto

async function getDashboardData(userId: string) {
  const [clientes, processos, processosAtivos, processosRecentes] = await Promise.all([
    // Contagens para os Cards
    db.client.count({ where: { tenantId: userId } }),
    db.processo.count({ where: { tenantId: userId } }),
    db.processo.count({ where: { tenantId: userId, status: "ATIVO" } }),
    
    // Lista real para a IA (Traz os 10 últimos ativos)
    db.processo.findMany({
      where: { tenantId: userId, status: "ATIVO" },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })
  ]);

  return { 
    kpis: { clientes, processos, processosAtivos },
    recentes: processosRecentes
  };
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dados = await getDashboardData(userId);
  const { kpis } = dados;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
        <p className="text-slate-500 mt-2">Bem-vindo ao painel de controle do seu escritório.</p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Total de Clientes</h3>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.clientes}</div>
          <p className="text-xs text-slate-400 mt-1">Base cadastrada</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Processos Totais</h3>
            <Scale className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.processos}</div>
          <p className="text-xs text-slate-400 mt-1">Histórico completo</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Em Andamento</h3>
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.processosAtivos}</div>
          <p className="text-xs text-slate-400 mt-1">Casos ativos agora</p>
        </div>

         {/* Card 4 */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Taxa de Atividade</h3>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {kpis.processos > 0 ? Math.round((kpis.processosAtivos / kpis.processos) * 100) : 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Eficiência do escritório</p>
        </div>
      </div>

      {/* Área da IA e Outros widgets futuros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           {/* Aqui entraremos com gráficos na próxima etapa */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 h-64 flex items-center justify-center text-slate-400 border-dashed">
              Em breve: Gráfico de Receita Mensal
           </div>
        </div>
        
        {/* Coluna da Direita: Assistente IA */}
        <div className="lg:col-span-1 h-full">
          <AIAssistant processos={dados.recentes} />
        </div>
      </div>
    </div>
  );
}
