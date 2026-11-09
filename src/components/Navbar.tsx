"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Início" },
  { href: "/mapa", label: "Mapa de risco" },
  { href: "/rotas", label: "Rota segura" },
  { href: "/monitoramento", label: "Monitoramento IA" },
  { href: "/ocorrencias", label: "Ocorrências" },
  { href: "/alertas", label: "Alertas" },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/5 bg-base-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuAberto(false)}>
          <Image src="/logo.svg" alt="NexRain" width={32} height={32} priority />
          <span className="text-lg font-semibold tracking-tight text-white">
            Nex<span className="text-brand-400">Rain</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
          {links.map((link) => {
            const ativo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  ativo ? "bg-brand-500 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white lg:hidden"
        >
          {menuAberto ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {menuAberto && (
        <nav className="flex flex-col gap-1 border-t border-white/5 px-4 pb-4 pt-2 lg:hidden">
          {links.map((link) => {
            const ativo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  ativo ? "bg-brand-500 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
