"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buscarAlertas, buscarPainel } from "@/lib/api";
import { Alerta, PainelResumo } from "@/lib/types";
import { NivelBadge } from "@/components/NivelBadge";
import { haQuanto } from "@/lib/formato";

const pilares = [
  {
    numero: "01",
    titulo: "Monitoramento por IA",
    texto: "Visão computacional analisa as imagens das câmeras urbanas e identifica ruas alagadas, estimando a altura da água.",
    href: "/monitoramento",
  },
  {
    numero: "02",
    titulo: "Análise e registro",
    texto: "Cada alagamento vira uma ocorrência com local, horário e nível de risco, que a Defesa Civil confirma ou descarta.",
    href: "/ocorrencias",
  },
  {
    numero: "03",
    titulo: "Alertas aos cidadãos",
    texto: "Ocorrências graves e a previsão de chuva forte geram alertas automáticos para as regiões afetadas.",
    href: "/alertas",
  },
  {
    numero: "04",
    titulo: "Mobilidade inteligente",
    texto: "Um algoritmo de roteamento testa caminhos alternativos e escolhe o que passa longe das ruas comprometidas.",
    href: "/rotas",
  },
];

const fontes = [
  { nome: "Open-Meteo", texto: "Previsão de chuva hora a hora para cada bairro monitorado.", icone: "🌧️" },
  { nome: "RainViewer", texto: "Radar meteorológico em tempo real sobreposto ao mapa.", icone: "📡" },
  { nome: "OpenStreetMap + OSRM", texto: "Malha viária e cálculo das rotas de carro.", icone: "🗺️" },
  { nome: "OpenAI Vision", texto: "Leitura das imagens das câmeras (com motor local de reserva).", icone: "🧠" },
];

export default function HomePage() {
  const [painel, setPainel] = useState<PainelResumo | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarPainel().then(setPainel).catch((e) => setErro(e.message));
    buscarAlertas(true).then(setAlertas).catch(() => null);
  }, []);

  const numeros = [
    { rotulo: "Regiões monitoradas", valor: painel?.regioesMonitoradas },
    { rotulo: "Câmeras ativas", valor: painel?.camerasAtivas },
    { rotulo: "Alagamentos ativos", valor: painel?.ocorrenciasAtivas },
    { rotulo: "Aguardando validação", valor: painel?.ocorrenciasPendentes },
    { rotulo: "Alertas vigentes", valor: painel?.alertasAtivos },
    { rotulo: "Rotas calculadas", valor: painel?.rotasCalculadas },
  ];

  return (
    <div>
      <section className="bg-grid relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-300">
            Global Solution 2026 · CitizenTech
          </span>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            A chuva não precisa
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent"> te pegar de surpresa</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            O NexRain usa inteligência artificial para identificar alagamentos nas câmeras da cidade, cruza com a
            previsão de chuva em tempo real e calcula rotas que desviam das ruas comprometidas.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/mapa"
              className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
            >
              Ver mapa de risco
            </Link>
            <Link
              href="/rotas"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Calcular rota segura
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {erro && (
          <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{erro}</p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {numeros.map((n) => (
            <div key={n.rotulo} className="card rounded-2xl p-5">
              <p className="text-3xl font-bold text-white">{n.valor ?? "–"}</p>
              <p className="mt-1 text-xs text-slate-400">{n.rotulo}</p>
            </div>
          ))}
        </div>

        {alertas.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Alertas em vigor</h2>
              <Link href="/alertas" className="text-sm text-brand-300 hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {alertas.slice(0, 3).map((a) => (
                <div key={a.id} className="card rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-2">
                    <NivelBadge nivel={a.nivel} prefixo="" />
                    <span className="text-xs text-slate-500">{haQuanto(a.dataEmissao)}</span>
                  </div>
                  <h3 className="mt-3 font-semibold text-white">{a.titulo}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-400">{a.mensagem}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">Como funciona</h2>
          <p className="mt-2 text-slate-400">Os quatro pilares da solução, do vídeo da câmera até o trajeto do cidadão.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map((p) => (
            <Link key={p.numero} href={p.href} className="card group rounded-2xl p-7 transition-colors hover:border-brand-500/40">
              <span className="text-3xl font-bold text-white/10">{p.numero}</span>
              <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-brand-300">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.texto}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 bg-base-900/40 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white">Dados reais, não maquete</h2>
            <p className="mt-2 text-slate-400">O protótipo consome APIs públicas em tempo real.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {fontes.map((f) => (
              <div key={f.nome} className="card rounded-2xl p-6">
                <span className="text-3xl">{f.icone}</span>
                <h3 className="mt-4 font-semibold text-white">{f.nome}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
