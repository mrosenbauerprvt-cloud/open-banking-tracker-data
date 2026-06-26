/*
  server.js – Server für x-sale
  -----------------------------
  Vereint alle Bausteine:
    • Liefert die App aus (index.html, app.js, ...)
    • /api/register, /api/login, /api/me           -> Konten & Login
    • /api/chat                                     -> echte KI + Werkzeuge (Tool-Use)
    • /api/rentals (GET/POST)                       -> gemietete Agenten in der DB
    • /api/automations (GET) /api/runs (GET)        -> Automatisierungen & Protokoll
    • /api/checkout (POST)                          -> Bezahlung (Stripe, optional)

  Start:
    1) cd server
    2) npm install
    3) .env anlegen (siehe .env.example) und ANTHROPIC_API_KEY eintragen
       (optional STRIPE_SECRET_KEY für echte Bezahlung)
    4) npm start
    5) http://localhost:3000
*/

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

import { read, write, id, update } from "./db.js";
import { register, login, attachUser } from "./auth.js";
import { TOOL_DEFS, runTool } from "./tools.js";
import { startScheduler } from "./automations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(attachUser); // hängt req.user an, falls ein Token mitkommt
app.use(express.static(path.join(__dirname, "..")));

// Modell je Level
const MODEL_BY_LEVEL = {
  1: { model: "claude-haiku-4-5", max_tokens: 700 },
  2: { model: "claude-sonnet-4-6", max_tokens: 1200 },
  3: { model: "claude-opus-4-8", max_tokens: 2048 },
};

const hasKey = !!process.env.ANTHROPIC_API_KEY;
const client = hasKey ? new Anthropic() : null;

/* ---------------- Konten / Login ---------------- */
app.post("/api/register", (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    res.json(register(email, password, name));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    res.json(login(email, password));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/me", (req, res) => {
  res.json({ user: req.user || null });
});

/* ---------------- Gemietete Agenten ---------------- */
app.get("/api/rentals", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Bitte einloggen." });
  const db = read();
  res.json({ rentals: db.rentals.filter((r) => r.userId === req.user.id) });
});

app.post("/api/rentals", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Bitte einloggen." });
  const { agentId, level, custom, price } = req.body || {};
  const rental = {
    id: id("rent"),
    userId: req.user.id,
    agentId, level, custom: !!custom, price,
    since: new Date().toLocaleDateString("de-DE"),
  };
  update("rentals", (list) => list.concat(rental));
  res.json({ rental });
});

/* ---------------- Anbieter: eigene Agenten einstellen ---------------- */
// Standard-Werte je Level (damit Anbieter nur die Preise angeben müssen)
const DEFAULT_STATS = {
  1: { speed: 55, accuracy: 60, power: 45, tokens: 50 },
  2: { speed: 78, accuracy: 80, power: 72, tokens: 75 },
  3: { speed: 93, accuracy: 95, power: 94, tokens: 96 },
};
const DEFAULT_INCLUDES = { 1: "Basis-Nutzung", 2: "Erweiterte Nutzung", 3: "Unbegrenzt + Priorität" };

function buildAgent(body, user) {
  const prices = body.prices || {};
  const levels = [1, 2, 3].map((lvl) => ({
    level: lvl,
    price: Math.max(0, Math.round(Number(prices[lvl]) || 0)),
    includes: DEFAULT_INCLUDES[lvl],
    stats: DEFAULT_STATS[lvl],
  }));
  return {
    id: id("agent"),
    name: String(body.name || "").trim() || "Neuer Agent",
    tagline: String(body.tagline || "").trim(),
    category: body.category || "office",
    emoji: body.emoji || "🤖",
    rating: 4.5,
    trainable: !!body.trainable,
    description: String(body.description || "").trim(),
    skills: Array.isArray(body.skills)
      ? body.skills
      : String(body.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
    levels,
    custom: true,
    providerId: user.id,
    providerName: user.name,
    createdAt: new Date().toISOString(),
  };
}

app.get("/api/agents", (_req, res) => {
  const db = read();
  res.json({ agents: db.agents || [] });
});

app.post("/api/agents", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Bitte einloggen, um einen Agenten einzustellen." });
  const body = req.body || {};
  if (!body.name || !body.tagline) {
    return res.status(400).json({ error: "Name und Kurzbeschreibung sind erforderlich." });
  }
  const agent = buildAgent(body, req.user);
  update("agents", (list) => list.concat(agent));
  res.json({ agent });
});

