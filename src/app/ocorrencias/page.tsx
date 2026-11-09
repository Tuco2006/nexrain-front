"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { NivelBadge, StatusBadge } from "@/components/NivelBadge";
import { buscarOcorrencias, criarOcorrencia, excluirOcorrencia, geocodificar, validarOcorrencia } from "@/lib/api";
import { Ocorrencia } from "@/lib/types";
import { ORIGENS, formatarDataHora, haQuanto } from "@/lib/formato";

const FILTROS = [
  { rotulo: "Ativas", valor: "ativas=true" },
  { rotulo: "Pendentes", valor: "status=PENDENTE" },
  { rotulo: "Confirmadas", valor: "status=CONFIRMADA" },
  { rotulo: "Resolvidas", valor: "status=RESOLVIDA" },
  { rotulo: "Descartadas", valor: "status=DESCARTADA" },
  { rotulo: "Todas", valor: "" },
];

export default function OcorrenciasPage() {
  const [filtro, setFiltro] = useState(FILTROS[0].valor);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [responsavel, setResponsavel] = useState("Defesa Civil - Operador 01");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const [endereco, setEndereco] = useState("");
  const [nivelAgua, setNivelAgua] = useState("20");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setOcorrencias(await buscarOcorrencias(filtro));
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function agir(o: Ocorrencia, acao: "CONFIRMAR" | "DESCARTAR" | "RESOLVER") {
    setErro("");
    setAviso("");
    try {
      const atualizada = await validarOcorrencia(o.id, acao, responsavel);
      setAviso(
        acao === "CONFIRMAR" && (atualizada.nivelRisco === "ALTO" || atualizada.nivelRisco === "CRITICO")
          ? `Ocorrência #${o.id} confirmada e alerta emitido para a população.`
          : `Ocorrência #${o.id} atualizada para ${atualizada.status.toLowerCase()}.`
      );
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao validar");
    }
  }

  async function excluir(o: Ocorrencia) {
    if (!confirm(`Excluir a ocorrência #${o.id}?`)) return;
    try {
      await excluirOcorrencia(o.id);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  async function relatar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);
    try {
      const locais = await geocodificar(endereco);
      if (locais.length === 0) throw new Error("Endereço não encontrado, tente com o nome da rua e o bairro");
      const nova = await criarOcorrencia({
        endereco: locais[0].nome.split(",").slice(0, 3).join(",").slice(0, 150),
        latitude: locais[0].latitude,
        longitude: locais[0].longitude,
        nivelAguaCm: Number(nivelAgua),
        descricao: descricao || undefined,
        origem: "CIDADAO",
      });
      setAviso(`Relato registrado como ocorrência #${nova.id} (risco ${nova.nivelRisco.toLowerCase()}), aguardando validação.`);
      setEndereco("");
      setDescricao("");
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Ocorrências de alagamento</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Registros vindos da IA das câmeras e dos relatos de cidadãos. O operador confirma ou descarta cada um; ao
          confirmar um alagamento alto ou crítico a API emite um alerta automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.rotulo}
                onClick={() => setFiltro(f.valor)}
                className={`rounded-full px-3.5 py-1.5 text-sm ${filtro === f.valor ? "bg-brand-500 text-white" : "border border-white/10 text-slate-300 hover:bg-white/5"}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>

          {erro && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{erro}</p>}
          {aviso && <p className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-sm text-brand-200">{aviso}</p>}

          {carregando ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : ocorrencias.length === 0 ? (
            <p className="card rounded-2xl p-6 text-sm text-slate-400">Nenhuma ocorrência neste filtro.</p>
          ) : (
            <div className="space-y-3">
              {ocorrencias.map((o) => (
                <div key={o.id} className="card rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">#{o.id}</span>
                        <StatusBadge status={o.status} />
                        <NivelBadge nivel={o.nivelRisco} />
                      </div>
                      <h3 className="mt-2 font-semibold text-white">{o.endereco}</h3>
                      <p className="text-xs text-slate-500">
                        {formatarDataHora(o.dataHora)} ({haQuanto(o.dataHora)}) · {ORIGENS[o.origem]}
                        {o.confianca > 0 && ` · confiança ${Math.round(o.confianca)}%`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{o.nivelAguaCm} cm</p>
                      <p className="text-xs text-slate-500">de água</p>
                    </div>
                  </div>
                  {o.descricao && <p className="mt-3 text-sm text-slate-300">{o.descricao}</p>}
                  {o.validadoPor && (
                    <p className="mt-2 text-xs text-slate-500">
                      Validado por {o.validadoPor} em {formatarDataHora(o.dataValidacao)}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.status === "PENDENTE" && (
                      <>
                        <button className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500" onClick={() => agir(o, "CONFIRMAR")}>
                          Confirmar alagamento
                        </button>
                        <button className="botao-sec !py-1.5 text-xs" onClick={() => agir(o, "DESCARTAR")}>
                          Descartar (falso positivo)
                        </button>
                      </>
                    )}
                    {(o.status === "PENDENTE" || o.status === "CONFIRMADA") && (
                      <button className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600" onClick={() => agir(o, "RESOLVER")}>
                        Marcar como resolvida
                      </button>
                    )}
                    <button className="ml-auto rounded-lg px-3 py-1.5 text-xs text-red-300 hover:bg-white/5" onClick={() => excluir(o)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card rounded-2xl p-5">
            <label className="text-xs font-medium text-slate-400">Operador responsável pela validação</label>
            <input className="campo mt-1" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>

          <form onSubmit={relatar} className="card flex flex-col gap-3 rounded-2xl p-5">
            <h2 className="font-semibold text-white">Relatar alagamento</h2>
            <p className="text-xs text-slate-500">Canal do cidadão. A região é definida automaticamente pela localização.</p>
            <input className="campo" placeholder="Endereço (ex: Av. do Estado, Cambuci)" value={endereco} onChange={(e) => setEndereco(e.target.value)} required />
            <div>
              <label className="text-xs text-slate-400">Altura aproximada da água: {nivelAgua} cm</label>
              <input type="range" min={0} max={100} step={5} value={nivelAgua} onChange={(e) => setNivelAgua(e.target.value)} className="w-full accent-sky-500" />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>poças</span>
                <span>guia (15)</span>
                <span>roda (30)</span>
                <span>porta (50+)</span>
              </div>
            </div>
            <textarea className="campo min-h-[80px]" placeholder="O que você está vendo? (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={400} />
            <button className="botao" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar relato"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
