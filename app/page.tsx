import Link from "next/link";
import { 
  ArrowRight, CheckCircle2, Shield, Zap, 
  BarChart3, Brain, Scale, Gavel 
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  // Se já estiver logado, manda direto pro dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Scale className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">LegalFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#funcionalidades" className="hover:text-indigo-600 transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-indigo-600 transition-colors">Benefícios</a>
            <a href="#precos" className="hover:text-indigo-600 transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in"
              className="text-slate-600 hover:text-slate-900 font-bold text-sm"
            >
              Entrar
            </Link>
            <Link 
              href="/sign-up"
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Zap size={14} fill="currentColor" /> Nova IA Jurídica 2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
            Sua advocacia <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
              inteligente e organizada.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
            Abandone as planilhas. Gerencie processos, prazos e clientes com a ajuda de uma IA que lê e resume seus casos em segundos.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <Link 
              href="/sign-up"
              className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
            >
              Criar Conta Grátis <ArrowRight size={20} />
            </Link>
            <Link 
              href="#demo"
              className="w-full md:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              Ver Demonstração
            </Link>
          </div>

          {/* Mini Mockup / Social Proof */}
          <div className="mt-16 p-4 bg-white rounded-3xl shadow-2xl border border-slate-100 rotate-1 hover:rotate-0 transition-transform duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-100 text-green-700 rounded-lg"><CheckCircle2 size={16} /></div>
                      <span className="font-bold text-slate-700">Prazos em Dia</span>
                   </div>
                   <div className="h-2 bg-slate-200 rounded-full w-2/3"></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><Brain size={16} /></div>
                      <span className="font-bold text-slate-700">IA Ativa</span>
                   </div>
                   <div className="h-2 bg-slate-200 rounded-full w-3/4"></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Gavel size={16} /></div>
                      <span className="font-bold text-slate-700">CNJ Integrado</span>
                   </div>
                   <div className="h-2 bg-slate-200 rounded-full w-1/2"></div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FUNCIONALIDADES (BENTO GRID) --- */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tudo o que seu escritório precisa</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Centralize sua operação em uma única plataforma intuitiva e poderosa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - IA */}
            <div className="md:col-span-2 bg-indigo-50 rounded-3xl p-8 border border-indigo-100 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <Brain className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Assistente Jurídico com IA</h3>
                <p className="text-slate-600 max-w-md">
                  Nossa IA lê os dados do processo e gera resumos explicativos para seus clientes ou pesquisas de jurisprudência para suas petições em segundos.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-200/50 rounded-full blur-3xl -mr-16 -mb-16 group-hover:scale-110 transition-transform"></div>
            </div>

            {/* Card 2 - CNJ */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Gavel className="text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Busca CNJ</h3>
              <p className="text-slate-500">
                Digite apenas o número e nós preenchemos as capas dos processos automaticamente.
              </p>
            </div>

            {/* Card 3 - Financeiro */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <BarChart3 className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Gestão Financeira</h3>
              <p className="text-slate-500">
                Controle honorários, custas e fluxo de caixa. Saiba exatamente quanto seu escritório lucra.
              </p>
            </div>

            {/* Card 4 - Segurança */}
            <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 border border-slate-800 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-slate-700">
                  <Shield className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Segurança de Nível Bancário</h3>
                <p className="text-slate-400 max-w-md">
                  Seus dados são criptografados e armazenados em servidores seguros. Apenas você tem acesso às informações dos seus clientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-12 text-center text-white shadow-2xl shadow-indigo-200">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para modernizar seu escritório?</h2>
          <p className="text-indigo-100 mb-8 text-lg max-w-2xl mx-auto">
            Junte-se a advogados que já economizam horas de trabalho manual todos os dias.
          </p>
          <Link 
            href="/sign-up"
            className="inline-flex bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-lg"
          >
            Começar Gratuitamente
          </Link>
          <p className="mt-6 text-xs text-indigo-200 font-medium uppercase tracking-widest">
            Sem cartão de crédito • Cancelamento a qualquer momento
          </p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <Scale className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900">LegalFlow</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 LegalFlow Tecnologia Jurídica. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