app.delete("/api/agents/:id", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Bitte einloggen." });
  const db = read();
  const agent = (db.agents || []).find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent nicht gefunden." });
  if (agent.providerId !== req.user.id) return res.status(403).json({ error: "Nur der Anbieter darf löschen." });
  update("agents", (list) => list.filter((a) => a.id !== req.params.id));
  res.json({ ok: true });
});

/* ---------------- Admin-Bereich ---------------- */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Bitte einloggen." });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Kein Admin-Zugang." });
  next();
}

app.get("/api/admin/overview", requireAdmin, (_req, res) => {
  const db = read();
  res.json({
    counts: {
      users: db.users.length,
      agents: (db.agents || []).length,
      rentals: db.rentals.length,
      reviews: (db.reviews || []).length,
      automations: db.automations.length,
      runs: db.runs.length,
    },
    users: db.users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role || "user", createdAt: u.createdAt })),
    agents: (db.agents || []).map((a) => ({ id: a.id, name: a.name, providerName: a.providerName, category: a.category })),
    reviews: (db.reviews || []).slice(-50).reverse(),
  });
});

// Admin darf jeden Agenten / jede Bewertung löschen
app.delete("/api/admin/agents/:id", requireAdmin, (req, res) => {
  update("agents", (list) => list.filter((a) => a.id !== req.params.id));
  res.json({ ok: true });
});
app.delete("/api/admin/reviews/:id", requireAdmin, (req, res) => {
  update("reviews", (list) => list.filter((r) => r.id !== req.params.id));
  res.json({ ok: true });
});

/* ---------------- Bewertungen (Reviews) ---------------- */
app.get("/api/reviews", (req, res) => {
  const agentId = req.query.agentId;
  const db = read();
  const list = (db.reviews || []).filter((r) => r.agentId === agentId);
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.stars, 0) / count : 0;
  res.json({ reviews: list.slice().reverse(), count, average: Math.round(average * 10) / 10 });
});

app.post("/api/reviews", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Bitte einloggen, um zu bewerten." });
  const { agentId, stars, text } = req.body || {};
  const n = Math.max(1, Math.min(5, Math.round(Number(stars) || 0)));
  if (!agentId) return res.status(400).json({ error: "agentId fehlt." });
  const review = {
    id: id("rev"),
    agentId,
    userId: req.user.id,
    userName: req.user.name,
    stars: n,
    text: String(text || "").trim().slice(0, 500),
    at: new Date().toISOString(),
  };
  update("reviews", (list) => list.concat(review));
  res.json({ review });
});

/* ---------------- Automatisierungen & Protokoll ---------------- */
app.get("/api/automations", (req, res) => {
  const db = read();
  const uid = req.user ? req.user.id : null;
  res.json({ automations: db.automations.filter((a) => a.userId === uid) });
});

app.get("/api/runs", (req, res) => {
  const db = read();
  const uid = req.user ? req.user.id : null;
  res.json({ runs: db.runs.filter((r) => r.userId === uid).slice(0, 50) });
});

