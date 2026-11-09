export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
        <div>
          <p>NexRain - projeto acadêmico da Global Solution 2026 (CitizenTech).</p>
          <p className="text-xs">
            Dados: Open-Meteo (previsão), RainViewer (radar), OpenStreetMap / OSRM / Nominatim (mapas e rotas).
          </p>
        </div>
        <p>FIAP - Domain Driven Design</p>
      </div>
    </footer>
  );
}
