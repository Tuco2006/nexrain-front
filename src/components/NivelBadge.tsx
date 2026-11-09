import { NIVEIS, STATUS_OCORRENCIA } from "@/lib/formato";
import { Nivel } from "@/lib/types";

export function NivelBadge({ nivel, prefixo = "Risco" }: { nivel: Nivel; prefixo?: string }) {
  const info = NIVEIS[nivel] ?? NIVEIS.BAIXO;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${info.classe}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.cor }} />
      {prefixo ? `${prefixo} ${info.rotulo.toLowerCase()}` : info.rotulo}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_OCORRENCIA[status] ?? ""}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
