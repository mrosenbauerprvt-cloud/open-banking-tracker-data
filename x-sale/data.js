/*
  data.js
  --------
  Hier stehen die "Daten" der App: die Liste der mietbaren KI-Agenten.
  Du kannst hier Agenten hinzufügen, löschen oder ändern.

  WICHTIG – Jeder Agent gibt es in 3 LEVELN (Stufen):
    Level 1 = Basis   (günstig, schneller Start, einfache Aufgaben)
    Level 2 = Profi   (mehr Tempo, Genauigkeit, Rechenleistung)
    Level 3 = Experte (Maximum an Tokens, Geschwindigkeit, Genauigkeit, Power)

  Die "stats" sind Werte von 0–100 und werden in der App als Balken angezeigt:
    speed     - Geschwindigkeit
    accuracy  - Genauigkeit
    power     - Rechenleistung
    tokens    - Token-Kontingent (wie viel der Agent "denken/schreiben" darf)

  Felder eines Agenten:
    id, name, tagline, category, emoji, rating, description, skills
    trainable   - true = kann zusätzlich "auf Wunsch" trainiert werden
    levels      - Liste mit genau 3 Stufen (Preis + stats + was enthalten ist)
*/

const CATEGORIES = [
  { id: "all", label: "Alle" },
  { id: "support", label: "Kundensupport" },
  { id: "sales", label: "Vertrieb" },
  { id: "content", label: "Texte & Content" },
  { id: "data", label: "Daten & Analyse" },
  { id: "office", label: "Büro & Orga" },
];

// Anzeigeinfos je Level (Name + Farbe + Symbol) – zentral änderbar
const LEVEL_INFO = {
  1: { name: "Basis", color: "#5eead4", icon: "🟢" },
  2: { name: "Profi", color: "#8b7bff", icon: "🔵" },
  3: { name: "Experte", color: "#fbbf24", icon: "🟡" },
};

