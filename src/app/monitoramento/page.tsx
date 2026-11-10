"use client";

import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Carregando, GotaCarregando } from "@/components/Carregando";
import { ImagemCamera } from "@/components/ImagemCamera";
import { NivelBadge } from "@/components/NivelBadge";
import { analisarImagem, buscarCameras, geocodificar } from "@/lib/api";
import { Camera, ResultadoAnaliseImagem } from "@/lib/types";
import { NIVEIS } from "@/lib/formato";

const CREDITOS = [
  "Enchente em 2005 - Felipe Fonseca (CC BY-SA 2.0)",
  "Alagamento em Coronel Fabriciano - HVL (CC BY 3.0)",
  "Alagamento Taboão - Jardiel Carvalho (CC BY 2.0)",
  "Natal Brazil Flood - Flaviohmg (CC BY-SA 3.0)",
  "Ruas de Paraty - Rodrigojordy (CC BY-SA 4.0)",
  "Rua deserta - Guilhermedesc (CC BY-SA 4.0)",
  "Cruzamento R. do Fico - Barão de Itararé (CC BY-SA 4.0)",
];

const FILTROS = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "aovivo", rotulo: "Ao vivo (CET-SP)" },
  { valor: "registro", rotulo: "Registros de enchente" },
] as const;

function reduzirImagem(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => reject(new Error("Arquivo não é uma imagem válida"));
      imagem.onload = () => {
        const escala = Math.min(1, 1280 / Math.max(imagem.width, imagem.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagem.width * escala);
        canvas.height = Math.round(imagem.height * escala);
        canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      imagem.src = leitor.result as string;
    };
    leitor.readAsDataURL(arquivo);
  });
}

function Selo({ camera }: { camera: Camera }) {
  if (camera.status !== "ATIVA") {
    return (
      <span className="rounded-full bg-slate-600 px-2 py-0.5 text-[10px] font-semibold text-white">
        {camera.status === "MANUTENCAO" ? "MANUTENÇÃO" : "INATIVA"}
      </span>
    );
  }
  if (camera.aoVivo) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> AO VIVO
      </span>
    );
  }
  return <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">REGISTRO DE ENCHENTE</span>;
}

