"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { NivelBadge } from "@/components/NivelBadge";
import { analisarImagem, buscarCameras, geocodificar } from "@/lib/api";
import { Camera, ResultadoAnaliseImagem } from "@/lib/types";
import { NIVEIS } from "@/lib/formato";

// imagens publicas usadas como "cameras" no prototipo (Wikimedia Commons)
const CREDITOS = [
  "Enchente em 2005 - Felipe Fonseca (CC BY-SA 2.0)",
  "Alagamento em Coronel Fabriciano - HVL (CC BY 3.0)",
  "Alagamento Taboão - Jardiel Carvalho (CC BY 2.0)",
  "Natal Brazil Flood - Flaviohmg (CC BY-SA 3.0)",
  "Ruas de Paraty - Rodrigojordy (CC BY-SA 4.0)",
  "Rua deserta - Guilhermedesc (CC BY-SA 4.0)",
  "Cruzamento R. do Fico - Barão de Itararé (CC BY-SA 4.0)",
];

// reduz a foto antes de mandar pra API (menos dados no celular e na IA)
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

function ResultadoCard({ resultado }: { resultado: ResultadoAnaliseImagem }) {
  const a = resultado.analise;
  const cor = NIVEIS[a.nivelRisco]?.cor ?? "#10b981";
  const nivelVisual = Math.min(100, (a.nivelAguaEstimadoCm / 80) * 100);

  return (
    <div className="card rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{a.alagamentoDetectado ? "🌊 Alagamento detectado" : "✅ Via sem alagamento"}</h2>
        <span className="rounded-full border border-ink/15 bg-brand-50 px-3 py-1 text-xs text-slate-700">
          {resultado.origemAnalise === "openai" ? "IA OpenAI (GPT-4o-mini Vision)" : "Motor local de visão computacional"}
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[120px_1fr]">
        <div className="flex flex-col items-center">
          <div className="relative h-40 w-16 overflow-hidden rounded-xl border border-ink/15 bg-white">
            <div className="absolute bottom-0 w-full transition-all duration-700" style={{ height: `${nivelVisual}%`, backgroundColor: cor, opacity: 0.7 }} />
            {[15, 30, 50].map((cm) => (
              <div key={cm} className="absolute w-full border-t border-dashed border-ink/25 text-[9px] text-slate-500" style={{ bottom: `${(cm / 80) * 100}%` }}>
                <span className="pl-1">{cm}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{a.nivelAguaEstimadoCm} cm</p>
          <p className="text-xs text-slate-500">altura estimada</p>
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
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${a.confianca}%` }} />
            </div>
          </div>
          <p className="text-sm text-slate-700">{a.descricao}</p>
          <p className="rounded-lg bg-brand-50 p-3 text-sm text-slate-800">{resultado.mensagem}</p>
          {resultado.ocorrencia && (
            <Link href="/ocorrencias" className="inline-block text-sm text-brand-700 hover:underline">
              Ir para a validação da ocorrência #{resultado.ocorrencia.id} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonitoramentoPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selecionada, setSelecionada] = useState<Camera | null>(null);
  const [modo, setModo] = useState<"camera" | "foto">("camera");
  const [foto, setFoto] = useState("");
  const [endereco, setEndereco] = useState("");
  const [local, setLocal] = useState<{ latitude: number; longitude: number; nome: string } | null>(null);
  const [registrar, setRegistrar] = useState(true);
  const [resultado, setResultado] = useState<ResultadoAnaliseImagem | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarCameras()
      .then((lista) => {
        setCameras(lista);
        const id = new URLSearchParams(window.location.search).get("camera");
        setSelecionada(lista.find((c) => String(c.id) === id) ?? lista.find((c) => c.status === "ATIVA") ?? null);
      })
      .catch((e) => setErro(e.message));
  }, []);

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

  async function analisar() {
    setErro("");
    setCarregando(true);
    setResultado(null);
    try {
      if (modo === "camera") {
        if (!selecionada) throw new Error("Escolha uma câmera");
        setResultado(await analisarImagem({ idCamera: selecionada.id, registrarOcorrencia: registrar }));
      } else {
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
      }
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
          A API envia a imagem da câmera para o modelo de visão computacional, que estima a altura da água e o risco
          para quem passa pela via. Se houver alagamento, a ocorrência é registrada com local, horário e nível de risco
          e fica aguardando validação da Defesa Civil.
        </p>
      </div>

      <div className="mb-5 flex w-fit rounded-lg border border-ink/15 bg-brand-50 p-1 text-sm">
        <button onClick={() => setModo("camera")} className={`rounded-md px-4 py-1.5 ${modo === "camera" ? "bg-brand-500 text-white" : "text-slate-700"}`}>
          Câmeras da cidade
        </button>
        <button onClick={() => setModo("foto")} className={`rounded-md px-4 py-1.5 ${modo === "foto" ? "bg-brand-500 text-white" : "text-slate-700"}`}>
          Enviar foto (cidadão)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          {modo === "camera" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cameras.map((c) => {
                const ativa = c.status === "ATIVA";
                return (
                  <button
                    key={c.id}
                    disabled={!ativa}
                    onClick={() => {
                      setSelecionada(c);
                      setResultado(null);
                    }}
                    className={`card overflow-hidden rounded-2xl text-left transition-all ${
                      selecionada?.id === c.id ? "ring-2 ring-brand-600" : "hover:border-ink/30"
                    } ${!ativa ? "opacity-50" : ""}`}
                  >
                    <div className="relative aspect-video bg-white">
                      {c.urlImagem && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.urlImagem} alt={c.nome} className="h-full w-full object-cover" loading="lazy" />
                      )}
                      <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ativa ? "bg-red-600 text-white" : "bg-slate-600 text-slate-800"}`}>
                        {ativa ? "● AO VIVO" : c.status === "MANUTENCAO" ? "MANUTENÇÃO" : "INATIVA"}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-ink">{c.nome}</p>
                      <p className="text-xs text-slate-500">{c.endereco}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="card rounded-2xl p-5">
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink/20 bg-white text-sm text-slate-500 hover:border-brand-500/50">
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="Foto enviada" className="h-full w-full object-contain" />
                ) : (
                  <>
                    <span className="text-4xl">📸</span>
                    <span className="mt-2">Clique para escolher uma foto da rua</span>
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
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            Imagens de demonstração: Wikimedia Commons - {CREDITOS.join(" · ")}.
          </p>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card rounded-2xl p-5">
            {modo === "camera" && selecionada && (
              <>
                <p className="text-xs uppercase tracking-wider text-slate-500">Câmera selecionada</p>
                <p className="mt-1 font-semibold text-ink">{selecionada.nome}</p>
                <p className="text-sm text-slate-500">{selecionada.endereco}</p>
              </>
            )}
            {modo === "foto" && <p className="text-sm text-slate-500">A foto é analisada pela mesma IA das câmeras.</p>}
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={registrar} onChange={(e) => setRegistrar(e.target.checked)} className="accent-teal-600" />
              Registrar ocorrência se houver alagamento
            </label>
            <button className="botao mt-4 w-full" onClick={analisar} disabled={carregando}>
              {carregando ? "Analisando imagem..." : "Analisar com IA"}
            </button>
          </div>

          {erro && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-800">{erro}</p>}
          {resultado && <ResultadoCard resultado={resultado} />}
        </aside>
      </div>
    </div>
  );
}
