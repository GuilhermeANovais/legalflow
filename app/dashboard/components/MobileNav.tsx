"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logoPic from "@/app/hor_legalflow.svg";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Gavel,
  FileText,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface MobileNavProps {
  navItems: NavItem[];
  escritorioNome: string;
}

export default function MobileNav({ navItems, escritorioNome }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const icons: Record<string, React.ElementType> = {
    LayoutDashboard,
    Users,
    Gavel,
    FileText,
    Settings,
  };

  return (
    <>
      {/* Botão hambúrguer — só mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-neutral-950 text-white flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabeçalho do drawer */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-800">
          <Image src={logoPic} alt="LegalFlow Logo" className="h-7 w-auto" />
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nome do escritório */}
        <div className="px-5 py-3 border-b border-neutral-800/60">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Escritório</p>
          <p className="text-sm text-neutral-200 font-semibold truncate mt-0.5">{escritorioNome}</p>
        </div>

        {/* Itens de navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = icons[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors text-sm font-medium"
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
