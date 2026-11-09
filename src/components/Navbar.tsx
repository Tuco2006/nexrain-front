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
    <header className="sticky top-0 z-[1000] shadow-sm">
      {/* faixa institucional */}
      <div className="bg-brand-900 text-[11px] text-brand-100 sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
          <p className="truncate">
            <span className="font-semibold text-white">NexRain</span>
            <span className="hidden sm:inline"> · Plataforma cidadã de prevenção a alagamentos · projeto acadêmico FIAP</span>
          </p>
          <p className="shrink-0">
            Emergência: <strong className="text-alerta">Defesa Civil 199</strong>
            <span className="hidden sm:inline"> · <strong className="text-alerta">Bombeiros 193</strong></span>
          </p>
        </div>
      </div>
      <div className="flex h-1">
        <span className="flex-[3] bg-brand-500" />
        <span className="flex-1 bg-alerta" />
        <span className="flex-[2] bg-accent-500" />
      </div>

      {/* marca */}
      <div className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMenuAberto(false)}>
            <Image src="/logo.svg" alt="NexRain" width={42} height={42} priority />
            <div className="leading-tight">
              <span className="font-titulo text-xl font-bold tracking-tight text-ink">
                Nex<span className="text-brand-600">Rain</span>
              </span>
              <p className="hidden text-xs text-slate-500 sm:block">Monitoramento de chuvas e alagamentos · São Paulo</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/ocorrencias"
              className="hidden rounded-full border border-brand-600/40 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 md:inline-block"
            >
              Relatar alagamento
            </Link>
            <Link
              href="/rotas"
              className="hidden rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 md:inline-block"
            >
              Planejar trajeto
            </Link>
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink/15 text-ink lg:hidden"
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
        </div>
      </div>

      {/* menu principal */}
      <nav className="hidden bg-brand-700 lg:block">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          {links.map((link) => {
            const ativo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-[3px] px-4 py-2.5 text-sm font-medium transition-colors ${
                  ativo ? "border-alerta bg-brand-800 text-white" : "border-transparent text-brand-100 hover:bg-brand-600 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {menuAberto && (
        <nav className="flex flex-col border-b border-ink/10 bg-white px-4 pb-4 pt-2 lg:hidden">
          {links.map((link) => {
            const ativo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className={`border-l-4 px-3 py-2.5 text-sm font-medium ${
                  ativo ? "border-brand-600 bg-brand-50 text-brand-800" : "border-transparent text-slate-700 hover:bg-brand-50"
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
