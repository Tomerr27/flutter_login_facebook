const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────────────
// Fuentes de datos (sin necesidad de API key para la fuente pública)
const FOOTBALL_API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_API_KEY || ""; // Opcional: https://www.football-data.org/client/register

// ID del Mundial 2026 en football-data.org  (2018=467, 2022=2000, 2026=TBD)
// Usamos también una fuente pública de respaldo
const WORLD_CUP_ID = process.env.WORLD_CUP_ID || "2000"; // 2022 Qatar

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function buildHeaders() {
  const h = { "Accept-Language": "es" };
  if (API_KEY) h["X-Auth-Token"] = API_KEY;
  return h;
}

function formatMatch(match) {
  return {
    id: match.id,
    fecha: match.utcDate,
    estado: translateStatus(match.status),
    jornada: match.matchday ?? null,
    fase: match.stage ?? null,
    grupo: match.group ?? null,
    local: {
      nombre: match.homeTeam?.name ?? "Por definir",
      codigo: match.homeTeam?.tla ?? null,
      bandera: match.homeTeam?.crest ?? null,
      goles: match.score?.fullTime?.home ?? null,
    },
    visitante: {
      nombre: match.awayTeam?.name ?? "Por definir",
      codigo: match.awayTeam?.tla ?? null,
      bandera: match.awayTeam?.crest ?? null,
      goles: match.score?.fullTime?.away ?? null,
    },
    ganador: translateWinner(match.score?.winner),
    minuto: match.minute ?? null,
  };
}

function translateStatus(status) {
  const map = {
    SCHEDULED: "Programado",
    TIMED: "Programado",
    IN_PLAY: "En juego",
    PAUSED: "Medio tiempo",
    FINISHED: "Terminado",
    POSTPONED: "Aplazado",
    CANCELLED: "Cancelado",
    SUSPENDED: "Suspendido",
  };
  return map[status] ?? status;
}

function translateWinner(winner) {
  if (!winner) return null;
  const map = { HOME_TEAM: "Local", AWAY_TEAM: "Visitante", DRAW: "Empate" };
  return map[winner] ?? winner;
}

// ─── RUTAS ───────────────────────────────────────────────────────────────────

/**
 * GET /
 * Información general de la API
 */
app.get("/", (req, res) => {
  res.json({
    nombre: "API de Resultados del Mundial ⚽",
    version: "1.0.0",
    endpoints: {
      "GET /partidos": "Todos los partidos del torneo",
      "GET /partidos/hoy": "Partidos de hoy",
      "GET /partidos/en-vivo": "Partidos en curso ahora mismo",
      "GET /partidos/resultados": "Partidos ya terminados",
      "GET /partidos/proximos": "Próximos partidos programados",
      "GET /grupos": "Tabla de posiciones por grupo",
      "GET /equipos": "Lista de equipos participantes",
      "GET /partidos/:id": "Detalle de un partido específico",
    },
    fuente: "football-data.org",
    nota: "Configura FOOTBALL_API_KEY en .env para mayor límite de peticiones",
  });
});

/**
 * GET /partidos
 * Todos los partidos del Mundial
 */
