"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buscarAlertas, buscarPainel, buscarRiscos } from "@/lib/api";
import { Alerta, PainelResumo, RiscoRegiao } from "@/lib/types";
import { NivelBadge } from "@/components/NivelBadge";
import { Carregando } from "@/components/Carregando";
import { NIVEIS, haQuanto } from "@/lib/formato";

const servicos = [
  {
    titulo: "Mapa de risco",
    texto: "Veja quais bairros podem alagar nas próximas horas, com previsão de chuva e radar em tempo real.",
    href: "/mapa",
    icone: (
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />
    ),
  },
  {
    titulo: "Rota segura",
    texto: "Informe origem e destino e receba um trajeto que desvia das ruas alagadas.",
    href: "/rotas",
    icone: (
      <path d="M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8" />
    ),
  },
  {
    titulo: "Relatar alagamento",
    texto: "Viu uma rua alagada? Envie o local e a altura da água para a Defesa Civil validar.",
    href: "/ocorrencias",
    icone: (
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Zm0 9v3m0 3h.01" />
    ),
  },
  {
    titulo: "Monitoramento por IA",
    texto: "Câmeras da cidade analisadas por visão computacional para detectar alagamentos.",
    href: "/monitoramento",
    icone: (
      <path d="M3 7h3l2-3h8l2 3h3v13H3V7Zm9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    ),
  },
];

const passos = [
  { titulo: "Câmeras e cidadãos", texto: "Imagens das câmeras e relatos chegam à plataforma." },
  { titulo: "IA identifica", texto: "A visão computacional estima a altura da água e o risco." },
  { titulo: "Defesa Civil valida", texto: "O operador confirma ou descarta cada ocorrência." },
  { titulo: "Alerta e rota", texto: "A população recebe o alerta e um trajeto alternativo." },
];

export default function HomePage() {
  const [painel, setPainel] = useState<PainelResumo | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [riscos, setRiscos] = useState<RiscoRegiao[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarPainel().then(setPainel).catch((e) => setErro(e.message));
    buscarAlertas(true).then(setAlertas).catch(() => null);
    buscarRiscos(false).then(setRiscos).catch(() => null);
  }, []);

  const maiorRisco = riscos[0];
  const numeros = [
    { rotulo: "Alagamentos ativos", valor: painel?.ocorrenciasAtivas, destaque: true },
    { rotulo: "Alertas em vigor", valor: painel?.alertasAtivos, destaque: true },
    { rotulo: "Aguardando validação", valor: painel?.ocorrenciasPendentes },
    { rotulo: "Regiões monitoradas", valor: painel?.regioesMonitoradas },
    { rotulo: "Câmeras ativas", valor: painel?.camerasAtivas },
    { rotulo: "Rotas calculadas", valor: painel?.rotasCalculadas },
  ];

  return (
    <div>
      <section className="ondas border-b border-ink/10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div>
            <span className="etiqueta-secao">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" /> Monitoramento em tempo real
            </span>
            <h1 className="font-titulo text-3xl font-bold leading-tight text-ink sm:text-5xl">
              Informação sobre chuva e alagamento para você <span className="text-brand-600">decidir por onde ir</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
              O NexRain identifica alagamentos nas câmeras da cidade com inteligência artificial, cruza com a previsão do
              tempo e indica rotas que desviam das ruas comprometidas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/mapa" className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-700">
                Consultar mapa de risco
              </Link>
              <Link href="/rotas" className="rounded-full border border-brand-600/40 bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50">
                Planejar trajeto seguro
              </Link>
            </div>
          </div>

          <div className="card overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between bg-brand-700 px-5 py-3 text-white">
              <p className="font-titulo text-sm font-semibold">Situação agora em São Paulo</p>
              <span className="text-xs text-brand-100">dados da API NexRain</span>
            </div>
            {erro ? (
              <p className="p-5 text-sm text-amber-800">{erro}</p>
            ) : !painel ? (
              <div className="flex min-h-[220px] items-center justify-center p-5">
                <Carregando texto="Consultando a situação da cidade..." />
              </div>
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {numeros.map((n) => (
                    <div key={n.rotulo} className={`rounded-xl p-3 ${n.destaque ? "bg-brand-50" : "bg-agua-50"}`}>
                      <p className={`font-titulo text-2xl font-bold ${n.destaque ? "text-brand-700" : "text-ink"}`}>{n.valor ?? "–"}</p>
                      <p className="mt-0.5 text-[11px] leading-tight text-slate-600">{n.rotulo}</p>
                    </div>
                  ))}
                </div>
                {maiorRisco && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-ink/10 p-3">
                    <div>
                      <p className="text-xs text-slate-500">Região com maior risco</p>
                      <p className="font-semibold text-ink">{maiorRisco.regiao.nome}</p>
                      <p className="text-xs text-slate-500">
                        {maiorRisco.descricaoTempo} · {maiorRisco.temperatura.toFixed(0)} °C · chuva máx. {maiorRisco.chuvaMaxima6h} mm/h
                      </p>
                    </div>
                    <div className="text-right">
                      <NivelBadge nivel={maiorRisco.nivel} prefixo="" />
                      <p className="mt-1 text-xs text-slate-500">índice {maiorRisco.indice}/100</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {alertas.length > 0 && (
        <section className="border-b border-alerta/40 bg-[#fff8e1]">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 font-titulo font-semibold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-alerta text-sm">!</span>
                Alertas em vigor
              </p>
              <Link href="/alertas" className="text-sm font-medium text-brand-700 hover:underline">
                Ver todos os alertas →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {alertas.slice(0, 3).map((a) => (
                <div key={a.id} className="rounded-xl border-l-4 bg-white p-4 shadow-cartao" style={{ borderLeftColor: NIVEIS[a.nivel].cor }}>
                  <div className="flex items-center justify-between gap-2">
                    <NivelBadge nivel={a.nivel} prefixo="" />
                    <span className="text-xs text-slate-500">{haQuanto(a.dataEmissao)}</span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{a.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.mensagem}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <span className="etiqueta-secao">Serviços ao cidadão</span>
        <h2 className="font-titulo text-2xl font-bold text-ink sm:text-3xl">O que você pode fazer aqui</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {servicos.map((s) => (
            <Link key={s.href} href={s.href} className="card group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:border-brand-500/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {s.icone}
                </svg>
              </span>
              <h3 className="mt-4 font-titulo text-lg font-semibold text-ink">{s.titulo}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.texto}</p>
              <span className="mt-4 text-sm font-semibold text-brand-700">Acessar →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <span className="etiqueta-secao">Como funciona</span>
          <h2 className="font-titulo text-2xl font-bold text-ink sm:text-3xl">Da câmera ao seu trajeto</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((p, i) => (
              <li key={p.titulo} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-titulo font-bold text-white">
                    {i + 1}
                  </span>
                  {i < passos.length - 1 && <span className="hidden h-0.5 flex-1 bg-brand-100 lg:block" />}
                </div>
                <h3 className="mt-4 font-semibold text-ink">{p.titulo}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 rounded-2xl bg-brand-700 p-8 text-white sm:p-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-alerta">Orientações de segurança</span>
            <h2 className="mt-2 font-titulo text-2xl font-bold">Em dia de chuva forte</h2>
            <p className="mt-3 text-brand-100">Siga os alertas e, em emergência, ligue para a Defesa Civil (199) ou os Bombeiros (193).</p>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              "Não atravesse ruas alagadas: 30 cm de água já arrastam um carro.",
              "Evite estacionar perto de córregos e em baixadas.",
              "Desligue a energia se a água entrar em casa.",
              "Procure locais altos e mantenha distância de fios elétricos.",
            ].map((dica) => (
              <li key={dica} className="flex gap-2 rounded-xl bg-white/10 p-3">
                <span className="text-alerta">●</span>
                {dica}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
