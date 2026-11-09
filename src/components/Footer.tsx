import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-900 text-brand-100">
      <div className="flex h-1">
        <span className="flex-[3] bg-brand-500" />
        <span className="flex-1 bg-alerta" />
        <span className="flex-[2] bg-accent-500" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-titulo text-lg font-bold text-white">
            Nex<span className="text-brand-300">Rain</span>
          </p>
          <p className="mt-2 text-brand-100/80">
            Plataforma cidadã de monitoramento de enchentes e alagamentos urbanos. Projeto acadêmico da Global Solution
            2026 (CitizenTech) - FIAP.
          </p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Serviços</p>
          <ul className="space-y-1.5">
            <li><Link href="/mapa" className="hover:text-white">Mapa de risco</Link></li>
            <li><Link href="/rotas" className="hover:text-white">Rota segura</Link></li>
            <li><Link href="/ocorrencias" className="hover:text-white">Relatar alagamento</Link></li>
            <li><Link href="/alertas" className="hover:text-white">Alertas em vigor</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Em caso de emergência</p>
          <ul className="space-y-1.5">
            <li><strong className="text-alerta">199</strong> Defesa Civil</li>
            <li><strong className="text-alerta">193</strong> Corpo de Bombeiros</li>
            <li><strong className="text-alerta">192</strong> SAMU</li>
          </ul>
          <p className="mt-3 text-xs text-brand-100/70">Nunca atravesse ruas alagadas, nem a pé nem de carro.</p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">Fontes de dados</p>
          <ul className="space-y-1.5 text-brand-100/80">
            <li>Open-Meteo (previsão de chuva)</li>
            <li>RainViewer (radar)</li>
            <li>OpenStreetMap, OSRM e Esri (mapas e rotas)</li>
            <li>OpenAI (visão computacional)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 text-xs text-brand-100/70 sm:flex-row sm:justify-between">
          <p>Equipe NexRain · Mateus Saavedra, Davi Melo e Danilo Fernandes</p>
          <p>FIAP · Domain Driven Design · 2026</p>
        </div>
      </div>
    </footer>
  );
}