function ResultadoCard({ resultado }: { resultado: ResultadoAnaliseImagem }) {
  const a = resultado.analise;
  const cor = NIVEIS[a.nivelRisco]?.cor ?? "#10b981";
  const nivelVisual = Math.min(100, (a.nivelAguaEstimadoCm / 80) * 100);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{a.alagamentoDetectado ? "🌊 Alagamento detectado" : "✅ Via sem alagamento"}</h2>
        <span className="rounded-full border border-ink/15 bg-brand-50 px-3 py-1 text-xs text-slate-700">
          {resultado.origemAnalise === "openai" ? "IA OpenAI (GPT-4o-mini Vision)" : "Motor local de visão computacional"}
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[110px_1fr]">
        <div className="flex flex-row items-center gap-4 sm:flex-col sm:gap-0">
          <div className="relative h-36 w-16 shrink-0 overflow-hidden rounded-xl border border-ink/15 bg-white">
            <div className="absolute bottom-0 w-full transition-all duration-700" style={{ height: `${nivelVisual}%`, backgroundColor: cor, opacity: 0.7 }} />
            {[15, 30, 50].map((cm) => (
              <div key={cm} className="absolute w-full border-t border-dashed border-ink/25 text-[9px] text-slate-500" style={{ bottom: `${(cm / 80) * 100}%` }}>
                <span className="pl-1">{cm}</span>
              </div>
            ))}
          </div>
          <div className="sm:text-center">
            <p className="mt-2 text-2xl font-bold text-ink">{a.nivelAguaEstimadoCm} cm</p>
            <p className="text-xs text-slate-500">altura estimada</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <NivelBadge nivel={a.nivelRisco} />
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${a.viaTransitavel ? "border-emerald-500/30 text-emerald-700" : "border-red-500/30 text-red-700"}`}>
              {a.viaTransitavel ? "Via transitável" : "Via intransitável"}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Confiança da análise</span>
              <span>{Math.round(a.confianca)}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-brand-50">
              <div className="h-2 rounded-full bg-brand-600" style={{ width: `${a.confianca}%` }} />
            </div>
          </div>
          <p className="text-sm text-slate-700">{a.descricao}</p>
          <p className="rounded-lg bg-brand-50 p-3 text-sm text-slate-800">{resultado.mensagem}</p>
          {resultado.ocorrencia && (
            <Link href="/ocorrencias" className="inline-block text-sm font-medium text-brand-700 hover:underline">
              Ir para a validação da ocorrência #{resultado.ocorrencia.id} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function JanelaCamera({ camera, onFechar }: { camera: Camera; onFechar: () => void }) {
  const [registrar, setRegistrar] = useState(true);
  const [resultado, setResultado] = useState<ResultadoAnaliseImagem | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const quadroAtual = useRef<string | null>(null);
  const ativa = camera.status === "ATIVA";

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", tecla);
    };
  }, [onFechar]);

  async function analisar() {
    setErro("");
    setResultado(null);
    setCarregando(true);
    try {
      setResultado(
        await analisarImagem({
          idCamera: camera.id,
          urlImagem: camera.aoVivo && quadroAtual.current ? quadroAtual.current : undefined,
          registrarOcorrencia: registrar,
        })
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro na análise");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={camera.nome}
        className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-agua-50 shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Selo camera={camera} />
              <p className="truncate font-titulo font-semibold text-ink">{camera.nome}</p>
            </div>
            <p className="truncate text-xs text-slate-500">{camera.endereco}</p>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-brand-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">
          <ImagemCamera
            camera={camera}
            intervalo={2500}
            mostrarHorario
            className="aspect-video w-full"
            onQuadro={(url) => (quadroAtual.current = url)}
          />

          <div className="space-y-4 p-4 sm:p-5">
            <p className="text-sm text-slate-600">
              {camera.aoVivo
                ? "Imagem ao vivo da câmera de trânsito da CET-SP, atualizada a cada poucos segundos. A análise usa o quadro que está na tela."
                : "Imagem registrada durante uma enchente, usada para demonstrar a detecção de alagamento."}
            </p>

            {ativa ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={registrar} onChange={(e) => setRegistrar(e.target.checked)} className="h-4 w-4 accent-teal-600" />
                  Registrar ocorrência se houver alagamento
                </label>
                <button className="botao w-full sm:w-auto" onClick={analisar} disabled={carregando}>
                  {carregando ? (
                    <span className="inline-flex items-center gap-2">
                      <GotaCarregando tamanho={16} className="!text-white" /> Analisando imagem...
                    </span>
                  ) : (
                    "Analisar com IA"
                  )}
                </button>
              </div>
            ) : (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800">
                Esta câmera está {camera.status === "MANUTENCAO" ? "em manutenção" : "inativa"} e não pode ser analisada.
              </p>
            )}

            {erro && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-800">{erro}</p>}
            {carregando && <Carregando texto="A IA está analisando a imagem..." className="w-full rounded-2xl border border-ink/10 bg-white p-5" />}
            {resultado && <ResultadoCard resultado={resultado} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MonitoramentoPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [aberta, setAberta] = useState<Camera | null>(null);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["valor"]>("todas");
  const [modo, setModo] = useState<"camera" | "foto">("camera");
  const [foto, setFoto] = useState("");
  const [endereco, setEndereco] = useState("");
  const [local, setLocal] = useState<{ latitude: number; longitude: number; nome: string } | null>(null);
  const [registrar, setRegistrar] = useState(true);
  const [resultado, setResultado] = useState<ResultadoAnaliseImagem | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoCameras, setCarregandoCameras] = useState(true);
  const [erro, setErro] = useState("");
  const fecharJanela = useCallback(() => setAberta(null), []);

  useEffect(() => {
    buscarCameras()
      .then((lista) => {
        const ordenadas = [...lista].sort((a, b) => Number(b.aoVivo) - Number(a.aoVivo) || a.id - b.id);
        setCameras(ordenadas);
        const id = new URLSearchParams(window.location.search).get("camera");
        const pedida = ordenadas.find((c) => String(c.id) === id);
        if (pedida) setAberta(pedida);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregandoCameras(false));
  }, []);

  const visiveis = cameras.filter((c) => (filtro === "todas" ? true : filtro === "aovivo" ? c.aoVivo : !c.aoVivo));

  async function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    try {
      setFoto(await reduzirImagem(arquivo));
      setResultado(null);
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Erro ao ler a foto");
    }
  }

  async function localizarEndereco() {
    setErro("");
    try {
      const encontrados = await geocodificar(endereco);
      if (encontrados.length === 0) throw new Error("Endereço não encontrado");
      setLocal({ ...encontrados[0], nome: encontrados[0].nome.split(",").slice(0, 3).join(",") });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao buscar o endereço");
    }
  }

  function usarMinhaLocalizacao() {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocal({ latitude: p.coords.latitude, longitude: p.coords.longitude, nome: "Minha localização" }),
      () => setErro("Não foi possível obter sua localização")
    );
  }

  async function analisarFoto() {
    setErro("");
    setCarregando(true);
    setResultado(null);
    try {
      if (!foto) throw new Error("Escolha uma foto");
      if (registrar && !local) throw new Error("Informe onde a foto foi tirada para registrar a ocorrência");
      setResultado(
        await analisarImagem({
          imagemBase64: foto,
          registrarOcorrencia: registrar,
          endereco: local?.nome || endereco,
          latitude: local?.latitude,
          longitude: local?.longitude,
        })
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro na análise");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <span className="etiqueta-secao">Serviços NexRain</span>
        <h1 className="titulo-pagina">Monitoramento por IA</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Escolha uma câmera para ver a imagem e pedir a análise. O modelo de visão computacional estima a altura da água
          e o risco para quem passa pela via. Se houver alagamento, a ocorrência é registrada com local, horário e nível
          de risco e fica aguardando validação da Defesa Civil.
        </p>
      </div>

      <div className="mb-5 flex w-fit rounded-lg border border-ink/15 bg-white p-1 text-sm">
        <button onClick={() => setModo("camera")} className={`rounded-md px-4 py-1.5 ${modo === "camera" ? "bg-brand-600 text-white" : "text-slate-700"}`}>
          Câmeras da cidade
        </button>
        <button onClick={() => setModo("foto")} className={`rounded-md px-4 py-1.5 ${modo === "foto" ? "bg-brand-600 text-white" : "text-slate-700"}`}>
          Enviar foto (cidadão)
        </button>
      </div>

      {modo === "camera" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                onClick={() => setFiltro(f.valor)}
                className={`rounded-full px-3.5 py-1.5 text-sm ${filtro === f.valor ? "bg-brand-600 text-white" : "border border-ink/15 bg-white text-slate-700 hover:bg-brand-50"}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>

          {erro && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-800">{erro}</p>}

          {carregandoCameras ? (
            <Carregando texto="Conectando às câmeras da cidade..." className="card w-full rounded-2xl p-6" />
          ) : visiveis.length === 0 ? (
            <p className="card rounded-2xl p-6 text-sm text-slate-600">
              {filtro === "aovivo" ? "Nenhuma câmera ao vivo cadastrada no momento." : "Nenhuma câmera encontrada neste filtro."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiveis.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAberta(c)}
                  className={`card group overflow-hidden rounded-2xl text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/50 ${c.status !== "ATIVA" ? "opacity-60" : ""}`}
                >
                  <div className="relative">
                    <ImagemCamera camera={c} intervalo={7000} className="aspect-video w-full" />
                    <span className="absolute left-2 top-2">
                      <Selo camera={c} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{c.nome}</p>
                      <p className="truncate text-xs text-slate-500">{c.endereco}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-brand-700 group-hover:underline">Abrir →</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
            Imagens ao vivo: câmeras públicas da CET - Companhia de Engenharia de Tráfego de São Paulo (cameras.cetsp.com.br).
            Registros de enchente: Wikimedia Commons - {CREDITOS.join(" · ")}.
          </p>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <div className="card rounded-2xl p-5">
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink/20 bg-white text-sm text-slate-500 hover:border-brand-500/50">
              {foto ? (
                <img src={foto} alt="Foto enviada" className="h-full w-full object-contain" />
              ) : (
                <>
                  <span className="text-4xl">📸</span>
                  <span className="mt-2">Toque para escolher ou tirar uma foto da rua</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={escolherFoto} />
            </label>
            <div className="mt-4 flex gap-2">
              <input className="campo" placeholder="Onde a foto foi tirada? (endereço)" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              <button className="botao-sec shrink-0" onClick={localizarEndereco}>Buscar</button>
              <button className="botao-sec shrink-0" onClick={usarMinhaLocalizacao} title="Usar GPS">📍</button>
            </div>
            {local && (
              <p className="mt-2 text-xs text-brand-700">
                Local: {local.nome} ({local.latitude.toFixed(4)}, {local.longitude.toFixed(4)})
              </p>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="card rounded-2xl p-5">
              <p className="text-sm text-slate-500">A foto é analisada pela mesma IA das câmeras.</p>
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={registrar} onChange={(e) => setRegistrar(e.target.checked)} className="h-4 w-4 accent-teal-600" />
                Registrar ocorrência se houver alagamento
              </label>
              <button className="botao mt-4 w-full" onClick={analisarFoto} disabled={carregando}>
                {carregando ? (
                  <span className="inline-flex items-center gap-2">
                    <GotaCarregando tamanho={16} className="!text-white" /> Analisando imagem...
                  </span>
                ) : (
                  "Analisar com IA"
                )}
              </button>
            </div>
            {erro && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-800">{erro}</p>}
            {carregando && <Carregando texto="A IA está analisando a imagem..." className="card w-full rounded-2xl p-6" />}
            {resultado && <ResultadoCard resultado={resultado} />}
          </aside>
        </div>
      )}

      {aberta && <JanelaCamera camera={aberta} onFechar={fecharJanela} />}
    </div>
  );
}
