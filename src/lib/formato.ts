import { Nivel } from "./types";

export const NIVEIS: Record<Nivel, { rotulo: string; cor: string; classe: string }> = {
  BAIXO: { rotulo: "Baixo", cor: "#10b981", classe: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  MEDIO: { rotulo: "Médio", cor: "#f59e0b", classe: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  ALTO: { rotulo: "Alto", cor: "#f97316", classe: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  CRITICO: { rotulo: "Crítico", cor: "#ef4444", classe: "bg-red-500/15 text-red-700 border-red-500/30" },
};

export const STATUS_OCORRENCIA: Record<string, string> = {
  PENDENTE: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  CONFIRMADA: "bg-red-500/15 text-red-700 border-red-500/30",
  DESCARTADA: "bg-slate-500/15 text-slate-700 border-slate-500/30",
  RESOLVIDA: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

export const ORIGENS: Record<string, string> = {
  IA_CAMERA: "IA - câmera",
  CIDADAO: "Cidadão",
  OPERADOR: "Operador",
  MANUAL: "Manual",
  OCORRENCIA: "Ocorrência",
  PREVISAO: "Previsão do tempo",
};

// a API devolve "2026-11-09T13:23:14" no horario de Sao Paulo
export function formatarDataHora(valor: string | null | undefined) {
  if (!valor) return "-";
  const [data, hora] = valor.split("T");
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano} ${hora?.slice(0, 5) ?? ""}`;
}

export function haQuanto(valor: string) {
  const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const minutos = Math.round((agora.getTime() - new Date(valor).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return `há ${Math.floor(horas / 24)} dia(s)`;
}

export function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
