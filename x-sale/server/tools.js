/*
  tools.js – Werkzeuge, die der Agent benutzen darf
  -------------------------------------------------
  Damit kann der KI-Agent nicht nur reden, sondern auch HANDELN.
  Jedes Werkzeug hat:
    - eine Beschreibung (damit Claude weiß, wann es zu nutzen ist)
    - ein Eingabe-Schema (welche Felder erwartet werden)
    - eine Handler-Funktion (was wirklich passiert)

  Aktuell sind die "echten" Aktionen noch teils simuliert (z. B. x-sale-Status).
  Das Anlegen von Automatisierungen ist aber echt – es landet in der Datenbank
  und wird vom Zeitplaner (automations.js) ausgeführt.
*/

import { read, write, id } from "./db.js";

// Die Tool-Definitionen, die an Claude geschickt werden
export const TOOL_DEFS = [
  {
    name: "get_xsale_status",
    description:
      "Liefert aktuelle Kennzahlen aus dem x-sale-Konto des Nutzers (offene Anfragen, " +
      "neue Bestellungen, Umsatz heute). Nutze dies, wenn der Nutzer nach seinem Konto, " +
      "seinen Zahlen oder seinem Status fragt.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "schedule_automation",
    description:
      "Legt eine wiederkehrende Aufgabe an, die der Agent automatisch immer wieder erledigt. " +
      "Nutze dies, wenn der Nutzer etwas regelmäßig erledigt haben möchte (z. B. 'jeden Tag', 'immer', 'jede Woche').",
    input_schema: {
      type: "object",
      properties: {
        description: { type: "string", description: "Was soll wiederholt erledigt werden?" },
        intervalMin: {
          type: "integer",
          description: "Abstand in Minuten zwischen den Ausführungen (z. B. 1440 = täglich, 10080 = wöchentlich).",
        },
      },
      required: ["description"],
    },
  },
];

// Führt ein Werkzeug aus. ctx enthält { user, agent }
export function runTool(name, input, ctx) {
  if (name === "get_xsale_status") {
    // Simulierte Kennzahlen (später echte x-sale-Anbindung)
    return {
      offene_anfragen: 7,
      neue_bestellungen: 3,
      umsatz_heute_eur: 1240,
      hinweis: "Demo-Werte – die echte x-sale-Anbindung kommt später.",
    };
  }

  if (name === "schedule_automation") {
    const db = read();
    const auto = {
      id: id("auto"),
      userId: ctx.user ? ctx.user.id : null,
      agentId: ctx.agent ? ctx.agent.id || ctx.agent.name : null,
      agentName: ctx.agent ? ctx.agent.name : "Agent",
      description: input.description,
      intervalMin: Number(input.intervalMin) > 0 ? Number(input.intervalMin) : 1440,
      nextRun: Date.now() + 5000, // erster Lauf in ~5 Sekunden (zur Veranschaulichung)
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.automations.push(auto);
    write(db);
    return {
      gespeichert: true,
      id: auto.id,
      naechster_lauf: "in wenigen Sekunden",
      intervall_minuten: auto.intervalMin,
    };
  }

  return { error: `Unbekanntes Werkzeug: ${name}` };
}
