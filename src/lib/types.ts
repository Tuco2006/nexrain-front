export type Nivel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
export type StatusOcorrencia = "PENDENTE" | "CONFIRMADA" | "DESCARTADA" | "RESOLVIDA";
export type OrigemOcorrencia = "IA_CAMERA" | "CIDADAO" | "OPERADOR";

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export interface Regiao {
  id: number;
  nome: string;
  cidade: string;
  latitude: number;
  longitude: number;
  suscetibilidade: "BAIXA" | "MEDIA" | "ALTA";
  limiteChuvaMm: number;
}

export interface Camera {
  id: number;
  idRegiao: number;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  urlImagem: string | null;
  status: "ATIVA" | "INATIVA" | "MANUTENCAO";
  aoVivo: boolean;
  urlAoVivo: string | null;
}

export interface Ocorrencia {
  id: number;
  idRegiao: number;
  idCamera: number | null;
  endereco: string;
  latitude: number;
  longitude: number;
  dataHora: string;
  nivelAguaCm: number;
  nivelRisco: Nivel;
  confianca: number;
  origem: OrigemOcorrencia;
  status: StatusOcorrencia;
  descricao: string | null;
  validadoPor: string | null;
  dataValidacao: string | null;
}

export interface Alerta {
  id: number;
  idRegiao: number;
  idOcorrencia: number | null;
  titulo: string;
  mensagem: string;
  nivel: Nivel;
  origem: "MANUAL" | "OCORRENCIA" | "PREVISAO";
  dataEmissao: string;
  dataExpiracao: string;
  ativo: boolean;
}

export interface Rota {
  id: number;
  origem: string;
  origemLat: number;
  origemLon: number;
  destino: string;
  destinoLat: number;
  destinoLon: number;
  distanciaKm: number;
  duracaoMin: number;
  distanciaDiretaKm: number;
  duracaoDiretaMin: number;
  alagamentosEvitados: number;
  alagamentosNoTrajeto: number;
  minutosExtras: number;
  situacao: "SEGURA" | "RISCO_REDUZIDO" | "COM_RISCO";
  trajeto: Coordenada[];
  trajetoDireto: Coordenada[];
  dataCalculo: string;
}

export interface ResultadoRota {
  rota: Rota;
  alagamentosNoCaminhoDireto: Ocorrencia[];
  alagamentosNoTrajeto: Ocorrencia[];
  alternativasAvaliadas: number;
  mensagem: string;
}

export interface SolicitacaoRota {
  origem: string;
  origemLat?: number;
  origemLon?: number;
  destino: string;
  destinoLat?: number;
  destinoLon?: number;
}

export interface RiscoRegiao {
  regiao: Regiao;
  indice: number;
  nivel: Nivel;
  fatores: string[];
  recomendacao: string;
  ocorrenciasAtivas: number;
  precipitacaoAtual: number;
  chuvaMaxima6h: number;
  chuvaAcumulada3h: number;
  probabilidadeChuva: number;
  temperatura: number;
  descricaoTempo: string;
  simulado: boolean;
}

export interface PrevisaoHora {
  hora: string;
  precipitacaoMm: number;
  probabilidade: number;
}

export interface PrevisaoClima {
  latitude: number;
  longitude: number;
  horaReferencia: string;
  temperatura: number;
  umidade: number;
  precipitacaoAtual: number;
  codigoTempo: number;
  descricaoTempo: string;
  simulado: boolean;
  fonte: string;
  proximasHoras: PrevisaoHora[];
}

export interface AnaliseVisaoIA {
  alagamentoDetectado: boolean;
  nivelAguaEstimadoCm: number;
  nivelRisco: Nivel;
  confianca: number;
  viaTransitavel: boolean;
  descricao: string;
  origem: "openai" | "motor-local";
}

export interface ResultadoAnaliseImagem {
  analise: AnaliseVisaoIA;
  origemAnalise: "openai" | "motor-local";
  camera: Camera | null;
  ocorrencia: Ocorrencia | null;
  mensagem: string;
}

export interface EntradaAnaliseImagem {
  idCamera?: number;
  urlImagem?: string;
  imagemBase64?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  registrarOcorrencia?: boolean;
}

export interface LocalEncontrado {
  nome: string;
  latitude: number;
  longitude: number;
}

export interface PainelResumo {
  regioesMonitoradas: number;
  camerasAtivas: number;
  ocorrenciasAtivas: number;
  ocorrenciasPendentes: number;
  alertasAtivos: number;
  rotasCalculadas: number;
}
