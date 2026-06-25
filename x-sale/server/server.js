/*
  server.js – kleiner Server für x-sale
  -------------------------------------
  Zwei Aufgaben:
    1) Liefert die App (index.html, app.js, ...) im Browser aus
    2) Stellt /api/chat bereit: leitet Chat-Nachrichten an Claude weiter

  Das Modell hängt vom LEVEL des Agenten ab:
    Level 1 -> Haiku   (schnell & günstig)
    Level 2 -> Sonnet  (ausgewogen)
    Level 3 -> Opus    (stärkstes Modell)

  Start:
    1) cd server
    2) npm install
    3) ANTHROPIC_API_KEY in der Datei .env eintragen (siehe .env.example)
    4) npm start
    5) Browser öffnen: http://localhost:3000
*/

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Die App-Dateien liegen einen Ordner höher (x-sale/)
app.use(express.static(path.join(__dirname, "..")));

// Modell je Level – passt zu "Level = Geschwindigkeit/Genauigkeit/Power"
const MODEL_BY_LEVEL = {
  1: { model: "claude-haiku-4-5", max_tokens: 512 },
  2: { model: "claude-sonnet-4-6", max_tokens: 1024 },
  3: { model: "claude-opus-4-8", max_tokens: 2048 },
};

const client = new Anthropic(); // liest ANTHROPIC_API_KEY aus der Umgebung / .env

app.post("/api/chat", async (req, res) => {
  try {
    const { agent, level, history } = req.body || {};
    if (!agent || !Array.isArray(history)) {
      return res.status(400).json({ error: "agent und history sind erforderlich." });
    }

    const cfg = MODEL_BY_LEVEL[level] || MODEL_BY_LEVEL[1];

    // Persönlichkeit des Agenten als System-Prompt
    const system =
      `Du bist "${agent.name}", ein gemieteter KI-Agent auf der Plattform x-sale. ` +
      `Deine Spezialgebiete: ${(agent.skills || []).join(", ")}. ` +
      `Kurzbeschreibung: ${agent.tagline || ""} ` +
      `Du arbeitest aktuell auf Level ${level} (1=Basis, 2=Profi, 3=Experte). ` +
      `Antworte freundlich, hilfreich und auf Deutsch. Bleibe in Deiner Rolle. ` +
      `Wenn der Nutzer eine wiederkehrende Aufgabe beschreibt ("jeden Tag", "immer"), ` +
      `weise darauf hin, dass er das als Automatisierung speichern kann.`;

    // Chatverlauf in das Format der API übersetzen
    const messages = history
      .filter((m) => m && m.text)
      .map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));

    if (messages.length === 0 || messages[0].role !== "user") {
      return res.status(400).json({ error: "Der Verlauf muss mit einer Nutzernachricht beginnen." });
    }

    const response = await client.messages.create({
      model: cfg.model,
      max_tokens: cfg.max_tokens,
      system,
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.json({ reply: text || "(keine Antwort)", model: cfg.model });
  } catch (err) {
    console.error("Fehler in /api/chat:", err?.message || err);
    res.status(500).json({ error: "Chat-Anfrage fehlgeschlagen.", detail: err?.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`x-sale läuft auf http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  Kein ANTHROPIC_API_KEY gesetzt – der Chat nutzt dann nur die Demo-Antworten.");
  }
});
