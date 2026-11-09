"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { Mapa, LeafletLib } from "@/components/Mapa";
import { NivelBadge } from "@/components/NivelBadge";
import { buscarOcorrencias, buscarRota, buscarRotas, calcularRota, excluirRota, geocodificar, recalcularRota } from "@/lib/api";
import { Coordenada, LocalEncontrado, Ocorrencia, ResultadoRota, Rota } from "@/lib/types";
import { NIVEIS, escapar, formatarDataHora } from "@/lib/formato";

const RAIO_OCORRENCIA: Record<string, number> = { CRITICO: 300, ALTO: 200, MEDIO: 120, BAIXO: 60 };

const SITUACAO = {
  SEGURA: { texto: "Rota segura", classe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800" },
  RISCO_REDUZIDO: { texto: "Risco reduzido", classe: "border-amber-500/30 bg-amber-500/10 text-amber-800" },
  COM_RISCO: { texto: "Rota com risco", classe: "border-red-500/30 bg-red-500/10 text-red-800" },
};

const EXEMPLOS = [
  { nome: "Sé → Shopping Ibirapuera", origem: "Praça da Sé", oLat: -23.5503, oLon: -46.6339, destino: "Shopping Ibirapuera", dLat: -23.61, dLon: -46.666 },
  { nome: "Lapa → Pompeia", origem: "Rua Guaicurus, Lapa", oLat: -23.523, oLon: -46.696, destino: "Allianz Parque", dLat: -23.5275, dLon: -46.6783 },
  { nome: "Luz → Liberdade", origem: "Estação da Luz", oLat: -23.5347, oLon: -46.6354, destino: "Praça da Liberdade", dLat: -23.5557, dLon: -46.6355 },
];

interface Ponto {
  texto: string;
  latitude?: number;
  longitude?: number;
}

function CampoEndereco({ rotulo, ponto, onChange, cor }: { rotulo: string; ponto: Ponto; onChange: (p: Ponto) => void; cor: string }) {
  const [sugestoes, setSugestoes] = useState<LocalEncontrado[]>([]);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    if (ponto.texto.trim().length < 3) return;
    setBuscando(true);
    try {
      setSugestoes(await geocodificar(ponto.texto));
    } catch {
      setSugestoes([]);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="relative">
      <label className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor }} />
        {rotulo}
        {ponto.latitude !== undefined && <span className="text-[10px] text-slate-500">(ponto definido)</span>}
      </label>
      <div className="flex gap-2">
        <input
          className="campo"
          value={ponto.texto}
          placeholder="Digite um endereço ou clique no mapa"
          onChange={(e) => onChange({ texto: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
        />
        <button type="button" className="botao-sec shrink-0" onClick={buscar} disabled={buscando}>
          {buscando ? "..." : "Buscar"}
        </button>
      </div>
      {sugestoes.length > 0 && (
        <div className="absolute z-[1100] mt-1 w-full overflow-hidden rounded-lg border border-ink/15 bg-white shadow-xl">
          {sugestoes.map((s) => (
            <button
              type="button"
              key={`${s.latitude}${s.longitude}`}
              className="block w-full px-3 py-2 text-left text-xs text-slate-800 hover:bg-brand-50"
              onClick={() => {
                onChange({ texto: s.nome.split(",").slice(0, 3).join(","), latitude: s.latitude, longitude: s.longitude });
                setSugestoes([]);
              }}
            >
              {s.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RotasPage() {
  const mapaRef = useRef<{ mapa: LeafletMap; L: LeafletLib } | null>(null);
  const camadaRota = useRef<LayerGroup | null>(null);
  const camadaOcorrencias = useRef<LayerGroup | null>(null);
  const proximoClique = useRef<"origem" | "destino">("origem");

  const [pronto, setPronto] = useState(false);
  const [origem, setOrigem] = useState<Ponto>({ texto: "" });
  const [destino, setDestino] = useState<Ponto>({ texto: "" });
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [resultado, setResultado] = useState<ResultadoRota | null>(null);
  const [historico, setHistorico] = useState<Rota[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const atualizarHistorico = useCallback(() => {
    buscarRotas().then(setHistorico).catch(() => null);
  }, []);

  useEffect(() => {
    buscarOcorrencias("ativas=true").then(setOcorrencias).catch((e) => setErro(e.message));
    atualizarHistorico();
  }, [atualizarHistorico]);

  const aoCriarMapa = useCallback((mapa: LeafletMap, L: LeafletLib) => {
    mapaRef.current = { mapa, L };
    // clicar no mapa define origem e depois destino
    mapa.on("click", (e) => {
      const ponto = { texto: `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`, latitude: e.latlng.lat, longitude: e.latlng.lng };
      if (proximoClique.current === "origem") {
        setOrigem(ponto);
        proximoClique.current = "destino";
      } else {
        setDestino(ponto);
        proximoClique.current = "origem";
      }
    });
    setPronto(true);
  }, []);

  // alagamentos ativos e o raio evitado pelo algoritmo
  useEffect(() => {
    if (!pronto || !mapaRef.current) return;
    const { mapa, L } = mapaRef.current;
    camadaOcorrencias.current?.remove();
    const grupo = L.layerGroup();
    ocorrencias.forEach((o) => {
      const cor = NIVEIS[o.nivelRisco].cor;
      L.circle([o.latitude, o.longitude], { radius: RAIO_OCORRENCIA[o.nivelRisco], color: cor, weight: 1.5, fillColor: cor, fillOpacity: 0.25 })
        .bindPopup(`<strong>🌊 ${escapar(o.endereco)}</strong><br/>${o.nivelAguaCm} cm de água · ${NIVEIS[o.nivelRisco].rotulo}<br/>Raio evitado: ${RAIO_OCORRENCIA[o.nivelRisco]} m`)
        .addTo(grupo);
    });
    grupo.addTo(mapa);
    camadaOcorrencias.current = grupo;
  }, [pronto, ocorrencias]);

  // marcadores de origem/destino enquanto o usuario escolhe
  useEffect(() => {
    if (!pronto || !mapaRef.current || resultado) return;
    const { mapa, L } = mapaRef.current;
    camadaRota.current?.remove();
    const grupo = L.layerGroup();
    [
      { p: origem, letra: "A", cor: "#136f93" },
      { p: destino, letra: "B", cor: "#7c3aed" },
    ].forEach(({ p, letra, cor }) => {
      if (p.latitude !== undefined && p.longitude !== undefined) {
        L.marker([p.latitude, p.longitude], {
          icon: L.divIcon({ className: "", html: `<div class="marcador-rota" style="width:26px;height:26px;background:${cor}">${letra}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
        }).addTo(grupo);
      }
    });
    grupo.addTo(mapa);
    camadaRota.current = grupo;
  }, [pronto, origem, destino, resultado]);

  const desenharRota = useCallback((rota: Rota) => {
    if (!mapaRef.current) return;
    const { mapa, L } = mapaRef.current;
    camadaRota.current?.remove();
    const grupo = L.layerGroup();
    const linha = (pontos: Coordenada[]) => pontos.map((p) => [p.latitude, p.longitude] as [number, number]);

    const mudou = JSON.stringify(rota.trajeto) !== JSON.stringify(rota.trajetoDireto);
    if (mudou && rota.trajetoDireto.length > 0) {
      L.polyline(linha(rota.trajetoDireto), { color: "#ef4444", weight: 5, opacity: 0.7, dashArray: "8 10" })
        .bindTooltip("Rota mais rápida (passa por alagamento)")
        .addTo(grupo);
    }
    L.polyline(linha(rota.trajeto), { color: "#ffffff", weight: 10, opacity: 0.95 }).addTo(grupo);
    const segura = L.polyline(linha(rota.trajeto), { color: rota.situacao === "SEGURA" ? "#0b7a70" : "#d97706", weight: 5 })
      .bindTooltip("Rota NexRain")
      .addTo(grupo);

    [
      { lat: rota.origemLat, lon: rota.origemLon, letra: "A", cor: "#136f93", nome: rota.origem },
      { lat: rota.destinoLat, lon: rota.destinoLon, letra: "B", cor: "#7c3aed", nome: rota.destino },
    ].forEach((m) =>
      L.marker([m.lat, m.lon], {
        icon: L.divIcon({ className: "", html: `<div class="marcador-rota" style="width:26px;height:26px;background:${m.cor}">${m.letra}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
      })
        .bindPopup(escapar(m.nome))
        .addTo(grupo)
    );

    grupo.addTo(mapa);
    camadaRota.current = grupo;
    mapa.fitBounds(segura.getBounds(), { padding: [40, 40] });
  }, []);

  async function calcular(e?: FormEvent, o: Ponto = origem, d: Ponto = destino) {
    e?.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const r = await calcularRota({
        origem: o.texto,
        origemLat: o.latitude,
        origemLon: o.longitude,
        destino: d.texto,
        destinoLat: d.latitude,
        destinoLon: d.longitude,
      });
      setResultado(r);
      desenharRota(r.rota);
      atualizarHistorico();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao calcular a rota");
    } finally {
      setCarregando(false);
    }
  }

  function usarExemplo(ex: (typeof EXEMPLOS)[number]) {
    const o = { texto: ex.origem, latitude: ex.oLat, longitude: ex.oLon };
    const d = { texto: ex.destino, latitude: ex.dLat, longitude: ex.dLon };
    setOrigem(o);
    setDestino(d);
    calcular(undefined, o, d);
  }

  async function abrirHistorico(id: number) {
    setErro("");
    try {
      const rota = await buscarRota(id);
      setResultado({ rota, alagamentosNoCaminhoDireto: [], alagamentosNoTrajeto: [], alternativasAvaliadas: 0, mensagem: "Rota carregada do histórico." });
      desenharRota(rota);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao abrir a rota");
    }
  }

  async function recalcular(id: number) {
    setCarregando(true);
    try {
      const r = await recalcularRota(id);
      setResultado(r);
      desenharRota(r.rota);
      atualizarHistorico();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao recalcular");
    } finally {
      setCarregando(false);
    }
  }

  async function excluir(id: number) {
    await excluirRota(id).catch(() => null);
    if (resultado?.rota.id === id) {
      setResultado(null);
    }
    atualizarHistorico();
  }

  function limpar() {
    setResultado(null);
    setOrigem({ texto: "" });
    setDestino({ texto: "" });
    proximoClique.current = "origem";
  }

  const rota = resultado?.rota;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <span className="etiqueta-secao">Serviços NexRain</span>
        <h1 className="titulo-pagina">Rota segura</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          O algoritmo da API pede ao OSRM a rota mais rápida e as alternativas, descarta as que passam no raio de um
          alagamento ativo e, se precisar, cria pontos de desvio dos dois lados da rua alagada até achar um caminho seguro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="flex flex-col gap-4">
          <form onSubmit={calcular} className="card flex flex-col gap-4 rounded-2xl p-5">
            <CampoEndereco rotulo="Origem" ponto={origem} onChange={setOrigem} cor="#136f93" />
            <CampoEndereco rotulo="Destino" ponto={destino} onChange={setDestino} cor="#7c3aed" />
            <div className="flex gap-2">
              <button className="botao flex-1" disabled={carregando || !origem.texto || !destino.texto}>
                {carregando ? "Calculando..." : "Calcular rota segura"}
              </button>
              <button type="button" className="botao-sec" onClick={limpar}>
                Limpar
              </button>
            </div>
            <div>
              <p className="mb-2 text-xs text-slate-500">Exemplos que passam por alagamentos:</p>
              <div className="flex flex-wrap gap-2">
                {EXEMPLOS.map((ex) => (
                  <button key={ex.nome} type="button" className="rounded-full border border-ink/15 px-3 py-1 text-xs text-slate-700 hover:bg-brand-50" onClick={() => usarExemplo(ex)}>
                    {ex.nome}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {erro && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-800">{erro}</p>}

          {rota && (
            <div className="card rounded-2xl p-5">
              <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${SITUACAO[rota.situacao].classe}`}>{SITUACAO[rota.situacao].texto}</div>
              <p className="mt-3 text-sm text-slate-700">{resultado?.mensagem}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-2xl font-bold text-ink">{rota.distanciaKm} km</p>
                  <p className="text-xs text-slate-500">direta: {rota.distanciaDiretaKm} km</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-2xl font-bold text-ink">{Math.round(rota.duracaoMin)} min</p>
                  <p className="text-xs text-slate-500">+{rota.minutosExtras} min de desvio</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-2xl font-bold text-emerald-700">{rota.alagamentosEvitados}</p>
                  <p className="text-xs text-slate-500">alagamentos evitados</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className={`text-2xl font-bold ${rota.alagamentosNoTrajeto ? "text-red-700" : "text-ink"}`}>{rota.alagamentosNoTrajeto}</p>
                  <p className="text-xs text-slate-500">no trajeto escolhido</p>
                </div>
              </div>
              {resultado && resultado.alagamentosNoCaminhoDireto.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500">A rota mais rápida passaria por:</p>
                  <ul className="mt-2 space-y-1.5">
                    {resultado.alagamentosNoCaminhoDireto.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-2 text-xs text-slate-700">
                        <span className="truncate">{o.endereco}</span>
                        <NivelBadge nivel={o.nivelRisco} prefixo="" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resultado && resultado.alternativasAvaliadas > 0 && (
                <p className="mt-4 text-xs text-slate-500">{resultado.alternativasAvaliadas} caminhos avaliados pelo algoritmo · rota #{rota.id}</p>
              )}
              <div className="mt-3 flex gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-brand-600" /> NexRain</span>
                <span className="flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-red-500" /> mais rápida</span>
              </div>
            </div>
          )}
        </aside>

        <div className="flex flex-col gap-4">
          <div className="card relative overflow-hidden rounded-2xl">
            <Mapa className="h-[62vh] min-h-[400px] w-full" onPronto={aoCriarMapa} />
            {!rota && (
              <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-white/95 shadow px-4 py-1.5 text-xs text-slate-700">
                Clique no mapa: 1º clique = origem, 2º clique = destino
              </div>
            )}
          </div>

          <div className="card rounded-2xl p-5">
            <h2 className="font-semibold text-ink">Histórico de rotas</h2>
            {historico.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nenhuma rota calculada ainda.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr>
                      <th className="pb-2">#</th>
                      <th className="pb-2">Trajeto</th>
                      <th className="pb-2">Distância</th>
                      <th className="pb-2">Evitados</th>
                      <th className="pb-2">Calculada</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {historico.slice(0, 8).map((h) => (
                      <tr key={h.id} className="border-t border-ink/10 text-slate-700">
                        <td className="py-2">{h.id}</td>
                        <td className="max-w-[260px] truncate py-2">
                          {h.origem.split(",")[0]} → {h.destino.split(",")[0]}
                        </td>
                        <td className="py-2">{h.distanciaKm} km</td>
                        <td className="py-2">{h.alagamentosEvitados}</td>
                        <td className="py-2 text-xs">{formatarDataHora(h.dataCalculo)}</td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="rounded px-2 py-1 text-xs text-brand-700 hover:bg-brand-50" onClick={() => abrirHistorico(h.id)}>Ver</button>
                            <button className="rounded px-2 py-1 text-xs text-brand-700 hover:bg-brand-50" onClick={() => recalcular(h.id)}>Recalcular</button>
                            <button className="rounded px-2 py-1 text-xs text-red-700 hover:bg-brand-50" onClick={() => excluir(h.id)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
