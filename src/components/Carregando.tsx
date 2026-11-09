"use client";

import { useId } from "react";

const GOTA = "M12 1.5C8.2 7.2 3.5 12.8 3.5 19.6a8.5 8.5 0 0 0 17 0c0-6.8-4.7-12.4-8.5-18.1z";
const ONDA = "M0 3 Q6 0 12 3 T24 3 T36 3 T48 3 V40 H0 Z";

function montarSvg(id: string, tamanho: number) {
  return `<svg class="gota" width="${tamanho * 0.75}" height="${tamanho}" viewBox="0 0 24 32" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${GOTA}"/></clipPath></defs>
    <g clip-path="url(#${id})">
      <path d="${GOTA}" fill="currentColor" opacity="0.12"/>
      <g class="gota-nivel"><g class="gota-onda"><path d="${ONDA}" fill="currentColor"/></g></g>
    </g>
    <path d="${GOTA}" fill="none" stroke="currentColor" stroke-width="1.6"/>
  </svg>`;
}

export function GotaCarregando({ tamanho = 20, className = "" }: { tamanho?: number; className?: string }) {
  const id = "gota" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-flex shrink-0 text-brand-600 ${className}`}
      dangerouslySetInnerHTML={{ __html: montarSvg(id, tamanho) }}
    />
  );
}

export function Carregando({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-sm text-slate-600 ${className}`}>
      <GotaCarregando />
      {texto}
    </span>
  );
}

let contador = 0;

export function gotaCarregandoHtml(texto: string) {
  contador += 1;
  return `<span style="display:inline-flex;align-items:center;gap:8px;color:#0b7a70">${montarSvg("gotapopup" + contador, 18)}<span style="color:#475569">${texto}</span></span>`;
}
