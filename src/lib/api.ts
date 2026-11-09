import {
  Alerta,
  Camera,
  EntradaAnaliseImagem,
  LocalEncontrado,
  Ocorrencia,
  PainelResumo,
  PrevisaoClima,
  Regiao,
  ResultadoAnaliseImagem,
  ResultadoRota,
  RiscoRegiao,
  Rota,
  SolicitacaoRota,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function chamar<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      cache: "no-store",
      ...opcoes,
      headers: { "Content-Type": "application/json", ...(opcoes?.headers || {}) },
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.erro || `Erro ${resposta.status} na API`);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }
  return resposta.json();
}

const enviar = (metodo: string, corpo?: unknown): RequestInit => ({
  method: metodo,
  body: corpo === undefined ? undefined : JSON.stringify(corpo),
});

export const buscarPainel = () => chamar<PainelResumo>("/api/painel");
export const buscarRiscos = (simulacao: boolean) => chamar<RiscoRegiao[]>(`/api/riscos?simulacao=${simulacao}`);
export const buscarClima = (latitude: number, longitude: number) =>
  chamar<PrevisaoClima>(`/api/clima?latitude=${latitude}&longitude=${longitude}`);
export const geocodificar = (endereco: string) =>
  chamar<LocalEncontrado[]>(`/api/geocodificacao?endereco=${encodeURIComponent(endereco)}`);

export const buscarRegioes = () => chamar<Regiao[]>("/api/regioes");
export const buscarCameras = () => chamar<Camera[]>("/api/cameras");

export const analisarImagem = (entrada: EntradaAnaliseImagem) =>
  chamar<ResultadoAnaliseImagem>("/api/monitoramento/analises", enviar("POST", entrada));

export const buscarOcorrencias = (filtro?: string) =>
  chamar<Ocorrencia[]>(`/api/ocorrencias${filtro ? `?${filtro}` : ""}`);
export const criarOcorrencia = (ocorrencia: Partial<Ocorrencia>) =>
  chamar<Ocorrencia>("/api/ocorrencias", enviar("POST", ocorrencia));
export const validarOcorrencia = (id: number, acao: "CONFIRMAR" | "DESCARTAR" | "RESOLVER", responsavel: string) =>
  chamar<Ocorrencia>(`/api/ocorrencias/${id}/validacao`, enviar("PUT", { acao, responsavel }));
export const excluirOcorrencia = (id: number) => chamar<void>(`/api/ocorrencias/${id}`, enviar("DELETE"));

export const buscarAlertas = (vigentes: boolean) => chamar<Alerta[]>(`/api/alertas?vigentes=${vigentes}`);
export const criarAlerta = (alerta: Partial<Alerta>) => chamar<Alerta>("/api/alertas", enviar("POST", alerta));
export const atualizarAlerta = (alerta: Alerta) => chamar<Alerta>(`/api/alertas/${alerta.id}`, enviar("PUT", alerta));
export const excluirAlerta = (id: number) => chamar<void>(`/api/alertas/${id}`, enviar("DELETE"));
export const gerarAlertasPrevisao = (simulacao: boolean) =>
  chamar<Alerta[]>(`/api/alertas/previsao?simulacao=${simulacao}`, enviar("POST"));

export const calcularRota = (solicitacao: SolicitacaoRota) => chamar<ResultadoRota>("/api/rotas", enviar("POST", solicitacao));
export const recalcularRota = (id: number) => chamar<ResultadoRota>(`/api/rotas/${id}`, enviar("PUT", {}));
export const buscarRotas = () => chamar<Rota[]>("/api/rotas");
export const buscarRota = (id: number) => chamar<Rota>(`/api/rotas/${id}`);
export const excluirRota = (id: number) => chamar<void>(`/api/rotas/${id}`, enviar("DELETE"));
