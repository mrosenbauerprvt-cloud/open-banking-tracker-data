/*
  data.js
  --------
  Hier stehen die "Daten" der App: die Liste der mietbaren KI-Agenten.
  Du kannst hier einfach Agenten hinzufügen, löschen oder ändern.
  Jeder Agent ist ein Objekt { ... } in der großen Liste AGENTS = [ ... ].

  Felder eines Agenten:
    id          - eindeutige Kennung (Kleinbuchstaben, keine Leerzeichen)
    name        - Anzeigename
    tagline     - kurzer Werbesatz
    category    - Kategorie (für den Filter oben)
    emoji       - kleines Symbol als Platzhalter-Bild
    rating      - Bewertung von 0 bis 5
    description - längerer Beschreibungstext
    skills      - Liste von Fähigkeiten (Stichwörter)
    plans       - die mietbaren Tarife (Name, Preis pro Monat, was enthalten ist)
*/

const CATEGORIES = [
  { id: "all", label: "Alle" },
  { id: "support", label: "Kundensupport" },
  { id: "sales", label: "Vertrieb" },
  { id: "content", label: "Texte & Content" },
  { id: "data", label: "Daten & Analyse" },
  { id: "office", label: "Büro & Orga" },
];

const AGENTS = [
  {
    id: "support-sam",
    name: "Support-Sam",
    tagline: "Beantwortet Kundenfragen rund um die Uhr.",
    category: "support",
    emoji: "🎧",
    rating: 4.8,
    description:
      "Support-Sam übernimmt Deinen Kundenservice im Chat und per E-Mail. Er antwortet sofort, freundlich und in Deinem Tonfall – Tag und Nacht. Häufige Fragen löst er allein, knifflige Fälle reicht er sauber an Dein Team weiter.",
    skills: ["Chat & E-Mail", "FAQ automatisch", "24/7 erreichbar", "Mehrsprachig"],
    plans: [
      { name: "Start", price: 49, per: "Monat", includes: "Bis 500 Gespräche / Monat" },
      { name: "Pro", price: 149, per: "Monat", includes: "Bis 3.000 Gespräche / Monat" },
      { name: "Business", price: 399, per: "Monat", includes: "Unbegrenzte Gespräche + Priorität" },
    ],
  },
  {
    id: "sales-nina",
    name: "Sales-Nina",
    tagline: "Findet Leads und schreibt überzeugende Angebote.",
    category: "sales",
    emoji: "📈",
    rating: 4.6,
    description:
      "Sales-Nina recherchiert passende Interessenten, schreibt persönliche Erstansprachen und erstellt Angebote. Sie pflegt Notizen zu jedem Kontakt, damit kein Lead verloren geht.",
    skills: ["Lead-Recherche", "Kalt-Akquise-Texte", "Angebote", "CRM-Notizen"],
    plans: [
      { name: "Start", price: 79, per: "Monat", includes: "Bis 100 Leads / Monat" },
      { name: "Pro", price: 199, per: "Monat", includes: "Bis 500 Leads / Monat" },
      { name: "Business", price: 499, per: "Monat", includes: "Unbegrenzt + Team-Zugriff" },
    ],
  },
  {
    id: "writer-leo",
    name: "Writer-Leo",
    tagline: "Schreibt Blogartikel, Social Posts und Newsletter.",
    category: "content",
    emoji: "✍️",
    rating: 4.7,
    description:
      "Writer-Leo erstellt Texte für alle Kanäle – vom Blogartikel über Instagram-Posts bis zum Newsletter. Du gibst das Thema vor, Leo liefert fertige Entwürfe in Deinem Stil.",
    skills: ["Blogartikel", "Social Media", "Newsletter", "SEO-Texte"],
    plans: [
      { name: "Start", price: 39, per: "Monat", includes: "Bis 20 Texte / Monat" },
      { name: "Pro", price: 119, per: "Monat", includes: "Bis 100 Texte / Monat" },
      { name: "Business", price: 299, per: "Monat", includes: "Unbegrenzt + Markenstimme" },
    ],
  },
  {
    id: "data-dora",
    name: "Data-Dora",
    tagline: "Wertet Deine Tabellen aus und erstellt Berichte.",
    category: "data",
    emoji: "📊",
    rating: 4.5,
    description:
      "Data-Dora liest Deine Excel- oder CSV-Dateien, erkennt Trends und erstellt verständliche Berichte mit Diagrammen. Stelle ihr einfach Fragen zu Deinen Zahlen.",
    skills: ["Tabellen-Analyse", "Diagramme", "Berichte", "Prognosen"],
    plans: [
      { name: "Start", price: 59, per: "Monat", includes: "Bis 10 Berichte / Monat" },
      { name: "Pro", price: 169, per: "Monat", includes: "Bis 50 Berichte / Monat" },
      { name: "Business", price: 449, per: "Monat", includes: "Unbegrenzt + Datenquellen-Anbindung" },
    ],
  },
  {
    id: "office-otto",
    name: "Office-Otto",
    tagline: "Plant Termine und organisiert Deinen Posteingang.",
    category: "office",
    emoji: "🗂️",
    rating: 4.4,
    description:
      "Office-Otto kümmert sich um Terminplanung, sortiert E-Mails, erstellt Zusammenfassungen von Meetings und erinnert Dich an Aufgaben. Dein digitaler Assistent fürs Tagesgeschäft.",
    skills: ["Terminplanung", "E-Mail-Sortierung", "Meeting-Notizen", "Erinnerungen"],
    plans: [
      { name: "Start", price: 29, per: "Monat", includes: "1 Postfach" },
      { name: "Pro", price: 89, per: "Monat", includes: "Bis 5 Postfächer" },
      { name: "Business", price: 249, per: "Monat", includes: "Ganzes Team" },
    ],
  },
  {
    id: "support-mila",
    name: "Support-Mila",
    tagline: "Spezialistin für technischen Support.",
    category: "support",
    emoji: "🛠️",
    rating: 4.6,
    description:
      "Support-Mila ist auf technische Fragen spezialisiert. Sie führt Kunden Schritt für Schritt durch Probleme, erstellt Tickets und dokumentiert Lösungen für Dein Wissensarchiv.",
    skills: ["Technischer Support", "Ticket-System", "Anleitungen", "Wissensdatenbank"],
    plans: [
      { name: "Start", price: 69, per: "Monat", includes: "Bis 400 Tickets / Monat" },
      { name: "Pro", price: 189, per: "Monat", includes: "Bis 2.000 Tickets / Monat" },
      { name: "Business", price: 479, per: "Monat", includes: "Unbegrenzt + SLA" },
    ],
  },
];