const AGENTS = [
  {
    id: "support-sam",
    name: "Support-Sam",
    tagline: "Beantwortet Kundenfragen rund um die Uhr.",
    category: "support",
    emoji: "🎧",
    rating: 4.8,
    trainable: true,
    description:
      "Support-Sam übernimmt Deinen Kundenservice im Chat und per E-Mail. Er antwortet sofort, freundlich und in Deinem Tonfall – Tag und Nacht. Häufige Fragen löst er allein, knifflige Fälle reicht er sauber an Dein Team weiter.",
    skills: ["Chat & E-Mail", "FAQ automatisch", "24/7 erreichbar", "Mehrsprachig"],
    levels: [
      { level: 1, price: 49,  includes: "Bis 500 Gespräche / Monat",     stats: { speed: 60, accuracy: 65, power: 40, tokens: 40 } },
      { level: 2, price: 149, includes: "Bis 3.000 Gespräche / Monat",   stats: { speed: 80, accuracy: 82, power: 70, tokens: 70 } },
      { level: 3, price: 399, includes: "Unbegrenzt + Priorität & SLA",  stats: { speed: 95, accuracy: 96, power: 95, tokens: 95 } },
    ],
  },
  {
    id: "sales-nina",
    name: "Sales-Nina",
    tagline: "Findet Leads und schreibt überzeugende Angebote.",
    category: "sales",
    emoji: "📈",
    rating: 4.6,
    trainable: true,
    description:
      "Sales-Nina recherchiert passende Interessenten, schreibt persönliche Erstansprachen und erstellt Angebote. Sie pflegt Notizen zu jedem Kontakt, damit kein Lead verloren geht.",
    skills: ["Lead-Recherche", "Kalt-Akquise-Texte", "Angebote", "CRM-Notizen"],
    levels: [
      { level: 1, price: 79,  includes: "Bis 100 Leads / Monat",        stats: { speed: 55, accuracy: 60, power: 45, tokens: 50 } },
      { level: 2, price: 199, includes: "Bis 500 Leads / Monat",        stats: { speed: 78, accuracy: 80, power: 72, tokens: 75 } },
      { level: 3, price: 499, includes: "Unbegrenzt + Team-Zugriff",    stats: { speed: 92, accuracy: 94, power: 96, tokens: 98 } },
    ],
  },
  {
    id: "writer-leo",
    name: "Writer-Leo",
    tagline: "Schreibt Blogartikel, Social Posts und Newsletter.",
    category: "content",
    emoji: "✍️",
    rating: 4.7,
    trainable: true,
    description:
      "Writer-Leo erstellt Texte für alle Kanäle – vom Blogartikel über Instagram-Posts bis zum Newsletter. Du gibst das Thema vor, Leo liefert fertige Entwürfe in Deinem Stil.",
    skills: ["Blogartikel", "Social Media", "Newsletter", "SEO-Texte"],
    levels: [
      { level: 1, price: 39,  includes: "Bis 20 Texte / Monat",          stats: { speed: 65, accuracy: 60, power: 40, tokens: 55 } },
      { level: 2, price: 119, includes: "Bis 100 Texte / Monat",         stats: { speed: 82, accuracy: 80, power: 68, tokens: 80 } },
      { level: 3, price: 299, includes: "Unbegrenzt + eigene Markenstimme", stats: { speed: 94, accuracy: 93, power: 90, tokens: 99 } },
    ],
  },
  {
    id: "data-dora",
    name: "Data-Dora",
    tagline: "Wertet Deine Tabellen aus und erstellt Berichte.",
    category: "data",
    emoji: "📊",
    rating: 4.5,
    trainable: true,
    description:
      "Data-Dora liest Deine Excel- oder CSV-Dateien, erkennt Trends und erstellt verständliche Berichte mit Diagrammen. Stelle ihr einfach Fragen zu Deinen Zahlen.",
    skills: ["Tabellen-Analyse", "Diagramme", "Berichte", "Prognosen"],
    levels: [
      { level: 1, price: 59,  includes: "Bis 10 Berichte / Monat",       stats: { speed: 50, accuracy: 70, power: 55, tokens: 45 } },
      { level: 2, price: 169, includes: "Bis 50 Berichte / Monat",       stats: { speed: 72, accuracy: 86, power: 78, tokens: 72 } },
      { level: 3, price: 449, includes: "Unbegrenzt + Datenquellen-Anbindung", stats: { speed: 90, accuracy: 98, power: 97, tokens: 95 } },
    ],
  },
  {
    id: "office-otto",
    name: "Office-Otto",
    tagline: "Plant Termine und organisiert Deinen Posteingang.",
    category: "office",
    emoji: "🗂️",
    rating: 4.4,
    trainable: false,
    description:
      "Office-Otto kümmert sich um Terminplanung, sortiert E-Mails, erstellt Zusammenfassungen von Meetings und erinnert Dich an Aufgaben. Dein digitaler Assistent fürs Tagesgeschäft.",
    skills: ["Terminplanung", "E-Mail-Sortierung", "Meeting-Notizen", "Erinnerungen"],
    levels: [
      { level: 1, price: 29,  includes: "1 Postfach",          stats: { speed: 70, accuracy: 62, power: 35, tokens: 40 } },
      { level: 2, price: 89,  includes: "Bis 5 Postfächer",    stats: { speed: 85, accuracy: 80, power: 60, tokens: 65 } },
      { level: 3, price: 249, includes: "Ganzes Team",         stats: { speed: 96, accuracy: 92, power: 85, tokens: 88 } },
    ],
  },
  {
    id: "support-mila",
    name: "Support-Mila",
    tagline: "Spezialistin für technischen Support.",
    category: "support",
    emoji: "🛠️",
    rating: 4.6,
    trainable: true,
    description:
      "Support-Mila ist auf technische Fragen spezialisiert. Sie führt Kunden Schritt für Schritt durch Probleme, erstellt Tickets und dokumentiert Lösungen für Dein Wissensarchiv.",
    skills: ["Technischer Support", "Ticket-System", "Anleitungen", "Wissensdatenbank"],
    levels: [
      { level: 1, price: 69,  includes: "Bis 400 Tickets / Monat",      stats: { speed: 58, accuracy: 68, power: 48, tokens: 50 } },
      { level: 2, price: 189, includes: "Bis 2.000 Tickets / Monat",    stats: { speed: 80, accuracy: 85, power: 75, tokens: 78 } },
      { level: 3, price: 479, includes: "Unbegrenzt + SLA",             stats: { speed: 93, accuracy: 97, power: 94, tokens: 96 } },
    ],
  },
];
