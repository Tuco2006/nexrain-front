"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export type LeafletLib = typeof import("leaflet");

interface Props {
  className?: string;
  centro?: [number, number];
  zoom?: number;
  onPronto: (mapa: LeafletMap, L: LeafletLib) => void;
}

export function Mapa({ className, centro = [-23.555, -46.64], zoom = 12, onPronto }: Props) {
  const elemento = useRef<HTMLDivElement>(null);
  const callback = useRef(onPronto);
  callback.current = onPronto;

  useEffect(() => {
    let mapa: LeafletMap | null = null;
    let cancelado = false;

    import("leaflet").then((modulo) => {
      const L = ((modulo as unknown as { default?: LeafletLib }).default ?? modulo) as LeafletLib;
      if (cancelado || !elemento.current) return;

      mapa = L.map(elemento.current, { zoomControl: true, preferCanvas: false }).setView(centro, zoom);
      const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
      L.tileLayer(`${esri}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
        attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxNativeZoom: 16,
        maxZoom: 19,
      }).addTo(mapa);
      const rotulos = mapa.createPane("rotulos");
      rotulos.style.zIndex = "450";
      rotulos.style.pointerEvents = "none";
      L.tileLayer(`${esri}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
        maxNativeZoom: 16,
        maxZoom: 19,
        pane: "rotulos",
      }).addTo(mapa);

      callback.current(mapa, L);
    });

    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, []);

  return <div ref={elemento} className={className} />;
}