/* ---------------- Chat mit Werkzeugen (Tool-Use) ---------------- */
app.post("/api/chat", async (req, res) => {
  try {
    const { agent, level, history } = req.body || {};
    if (!agent || !Array.isArray(history)) {
      return res.status(400).json({ error: "agent und history sind erforderlich." });
    }
    if (!client) {
      return res.status(503).json({ error: "Kein ANTHROPIC_API_KEY gesetzt." });
    }

    const cfg = MODEL_BY_LEVEL[level] || MODEL_BY_LEVEL[1];
    const system =
      `Du bist "${agent.name}", ein gemieteter KI-Agent auf der Plattform x-sale. ` +
      `Deine Spezialgebiete: ${(agent.skills || []).join(", ")}. ` +
      `Kurzbeschreibung: ${agent.tagline || ""} ` +
      `Du arbeitest auf Level ${level} (1=Basis, 2=Profi, 3=Experte). ` +
      `Antworte freundlich, hilfreich und auf Deutsch und bleibe in Deiner Rolle. ` +
      `Du kannst Werkzeuge benutzen: den x-sale-Status abrufen und wiederkehrende ` +
      `Aufgaben als Automatisierung anlegen. Nutze sie, wenn es zur Bitte des Nutzers passt.`;

    const messages = history
      .filter((m) => m && m.text)
      .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));

    const ctx = { user: req.user, agent };
    let guard = 0;
    let response = await client.messages.create({
      model: cfg.model, max_tokens: cfg.max_tokens, system, tools: TOOL_DEFS, messages,
    });

    // Tool-Use-Schleife: solange Claude Werkzeuge benutzen will, ausführen
    while (response.stop_reason === "tool_use" && guard++ < 6) {
      messages.push({ role: "assistant", content: response.content });
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = runTool(block.name, block.input || {}, ctx);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
      response = await client.messages.create({
        model: cfg.model, max_tokens: cfg.max_tokens, system, tools: TOOL_DEFS, messages,
      });
    }

    const text = response.content
      .filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();

    res.json({ reply: text || "(keine Antwort)", model: cfg.model });
  } catch (err) {
    console.error("Fehler in /api/chat:", err?.message || err);
    res.status(500).json({ error: "Chat-Anfrage fehlgeschlagen.", detail: err?.message });
  }
});

/* ---------------- Bezahlung (Stripe, optional) ---------------- */
app.post("/api/checkout", async (req, res) => {
  const { items } = req.body || {};
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Kein Stripe eingerichtet -> Mock (App nutzt dann ihren eigenen Mock-Checkout)
    return res.json({ mock: true });
  }
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key);
    const origin = req.headers.origin || `http://localhost:${PORT}`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: (items || []).map((it) => ({
        price_data: {
          currency: "eur",
          product_data: { name: `${it.name} · Level ${it.level}` },
          unit_amount: Math.round((it.price || 0) * 100),
          recurring: { interval: "month" },
        },
        quantity: 1,
      })),
      success_url: `${origin}/?bezahlt=1`,
      cancel_url: `${origin}/?abgebrochen=1`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe-Fehler:", e?.message || e);
    res.status(500).json({ error: "Bezahlung fehlgeschlagen.", detail: e?.message });
  }
});

/* ---------------- Zeitplaner starten ---------------- */
// Führt eine fällige Automatisierung aus (echte KI, sonst Mock)
async function runOne(auto) {
  if (!client) {
    return `Demo-Ausführung um ${new Date().toLocaleTimeString("de-DE")}: "${auto.description}" (kein API-Schlüssel – simuliert).`;
  }
  const r = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system:
      `Du bist der Agent "${auto.agentName}" auf x-sale und führst gerade eine wiederkehrende ` +
      `Aufgabe automatisch aus. Erledige sie knapp und melde das Ergebnis auf Deutsch.`,
    messages: [{ role: "user", content: `Führe jetzt diese Aufgabe aus: ${auto.description}` }],
  });
  return r.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`x-sale läuft auf http://localhost:${PORT}`);
  if (!hasKey) console.warn("⚠️  Kein ANTHROPIC_API_KEY – Chat & Automatisierungen nutzen Demo-Antworten.");
  if (!process.env.STRIPE_SECRET_KEY) console.warn("ℹ️  Kein STRIPE_SECRET_KEY – Bezahlung läuft im Mock-Modus.");
  startScheduler(runOne);
});
