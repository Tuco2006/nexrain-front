"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import { Mapa, LeafletLib } from "@/components/Mapa";
import { NivelBadge } from "@/components/NivelBadge";
import { buscarCameras, buscarClima, buscarOcorrencias, buscarRiscos, gerarAlertasPrevisao } from "@/lib/api";
import { Camera, Ocorrencia, PrevisaoClima, RiscoRegiao } from "@/lib/types";
import { NIVEIS, escapar, formatarDataHora } from "@/lib/formato";

const RAIO_OCORRENCIA: Record<string, number> = { CRITICO: 300, ALTO: 200, MEDIO: 120, BAIXO: 60 };

function graficoChuva(previsao: PrevisaoClima) {
  const horas = previsao.proximasHoras.slice(0, 12);
  const maximo = Math.max(5, ...horas.map((h) => h.precipitacaoMm));
  const barras = horas
    .map((h) => {
      const altura = Math.max(2, (h.precipitacaoMm / maximo) * 48);
      return `<div title="${h.hora.slice(11, 16)} - ${h.precipitacaoMm} mm (${h.probabilidade}%)" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="height:48px;display:flex;align-items:flex-end;width:100%"><div style="width:100%;height:${altura}px;background:#0f9488;border-radius:2px;opacity:${0.35 + h.probabilidade / 160}"></div></div>
        <span style="font-size:9px;color:#64748b">${h.hora.slice(11, 13)}h</span></div>`;
    })
    .join("");
  return `<div style="display:flex;gap:2px;margin-top:8px">${barras}</div>`;
}

