# ⚽ API de Resultados del Mundial

API REST en Node.js que devuelve partidos, resultados y tabla de posiciones del Mundial de Fútbol.

## 🚀 Instalación

```bash
npm install
cp .env.example .env
# Edita .env con tu API key
npm start
```

## 🔑 API Key (gratis)

Regístrate en **https://www.football-data.org/client/register** para obtener tu API key gratuita.
- Plan gratuito: 10 peticiones/minuto
- Sin key: solo 1 petición/minuto

## 📡 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Info y lista de endpoints |
| GET | `/partidos` | Todos los partidos del torneo |
| GET | `/partidos/hoy` | Partidos de hoy |
| GET | `/partidos/en-vivo` | Partidos en curso |
| GET | `/partidos/resultados` | Partidos terminados |
| GET | `/partidos/proximos` | Próximos partidos |
| GET | `/grupos` | Tabla de posiciones por grupo |
| GET | `/equipos` | Equipos participantes |
| GET | `/partidos/:id` | Detalle con goles y árbitros |

## 📦 Respuesta de ejemplo — `/partidos/en-vivo`

```json
{
  "en_vivo": true,
  "total": 1,
  "partidos": [
    {
      "id": 391882,
      "fecha": "2026-06-15T18:00:00Z",
      "estado": "En juego",
      "fase": "GROUP_STAGE",
      "grupo": "GROUP_A",
      "local": {
        "nombre": "México",
        "codigo": "MEX",
        "goles": 1
      },
      "visitante": {
        "nombre": "Argentina",
        "codigo": "ARG",
        "goles": 0
      },
      "ganador": null,
      "minuto": 67
    }
  ]
}
```

## ⚙️ Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `FOOTBALL_API_KEY` | — | API key de football-data.org |
| `PORT` | 3000 | Puerto del servidor |
| `WORLD_CUP_ID` | 2000 | ID del torneo (2000 = Qatar 2022) |