app.get("/partidos", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${FOOTBALL_API_BASE}/competitions/${WORLD_CUP_ID}/matches`,
      { headers: buildHeaders() }
    );

    const partidos = data.matches.map(formatMatch);

    res.json({
      torneo: data.competition?.name ?? "FIFA World Cup",
      total: partidos.length,
      partidos,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /partidos/hoy
 * Partidos que se juegan hoy
 */
app.get("/partidos/hoy", async (req, res) => {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const { data } = await axios.get(
      `${FOOTBALL_API_BASE}/competitions/${WORLD_CUP_ID}/matches?dateFrom=${hoy}&dateTo=${hoy}`,
      { headers: buildHeaders() }
    );

    const partidos = data.matches.map(formatMatch);

    res.json({
      fecha: hoy,
      total: partidos.length,
      partidos,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /partidos/en-vivo
 * Partidos en curso
 */
app.get("/partidos/en-vivo", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${FOOTBALL_API_BASE}/competitions/${WORLD_CUP_ID}/matches?status=IN_PLAY,PAUSED`,
      { headers: buildHeaders() }
    );

    const partidos = data.matches.map(formatMatch);

    res.json({
      en_vivo: true,
      total: partidos.length,
      partidos,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /partidos/resultados
 * Partidos terminados
 */
app.get("/partidos/resultados", async (req, res) => {
  try {
    const { limit = 10, pagina = 1 } = req.query;
    const { data } = await axios.get(
      `${FOOTBALL_API_BASE}/competitions/${WORLD_CUP_ID}/matches?status=FINISHED`,
      { headers: buildHeaders() }
    );

    const todos = data.matches.map(formatMatch).reverse(); // más recientes primero
    const inicio = (pagina - 1) * limit;
    const partidos = todos.slice(inicio, inicio + Number(limit));

    res.json({
      total: todos.length,
      pagina: Number(pagina),
      por_pagina: Number(limit),
      partidos,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /partidos/proximos
 * Próximos partidos programados
 */
app.get("/partidos/proximos", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { data } = await axios.get(
      `${FOOTBALL_API_BASE}/competitions/${WORLD_CUP_ID}/matches?status=SCHEDULED,TIMED`,
      { headers: buildHeaders() }
    );

    const partidos = data.matches.slice(0, Number(limit)).map(formatMatch);

    res.json({
      total: data.matches.length,
      mostrando: partidos.length,
      partidos,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /grupos
 * Tabla de posiciones por grupo
 */
app.get("/grupos", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${FOOTBALL_API_BASE}/competitions/${WORLD_CUP_ID}/standings`,
      { headers: buildHeaders() }
    );

    const grupos = data.standings.map((s) => ({
      grupo: s.group ?? s.stage,
      tipo: s.type,
      tabla: s.table.map((t) => ({
        posicion: t.position,
        equipo: t.team.name,
        codigo: t.team.tla,
        bandera: t.team.crest,
        jugados: t.playedGames,
        ganados: t.won,
        empates: t.draw,
        perdidos: t.lost,
        goles_favor: t.goalsFor,
        goles_contra: t.goalsAgainst,
        diferencia: t.goalDifference,
        puntos: t.points,
      })),
    }));

    res.json({
      torneo: data.competition?.name,
      temporada: data.season?.startDate,
      grupos,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /equipos
 * Equipos del torneo
 */
app.get("/equipos", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${FOOTBALL_API_BASE}/competitions/${WORLD_CUP_ID}/teams`,
      { headers: buildHeaders() }
    );

    const equipos = data.teams.map((t) => ({
      id: t.id,
      nombre: t.name,
      nombre_corto: t.shortName,
      codigo: t.tla,
      escudo: t.crest,
      fundado: t.founded,
      colores: t.clubColors,
    }));

    res.json({
      torneo: data.competition?.name,
      total: equipos.length,
      equipos,
    });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /partidos/:id
 * Detalle de un partido
 */
app.get("/partidos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${FOOTBALL_API_BASE}/matches/${id}`, {
      headers: buildHeaders(),
    });

    res.json({
      partido: formatMatch(data),
      goles: (data.goals ?? []).map((g) => ({
        minuto: g.minute,
        jugador: g.scorer?.name,
        equipo: g.team?.name,
        tipo: g.type,
      })),
      arbitros: (data.referees ?? []).map((r) => ({
        nombre: r.name,
        rol: r.role,
        pais: r.nationality,
      })),
    });
  } catch (err) {
    handleError(err, res);
  }
});

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
function handleError(err, res) {
  if (err.response) {
    const status = err.response.status;
    if (status === 403) {
      return res.status(403).json({
        error: "Sin acceso a la API",
        mensaje:
          "Registra tu API key gratuita en https://www.football-data.org/client/register y agrégala como variable de entorno FOOTBALL_API_KEY",
      });
    }
    if (status === 429) {
      return res.status(429).json({
        error: "Límite de peticiones alcanzado",
        mensaje:
          "La API gratuita permite 10 peticiones por minuto. Regresa en un momento.",
      });
    }
    return res.status(status).json({
      error: "Error de la fuente de datos",
      detalle: err.response.data?.message ?? err.message,
    });
  }
  console.error("Error interno:", err.message);
  res.status(500).json({ error: "Error interno del servidor", detalle: err.message });
}

// ─── INICIO ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚽  API del Mundial corriendo en http://localhost:${PORT}`);
  console.log(`📋  Endpoints disponibles:`);
  console.log(`    GET http://localhost:${PORT}/`);
  console.log(`    GET http://localhost:${PORT}/partidos`);
  console.log(`    GET http://localhost:${PORT}/partidos/hoy`);
  console.log(`    GET http://localhost:${PORT}/partidos/en-vivo`);
  console.log(`    GET http://localhost:${PORT}/partidos/resultados`);
  console.log(`    GET http://localhost:${PORT}/partidos/proximos`);
  console.log(`    GET http://localhost:${PORT}/grupos`);
  console.log(`    GET http://localhost:${PORT}/equipos\n`);
});

module.exports = app;
