// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { LayoutDashboard, Users, Gavel, FileText, Settings } from "lucide-react";
import Image from "next/image";
import logoPic from "@/app/hor_legalflow.svg";
import { db } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";
import MobileNav from "./components/MobileNav";

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
    const nomeEscritorio =
      (user.unsafeMetadata?.nomeEscritorio as string) || "Meu Escritório Jurídico";

    escritorio = await db.escritorio.create({
      data: {
        tenantId: user.id,
        nome: nomeEscritorio,
      },
    });
  }

  const navItems = [
    { label: "Visão Geral", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Clientes", href: "/dashboard/clientes", icon: "Users" },
    { label: "Processos", href: "/dashboard/processos", icon: "Gavel" },
    { label: "Financeiro", href: "/dashboard/financeiro", icon: "FileText" },
    { label: "Configurações", href: "/dashboard/configuracoes", icon: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-neutral-950 text-white">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800 font-bold text-xl tracking-tight">
          <Image src={logoPic} alt="LegalFlow Logo" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const icons: Record<string, React.ElementType> = {
              LayoutDashboard,
              Users,
              Gavel,
              FileText,
              Settings,
            };
            const Icon = icons[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors text-sm font-medium"
              >
                {Icon && <Icon className="h-5 w-5" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-xs text-neutral-400 overflow-hidden">
              <p className="font-medium text-white truncate">{user.firstName}</p>
              <p className="truncate opacity-70">Advogado</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 md:ml-64 transition-all">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Menu hambúrguer — apenas mobile */}
            <MobileNav navItems={navItems} escritorioNome={escritorio.nome} />
            <h1 className="text-base font-semibold text-neutral-800 truncate">{escritorio.nome}</h1>
          </div>
          {/* UserButton visível no mobile */}
          <div className="flex md:hidden">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
