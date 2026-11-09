# NexRain - Front-end

Site do NexRain em Next.js. Consome a API Java do NexRain (repositório nexrain-springboot) e mostra:

- **Mapa de risco**: risco de alagamento por região (previsão real da Open-Meteo), radar de chuva em tempo
  real (RainViewer), câmeras e ocorrências ativas. Tem o modo "Simular temporal" para a demonstração.
- **Rota segura**: origem e destino (endereço ou clique no mapa), rota mais rápida x rota NexRain que
  desvia dos alagamentos, e histórico das rotas calculadas.
- **Monitoramento IA**: análise das imagens das câmeras (ou foto enviada pelo cidadão) com visão computacional.
- **Ocorrências**: validação pela Defesa Civil (confirmar, descartar, resolver) e relato do cidadão.
- **Alertas**: alertas em vigor, histórico e emissão manual.

Mapas com [Leaflet](https://leafletjs.com) sobre o mapa base da Esri / OpenStreetMap, sem chave de API.

## Como rodar

Com a API rodando, crie o arquivo `.env.local` com o endereço dela:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Depois:

```bash
npm install
npm run dev
```

E acesse `http://localhost:3000`.

## Deploy na Vercel

Add New > Project, importar este repositório (o Next.js é detectado sozinho) e criar a variável:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | endereço da API no Render, sem barra no final |
