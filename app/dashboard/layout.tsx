// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { LayoutDashboard, Users, Gavel, FileText, Settings, Menu, LogOut } from "lucide-react"; // <--- Importou Settings?
import { db } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Busca o escritório
  let escritorio = await db.escritorio.findUnique({
    where: { tenantId: user.id },
  });

  if (!escritorio) {
    // Cria um padrão se não existir (fallback)
    escritorio = await db.escritorio.create({
      data: {
        tenantId: user.id,
        nome: "Meu Escritório Jurídico",
      },
    });
  }

  // --- AQUI ESTÁ A LISTA DO MENU ---
  const navItems = [
    { label: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { label: "Clientes", href: "/dashboard/clientes", icon: Users },
    { label: "Processos", href: "/dashboard/processos", icon: Gavel },
    { label: "Financeiro", href: "/dashboard/financeiro", icon: FileText },
    { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings }, // <--- ESTA LINHA É OBRIGATÓRIA
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-slate-950 text-white">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-xl tracking-tight">
          <Gavel className="mr-2 text-blue-500" />
          Legal<span className="text-blue-500">Flow</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-xs text-slate-400 overflow-hidden">
              <p className="font-medium text-white truncate">{user.firstName}</p>
              <p className="truncate opacity-70">Advogado</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 md:ml-64 transition-all">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mostra o nome do escritório vindo do banco */}
            <h1 className="text-lg font-semibold text-slate-800">{escritorio.nome}</h1>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
