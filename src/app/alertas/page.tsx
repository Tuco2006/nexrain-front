"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { NivelBadge } from "@/components/NivelBadge";
import { atualizarAlerta, buscarAlertas, buscarRegioes, criarAlerta, excluirAlerta } from "@/lib/api";
import { Alerta, Nivel, Regiao } from "@/lib/types";
import { ORIGENS, formatarDataHora, haQuanto } from "@/lib/formato";

const BORDA: Record<Nivel, string> = {
  BAIXO: "border-l-emerald-500",
  MEDIO: "border-l-amber-500",
  ALTO: "border-l-orange-500",
  CRITICO: "border-l-red-500",
};

export default function AlertasPage() {
  const [vigentes, setVigentes] = useState(true);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [idRegiao, setIdRegiao] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [nivel, setNivel] = useState<Nivel>("ALTO");
  const [horas, setHoras] = useState("6");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setAlertas(await buscarAlertas(vigentes));
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [vigentes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    buscarRegioes()
      .then((r) => {
        setRegioes(r);
        if (r.length) setIdRegiao(String(r[0].id));
      })
      .catch(() => null);
  }, []);

  const nomeRegiao = (id: number) => regioes.find((r) => r.id === id)?.nome ?? `Região ${id}`;

  async function emitir(e: FormEvent) {
    e.preventDefault();
    setErro("");
    // horario de Sao Paulo no formato que a API espera
    const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const expira = new Date(agora.getTime() + Number(horas) * 3600000);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
    try {
      await criarAlerta({
        idRegiao: Number(idRegiao),
        titulo,
        mensagem,
        nivel,
        origem: "MANUAL",
        dataEmissao: iso(agora),
        dataExpiracao: iso(expira),
        ativo: true,
      });
      setTitulo("");
      setMensagem("");
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao emitir");
    }
  }

  async function alternar(a: Alerta) {
    try {
      await atualizarAlerta({ ...a, ativo: !a.ativo });
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar");
    }
  }

  async function excluir(a: Alerta) {
    if (!confirm(`Excluir o alerta "${a.titulo}"?`)) return;
    await excluirAlerta(a.id).catch((e) => setErro(e.message));
    carregar();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Alertas aos cidadãos</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Alertas gerados automaticamente por ocorrências confirmadas e pela previsão de chuva forte, além dos alertas
          manuais da Defesa Civil.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex gap-2">
            <button onClick={() => setVigentes(true)} className={`rounded-full px-3.5 py-1.5 text-sm ${vigentes ? "bg-brand-500 text-white" : "border border-white/10 text-slate-300"}`}>
              Em vigor
            </button>
            <button onClick={() => setVigentes(false)} className={`rounded-full px-3.5 py-1.5 text-sm ${!vigentes ? "bg-brand-500 text-white" : "border border-white/10 text-slate-300"}`}>
              Histórico completo
            </button>
          </div>

          {erro && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{erro}</p>}

          {carregando ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : alertas.length === 0 ? (
            <p className="card rounded-2xl p-6 text-sm text-slate-400">Nenhum alerta {vigentes ? "em vigor" : "registrado"}.</p>
          ) : (
            <div className="space-y-3">
              {alertas.map((a) => (
                <div key={a.id} className={`card rounded-2xl border-l-4 p-5 ${BORDA[a.nivel]} ${!a.ativo ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <NivelBadge nivel={a.nivel} />
                      <span className="text-xs text-slate-500">
                        {nomeRegiao(a.idRegiao)} · {ORIGENS[a.origem]}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{haQuanto(a.dataEmissao)}</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-white">{a.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-300">{a.mensagem}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      Emitido {formatarDataHora(a.dataEmissao)} · expira {formatarDataHora(a.dataExpiracao)}
                      {!a.ativo && " · encerrado"}
                    </span>
                    <div className="flex gap-1">
                      <button className="rounded px-2 py-1 text-brand-300 hover:bg-white/10" onClick={() => alternar(a)}>
                        {a.ativo ? "Encerrar" : "Reativar"}
                      </button>
                      <button className="rounded px-2 py-1 text-red-300 hover:bg-white/10" onClick={() => excluir(a)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={emitir} className="card flex h-fit flex-col gap-3 rounded-2xl p-5">
          <h2 className="font-semibold text-white">Emitir alerta manual</h2>
          <select className="campo" value={idRegiao} onChange={(e) => setIdRegiao(e.target.value)}>
            {regioes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          <input className="campo" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} required />
          <textarea className="campo min-h-[100px]" placeholder="Mensagem para a população" value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={500} required />
          <div className="grid grid-cols-2 gap-2">
            <select className="campo" value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)}>
              <option value="BAIXO">Baixo</option>
              <option value="MEDIO">Médio</option>
              <option value="ALTO">Alto</option>
              <option value="CRITICO">Crítico</option>
            </select>
            <select className="campo" value={horas} onChange={(e) => setHoras(e.target.value)}>
              <option value="1">Vale 1 h</option>
              <option value="3">Vale 3 h</option>
              <option value="6">Vale 6 h</option>
              <option value="12">Vale 12 h</option>
              <option value="24">Vale 24 h</option>
            </select>
          </div>
          <button className="botao">Emitir alerta</button>
        </form>
      </div>
    </div>
  );
}
