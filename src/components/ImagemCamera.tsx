"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "@/lib/types";
import { GotaCarregando } from "./Carregando";

const QUADROS = 25;

interface Props {
  camera: Camera;
  intervalo?: number;
  className?: string;
  mostrarHorario?: boolean;
  onQuadro?: (url: string) => void;
}

export function ImagemCamera({ camera, intervalo = 3000, className = "", mostrarHorario = false, onQuadro }: Props) {
  const [src, setSrc] = useState(camera.urlImagem ?? "");
  const [horario, setHorario] = useState("");
  const [carregou, setCarregou] = useState(false);
  const quadro = useRef(1 + Math.floor(Math.random() * QUADROS));
  const retorno = useRef(onQuadro);
  retorno.current = onQuadro;

  useEffect(() => {
    if (!camera.aoVivo || !camera.urlAoVivo) {
      setSrc(camera.urlImagem ?? "");
      return;
    }
    let ativo = true;

    const proximo = () => {
      quadro.current = (quadro.current % QUADROS) + 1;
      const url = `${camera.urlAoVivo}${quadro.current}.jpg`;
      const imagem = new Image();
      imagem.onload = () => {
        if (!ativo) return;
        setSrc(`${url}?${Date.now()}`);
        setCarregou(true);
        setHorario(new Date().toLocaleTimeString("pt-BR"));
        retorno.current?.(url);
      };
      imagem.src = `${url}?${Date.now()}`;
    };

    proximo();
    const timer = setInterval(proximo, intervalo);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [camera.aoVivo, camera.urlAoVivo, camera.urlImagem, intervalo]);

  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
      {src && (
        <img
          src={src}
          alt={camera.nome}
          className="h-full w-full object-cover"
          onLoad={() => setCarregou(true)}
        />
      )}
      {!carregou && (
        <div className="absolute inset-0 flex items-center justify-center">
          <GotaCarregando tamanho={24} />
        </div>
      )}
      {mostrarHorario && camera.aoVivo && horario && (
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white">
          {horario}
        </span>
      )}
    </div>
  );
}