export default function MapaPage() {
  const mapaRef = useRef<{ mapa: LeafletMap; L: LeafletLib } | null>(null);
  const camadas = useRef<{ regioes?: LayerGroup; ocorrencias?: LayerGroup; cameras?: LayerGroup; radar?: TileLayer }>({});

  const [pronto, setPronto] = useState(false);
  const [simulacao, setSimulacao] = useState(false);
  const [mostrarRadar, setMostrarRadar] = useState(true);
  const [mostrarCameras, setMostrarCameras] = useState(true);
  const [riscos, setRiscos] = useState<RiscoRegiao[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [radarHora, setRadarHora] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async (sim: boolean) => {
    setCarregando(true);
    setErro("");
    try {
      const [r, o, c] = await Promise.all([buscarRiscos(sim), buscarOcorrencias("ativas=true"), buscarCameras()]);
      setRiscos(r);
      setOcorrencias(o);
      setCameras(c);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o mapa");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(simulacao);
  }, [simulacao, carregar]);

  const aoCriarMapa = useCallback((mapa: LeafletMap, L: LeafletLib) => {
    mapaRef.current = { mapa, L };

    // clique em qualquer ponto mostra o clima e a chuva prevista das proximas 12h
    mapa.on("click", async (evento) => {
      const { lat, lng } = evento.latlng;
      const popup = L.popup().setLatLng(evento.latlng).setContent("Consultando a previsão...").openOn(mapa);
      try {
        const p = await buscarClima(Number(lat.toFixed(4)), Number(lng.toFixed(4)));
        popup.setContent(
          `<strong>${escapar(p.descricaoTempo)}</strong> · ${p.temperatura.toFixed(1)} °C · umidade ${p.umidade}%<br/>
           Chuva agora: ${p.precipitacaoAtual} mm · próximas 3h: ${p.proximasHoras.slice(0, 3).reduce((s, h) => s + h.precipitacaoMm, 0).toFixed(1)} mm
           ${graficoChuva(p)}<div style="font-size:10px;color:#64748b;margin-top:4px">Fonte: ${escapar(p.fonte)}</div>`
        );
      } catch (e) {
        popup.setContent(e instanceof Error ? escapar(e.message) : "Erro ao consultar o clima");
      }
    });
    setPronto(true);
  }, []);

  // radar meteorologico em tempo real (RainViewer)
  useEffect(() => {
    if (!pronto || !mapaRef.current) return;
    const { mapa, L } = mapaRef.current;
    camadas.current.radar?.remove();
    camadas.current.radar = undefined;
    if (!mostrarRadar) return;

    let cancelado = false;
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((r) => r.json())
      .then((dados) => {
        if (cancelado) return;
        const ultimo = dados.radar.past[dados.radar.past.length - 1];
        camadas.current.radar = L.tileLayer(`${dados.host}${ultimo.path}/256/{z}/{x}/{y}/2/1_1.png`, {
          opacity: 0.65,
          maxNativeZoom: 7,
          maxZoom: 19,
          zIndex: 300,
          attribution: 'Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>',
        }).addTo(mapa);
        setRadarHora(new Date(ultimo.time * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => setRadarHora("indisponível"));
    return () => {
      cancelado = true;
    };
  }, [pronto, mostrarRadar]);

  // regioes pintadas pelo risco
  useEffect(() => {
    if (!pronto || !mapaRef.current) return;
    const { mapa, L } = mapaRef.current;
    camadas.current.regioes?.remove();
    const grupo = L.layerGroup();

    riscos.forEach((r) => {
      const cor = NIVEIS[r.nivel].cor;
      L.circle([r.regiao.latitude, r.regiao.longitude], {
        radius: 1100,
        color: cor,
        weight: 1.5,
        fillColor: cor,
        fillOpacity: r.nivel === "BAIXO" ? 0.12 : 0.28,
      })
        .bindPopup(
          `<strong style="font-size:14px">${escapar(r.regiao.nome)}</strong><br/>
           <span style="color:${cor};font-weight:700">Risco ${NIVEIS[r.nivel].rotulo.toLowerCase()} · índice ${r.indice}/100</span><br/>
           ${escapar(r.descricaoTempo || "")} · chuva máx. 6h: ${r.chuvaMaxima6h} mm/h · prob. ${r.probabilidadeChuva}%
           <ul style="margin:6px 0 6px 16px;padding:0">${r.fatores.map((f) => `<li>${escapar(f)}</li>`).join("")}</ul>
           <em style="color:#94a3b8">${escapar(r.recomendacao)}</em>`
        )
        .addTo(grupo);
    });
    grupo.addTo(mapa);
    camadas.current.regioes = grupo;
  }, [pronto, riscos]);

  // ocorrencias ativas com o raio que o algoritmo de rotas evita
  useEffect(() => {
    if (!pronto || !mapaRef.current) return;
    const { mapa, L } = mapaRef.current;
    camadas.current.ocorrencias?.remove();
    const grupo = L.layerGroup();

    ocorrencias.forEach((o) => {
      const cor = NIVEIS[o.nivelRisco].cor;
      L.circle([o.latitude, o.longitude], {
        radius: RAIO_OCORRENCIA[o.nivelRisco],
        color: cor,
        weight: 1,
        dashArray: "4 4",
        fillOpacity: 0.08,
      }).addTo(grupo);
      L.circleMarker([o.latitude, o.longitude], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: cor,
        fillOpacity: 1,
      })
        .bindPopup(
          `<strong>🌊 ${escapar(o.endereco)}</strong><br/>
           Água: ${o.nivelAguaCm} cm · <span style="color:${cor};font-weight:700">${NIVEIS[o.nivelRisco].rotulo}</span><br/>
           Status: ${o.status.toLowerCase()} · ${formatarDataHora(o.dataHora)}<br/>
           ${o.descricao ? `<span style="color:#94a3b8">${escapar(o.descricao)}</span>` : ""}`
        )
        .addTo(grupo);
    });
    grupo.addTo(mapa);
    camadas.current.ocorrencias = grupo;
  }, [pronto, ocorrencias]);

  // cameras
  useEffect(() => {
    if (!pronto || !mapaRef.current) return;
    const { mapa, L } = mapaRef.current;
    camadas.current.cameras?.remove();
    if (!mostrarCameras) return;
    const grupo = L.layerGroup();

    cameras.forEach((c) => {
      const icone = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:6px;background:${c.status === "ATIVA" ? "#0b7a70" : "#64748b"};border:2px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:12px">📷</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([c.latitude, c.longitude], { icon: icone })
        .bindPopup(
          `<strong>${escapar(c.nome)}</strong><br/>${escapar(c.endereco)}<br/>Status: ${c.status.toLowerCase()}
           ${c.urlImagem ? `<img src="${escapar(c.urlImagem)}" alt="" style="margin-top:6px;width:220px;border-radius:6px"/>` : ""}
           <br/><a href="/monitoramento?camera=${c.id}">Analisar com IA →</a>`
        )
        .addTo(grupo);
    });
    grupo.addTo(mapa);
    camadas.current.cameras = grupo;
  }, [pronto, cameras, mostrarCameras]);

  async function gerarAlertas() {
    setAviso("");
    try {
      const gerados = await gerarAlertasPrevisao(simulacao);
      setAviso(
        gerados.length > 0
          ? `${gerados.length} alerta(s) emitido(s) para as regiões em risco alto ou crítico.`
          : "Nenhum alerta novo: não há regiões em risco alto/crítico sem alerta vigente."
      );
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Erro ao gerar alertas");
    }
  }

  const emRisco = riscos.filter((r) => r.nivel === "ALTO" || r.nivel === "CRITICO").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="etiqueta-secao">Serviços NexRain</span>
        <h1 className="titulo-pagina">Mapa de risco de alagamento</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Risco por região calculado pela API Java com a previsão real da Open-Meteo, o histórico de cada bairro e as
            ocorrências ativas. Clique em qualquer ponto do mapa para ver a chuva prevista hora a hora.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-ink/15 bg-brand-50 p-1 text-sm">
            <button
              onClick={() => setSimulacao(false)}
              className={`rounded-md px-3 py-1.5 ${!simulacao ? "bg-brand-500 text-white" : "text-slate-700"}`}
            >
              Previsão real
            </button>
            <button
              onClick={() => setSimulacao(true)}
              className={`rounded-md px-3 py-1.5 ${simulacao ? "bg-red-500 text-white" : "text-slate-700"}`}
            >
              Simular temporal
            </button>
          </div>
          <button className="botao-sec" onClick={() => setMostrarRadar((v) => !v)}>
            {mostrarRadar ? "Ocultar radar" : "Mostrar radar"}
          </button>
          <button className="botao-sec" onClick={() => setMostrarCameras((v) => !v)}>
            {mostrarCameras ? "Ocultar câmeras" : "Mostrar câmeras"}
          </button>
        </div>
      </div>

      {erro && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800">{erro}</p>}
      {simulacao && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-800">
          Cenário simulado: um temporal de verão de até 52 mm/h centrado na zona oeste é somado à previsão real, para
          demonstrar como o NexRain reage a uma chuva forte.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card relative overflow-hidden rounded-2xl">
          <Mapa className="h-[70vh] min-h-[420px] w-full" onPronto={aoCriarMapa} />
          {carregando && (
            <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-white/95 shadow px-4 py-1.5 text-xs text-slate-700">
              Atualizando previsão...
            </div>
          )}
          <div className="absolute bottom-6 left-3 z-[500] rounded-xl bg-white/95 shadow p-3 text-xs text-slate-700">
            {(Object.keys(NIVEIS) as (keyof typeof NIVEIS)[]).map((n) => (
              <div key={n} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NIVEIS[n].cor }} />
                Risco {NIVEIS[n].rotulo.toLowerCase()}
              </div>
            ))}
            {mostrarRadar && <div className="mt-1 text-slate-500">Radar: {radarHora || "carregando"}</div>}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card rounded-2xl p-5">
            <p className="text-sm text-slate-500">Regiões em risco alto ou crítico</p>
            <p className="mt-1 text-4xl font-bold text-ink">
              {emRisco}
              <span className="text-lg text-slate-500"> / {riscos.length}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{ocorrencias.length} alagamento(s) ativo(s) no mapa</p>
            <button className="botao mt-4 w-full" onClick={gerarAlertas}>
              Emitir alertas pela previsão
            </button>
            {aviso && <p className="mt-3 text-xs text-brand-700">{aviso}</p>}
          </div>

          <div className="card max-h-[52vh] overflow-y-auto rounded-2xl p-2">
            {riscos.map((r) => (
              <button
                key={r.regiao.id}
                onClick={() => mapaRef.current?.mapa.flyTo([r.regiao.latitude, r.regiao.longitude], 14)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{r.regiao.nome}</p>
                  <p className="text-xs text-slate-500">
                    {r.chuvaMaxima6h} mm/h · {r.probabilidadeChuva}% · {r.ocorrenciasAtivas} ocorr.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <NivelBadge nivel={r.nivel} prefixo="" />
                  <span className="text-[10px] text-slate-500">índice {r.indice}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
