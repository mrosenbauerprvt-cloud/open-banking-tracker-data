/*
  automations.js – Zeitplaner für wiederkehrende Aufgaben
  -------------------------------------------------------
  Prüft regelmäßig, welche Automatisierungen "fällig" sind, führt sie aus
  (über die übergebene runOne-Funktion) und schreibt das Ergebnis ins Protokoll.

  Hinweis: Dies ist ein einfacher In-Memory-Zeitplaner (läuft nur, solange der
  Server läuft). Für den echten Betrieb später z. B. ein Cron-Job oder eine
  Queue. Das Prinzip ist hier aber schon vollständig umgesetzt.
*/

import { read, write, id } from "./db.js";

const MAX_RUNS = 200; // Protokoll begrenzen

export function startScheduler(runOne, tickMs = 30000) {
  async function tick() {
    const db = read();
    const now = Date.now();
    const due = db.automations.filter((a) => a.active && a.nextRun <= now);

    for (const auto of due) {
      let output;
      try {
        output = await runOne(auto);
      } catch (e) {
        output = "Fehler bei der Ausführung: " + (e?.message || e);
      }
      // frische Daten lesen (könnte sich geändert haben)
      const fresh = read();
      const target = fresh.automations.find((a) => a.id === auto.id);
      if (target) {
        target.nextRun = Date.now() + target.intervalMin * 60000;
      }
      fresh.runs.unshift({
        id: id("run"),
        automationId: auto.id,
        userId: auto.userId,
        agentName: auto.agentName,
        description: auto.description,
        at: new Date().toISOString(),
        output,
      });
      fresh.runs = fresh.runs.slice(0, MAX_RUNS);
      write(fresh);
      console.log(`🔁 Automatisierung ausgeführt: "${auto.description}"`);
    }
  }

  setInterval(tick, tickMs);
  console.log(`⏱️  Zeitplaner aktiv (prüft alle ${Math.round(tickMs / 1000)}s).`);
}
