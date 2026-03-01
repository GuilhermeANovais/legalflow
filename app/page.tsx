import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Shield, Zap, Clock,
  BarChart3, Brain, Scale, Gavel, Star, Users,
  TrendingUp, Quote
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-slate-200/60 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 p-2 rounded-xl">
              <Scale className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-display font-extrabold text-slate-900 tracking-tight">
              LegalFlow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#funcionalidades" className="hover:text-indigo-600 transition-colors duration-200">
              Funcionalidades
            </a>
            <a href="#resultados" className="hover:text-indigo-600 transition-colors duration-200">
              Resultados
            </a>
            <a href="#depoimentos" className="hover:text-indigo-600 transition-colors duration-200">
              Depoimentos
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-slate-900/10"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Background subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 via-slate-50 to-slate-50 pointer-events-none" />

        <div className="container mx-auto text-center max-w-5xl relative z-10">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
            <Zap size={14} fill="currentColor" className="animate-pulse-soft" />
            Plataforma #1 de Gestão Jurídica com IA
          </div>

          {/* Headline — Loss Aversion Framing */}
          <h1 className="animate-fade-up delay-100 font-display text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.08] mb-6 tracking-tight">
            Pare de perder prazos.{" "}
            <br className="hidden md:block" />
            <span className="text-gradient">
              Pare de perder clientes.
            </span>
          </h1>

          {/* Subheadline — Benefit Framing */}
          <p className="animate-fade-up delay-200 text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Gerencie processos, prazos e clientes com uma{" "}
            <strong className="text-slate-700">IA que lê e resume seus casos em segundos</strong>.
            O escritório organizado que você sempre quis — sem planilhas, sem estresse.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300 flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/sign-up"
              className="group w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all duration-200 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              Criar Conta Grátis
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#funcionalidades"
              className="w-full md:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center"
            >
              Ver Funcionalidades
            </Link>
          </div>

          {/* Risk Reversal Micro-Copy */}
          <p className="animate-fade-up delay-400 text-sm text-slate-400 font-medium">
            ✓ Gratuito para sempre no plano básico &nbsp;·&nbsp; ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Setup em 2 minutos
          </p>

          {/* Social Proof Bar */}
          <div className="animate-fade-up delay-500 mt-12 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700">A</div>
                <div className="w-8 h-8 rounded-full bg-cyan-200 border-2 border-white flex items-center justify-center text-xs font-bold text-cyan-700">M</div>
                <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-700">R</div>
                <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-700">J</div>
                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">+</div>
              </div>
              <span className="text-sm font-semibold text-slate-600">500+ advogados</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-600">4.9/5 de avaliação</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Shield size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-slate-600">Dados criptografados</span>
            </div>
          </div>

          {/* Mini Dashboard Mockup */}
          <div className="mt-16 animate-fade-up delay-700">
            <div className="p-5 bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 hover:shadow-3xl transition-shadow duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100 group hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="font-bold text-slate-700">Prazos em Dia</span>
                  </div>
                  <div className="text-2xl font-display font-extrabold text-emerald-700">98%</div>
                  <div className="text-xs text-emerald-600 mt-1 font-medium">↑ 12% este mês</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100 group hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg">
                      <Brain size={16} />
                    </div>
                    <span className="font-bold text-slate-700">IA Ativa</span>
                  </div>
                  <div className="text-2xl font-display font-extrabold text-indigo-700">247</div>
                  <div className="text-xs text-indigo-600 mt-1 font-medium">resumos gerados hoje</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-5 rounded-2xl border border-cyan-100 group hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-cyan-600 text-white rounded-lg">
                      <Gavel size={16} />
                    </div>
                    <span className="font-bold text-slate-700">CNJ Integrado</span>
                  </div>
                  <div className="text-2xl font-display font-extrabold text-cyan-700">1.2k</div>
                  <div className="text-xs text-cyan-600 mt-1 font-medium">processos sincronizados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- NÚMEROS / AUTORIDADE (Authority Bias) --- */}
      <section id="resultados" className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock size={20} className="text-indigo-600" />
              </div>
              <div className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mb-2">
                3h
              </div>
              <p className="text-slate-500 font-medium text-sm">
                economizadas por dia em média
              </p>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-indigo-50 rounded-2xl -m-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2 mb-2">
                <TrendingUp size={20} className="text-indigo-600" />
              </div>
              <div className="relative text-4xl md:text-5xl font-display font-extrabold text-slate-900 mb-2">
                99.8%
              </div>
              <p className="relative text-slate-500 font-medium text-sm">
                de uptime garantido
              </p>
            </div>

            <div className="group">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={20} className="text-indigo-600" />
              </div>
              <div className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mb-2">
                12k+
              </div>
              <p className="text-slate-500 font-medium text-sm">
                processos gerenciados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FUNCIONALIDADES (BENTO GRID com Benefit Framing) --- */}
      <section id="funcionalidades" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Tudo que seu escritório precisa.{" "}
              <span className="text-gradient">Nada que não precisa.</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Centralize sua operação em uma plataforma intuitiva que trabalha por você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Card 1 - IA (destaque) */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 via-indigo-50 to-cyan-50 rounded-3xl p-8 md:p-10 border border-indigo-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="relative z-10">
                <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="text-indigo-600 w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-extrabold text-slate-900 mb-3">
                  IA que entende seus processos
                </h3>
                <p className="text-slate-600 max-w-md leading-relaxed">
                  Gere resumos claros para clientes e pesquise jurisprudência para petições —{" "}
                  <strong className="text-indigo-700">tudo em segundos, não em horas</strong>.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -mr-16 -mb-16 group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute left-1/2 top-0 w-48 h-48 bg-cyan-200/20 rounded-full blur-3xl -mt-24 group-hover:scale-110 transition-transform duration-500" />
            </div>

            {/* Card 2 - CNJ */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
              <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
                <Gavel className="text-slate-900 w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-3">
                Busca CNJ automática
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Digite o número — o LegalFlow consulta e preenche{" "}
                <strong className="text-slate-700">todas as informações do processo</strong> instantaneamente.
              </p>
            </div>

            {/* Card 3 - Financeiro */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
              <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                <BarChart3 className="text-emerald-600 w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-3">
                Saiba quanto você lucra
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Controle honorários, custas e fluxo de caixa.{" "}
                <strong className="text-slate-700">Visibilidade financeira total</strong> do escritório.
              </p>
            </div>

            {/* Card 4 - Segurança */}
            <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="relative z-10">
                <div className="bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="text-white w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-extrabold mb-3">
                  Segurança que sigilosos exigem
                </h3>
                <p className="text-slate-400 max-w-md leading-relaxed">
                  Criptografia de ponta a ponta e servidores seguros.{" "}
                  <strong className="text-slate-200">Apenas você acessa os dados dos seus clientes.</strong>
                </p>
              </div>
              <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-900/30 rounded-full blur-3xl -mr-16 -mt-16" />
            </div>
          </div>
        </div>
      </section>

      {/* --- DEPOIMENTOS (Social Proof) --- */}
      <section id="depoimentos" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Quem usa, <span className="text-gradient">recomenda</span>
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-lg">
              Veja o que advogados de todo o Brasil dizem sobre o LegalFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Depoimento 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <Quote size={32} className="text-indigo-200 mb-4" />
              <p className="text-slate-700 leading-relaxed mb-6">
                &ldquo;A IA do LegalFlow revolucionou minha rotina. O que levava uma tarde inteira para resumir,{" "}
                <strong>agora faço em 30 segundos</strong>.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                  MC
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Dra. Mariana Costa</div>
                  <div className="text-slate-400 text-xs">Advocacia Trabalhista · SP</div>
                </div>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <Quote size={32} className="text-indigo-200 mb-4" />
              <p className="text-slate-700 leading-relaxed mb-6">
                &ldquo;Organizar 200+ processos era impossível sem o LegalFlow.{" "}
                <strong>Nunca mais perdi um prazo</strong> desde que comecei a usar.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                  RS
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Dr. Rafael Silva</div>
                  <div className="text-slate-400 text-xs">Escritório Civil · RJ</div>
                </div>
              </div>
            </div>

            {/* Depoimento 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <Quote size={32} className="text-indigo-200 mb-4" />
              <p className="text-slate-700 leading-relaxed mb-6">
                &ldquo;A busca CNJ é genial. Digito o número e{" "}
                <strong>em segundos todo o processo está cadastrado</strong>. Economizo horas por semana.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-sm font-bold text-cyan-700">
                  AF
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Dra. Ana Ferreira</div>
                  <div className="text-slate-400 text-xs">Direito Penal · MG</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL (Loss Aversion + Risk Reversal) --- */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl relative">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl shadow-indigo-600/20 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" />
            <div className="absolute left-0 bottom-0 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl -ml-16 -mb-16" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                Cada dia sem o LegalFlow é um dia{" "}
                <span className="underline decoration-cyan-400 decoration-4 underline-offset-4">
                  de trabalho perdido
                </span>
              </h2>
              <p className="text-indigo-100 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
                Enquanto você lê isto, advogados já estão usando IA para atender mais clientes,
                perder menos prazos e ter mais controle financeiro.
              </p>

              <Link
                href="/sign-up"
                className="group inline-flex bg-white text-indigo-600 px-10 py-4 rounded-xl font-extrabold text-lg hover:bg-indigo-50 hover:scale-[1.03] transition-all duration-200 shadow-lg items-center gap-2"
              >
                Começar Gratuitamente
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                <span className="text-xs text-indigo-200 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Sem cartão de crédito
                </span>
                <span className="text-xs text-indigo-200 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Cancelamento a qualquer momento
                </span>
                <span className="text-xs text-indigo-200 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} /> Dados 100% seguros
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-slate-900 p-1.5 rounded-xl">
                <Scale className="text-white w-4 h-4" />
              </div>
              <span className="font-display font-extrabold text-slate-900">LegalFlow</span>
            </div>

            <nav className="flex items-center gap-6 text-sm text-slate-400 font-medium">
              <a href="#funcionalidades" className="hover:text-slate-600 transition-colors">
                Funcionalidades
              </a>
              <a href="#resultados" className="hover:text-slate-600 transition-colors">
                Resultados
              </a>
              <a href="#depoimentos" className="hover:text-slate-600 transition-colors">
                Depoimentos
              </a>
            </nav>

            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} LegalFlow Tecnologia Jurídica.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
