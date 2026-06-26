# x-sale · KI-Agenten mieten

Ein Marktplatz, auf dem Kunden **fertige KI-Agenten** flexibel im Monatsabo mieten können.
Dies ist ein erster funktionierender **Prototyp** – ganz ohne Installation.

## 🚀 Wie schaue ich mir die App an?

Du brauchst **kein** Programmier-Setup. Es gibt zwei Wege:

### Weg 1: Einfach die Datei öffnen (am schnellsten)
1. Lade den Ordner `x-sale` auf Deinen Computer herunter.
2. Doppelklick auf die Datei **`index.html`**.
3. Die App öffnet sich im Browser. Fertig. ✅

### Weg 2: Über einen kleinen lokalen Server (etwas „echter")
Falls Du Python auf dem Rechner hast, im Ordner `x-sale` ausführen:

```bash
python3 -m http.server 8000
```

Dann im Browser öffnen: http://localhost:8000

### Weg 3: Mit echter KI im Chat (Server)
Damit der Chat **wirklich** mit Claude antwortet (gestaffelt nach Level), gibt es im
Ordner `server/` einen kleinen Node.js-Server. Du brauchst dafür einen API-Schlüssel
von https://console.anthropic.com/ (kostet je Nutzung Geld).

```bash
cd x-sale/server
npm install
cp .env.example .env        # dann in .env den ANTHROPIC_API_KEY eintragen
npm start
```

Danach im Browser öffnen: http://localhost:3000

- **Level 1 → Haiku** (schnell & günstig)
- **Level 2 → Sonnet** (ausgewogen)
- **Level 3 → Opus** (stärkstes Modell)

Läuft kein Server (oder kein Schlüssel), fällt der Chat automatisch auf die
einfachen Demo-Antworten zurück – die App funktioniert also immer.

### Was der Server zusätzlich kann

- **Konten & Login** (`/api/register`, `/api/login`): echtes Konto mit E-Mail +
  Passwort (sicher gehasht). Daten liegen dann auf dem Server, nicht nur im Browser.
- **Agenten-Werkzeuge (Tool-Use):** der Agent kann im Chat handeln – z. B. den
  x-sale-Status abrufen oder eine **Automatisierung anlegen** („mach das jeden Tag").
- **Zeitplaner:** angelegte Automatisierungen werden **automatisch ausgeführt** und
  unter **„Aktivität"** in der App protokolliert.
- **Bezahlung (Stripe):** trägst Du `STRIPE_SECRET_KEY` in `.env` ein, läuft der
  „Mieten"-Button über eine echte Stripe-Bezahlseite. Ohne Schlüssel: Demo-Modus.
- **Anbieter-Bereich:** eingeloggte Nutzer können unter **„Anbieter"** eigene
  KI-Agenten einstellen (Name, Kategorie, Fähigkeiten, Preise je Level). Diese
  erscheinen dann für alle im Marktplatz – x-sale wird so ein echter Marktplatz.

### Was noch simuliert ist (ehrlich)
- Der **x-sale-Status** im Werkzeug liefert Demo-Zahlen (echte Anbindung kommt später).
- Der **Zeitplaner** läuft nur, solange der Server läuft (für echten Dauerbetrieb
  später z. B. ein Cron-Job).

## 🧩 Was kann die App schon?

- **Marktplatz** mit KI-Agenten – **spielerisch (gamified)** mit Level-Abzeichen
- **Level 1–3** je Agent: Geschwindigkeit, Genauigkeit, Rechenleistung und Tokens
  werden als Balken angezeigt; der Preis hängt vom Level ab
- **Vortrainiert ODER auf Wunsch trainiert** (mit Aufpreis) wählbar
- **Detailseite** je Agent mit Beschreibung, Fähigkeiten und Level-Werten
- **Chat-Demo** („Agent ausprobieren"): rede mit dem Agenten wie mit einem Kollegen
- **Automatisierungen**: sag „mach das jeden Tag" → wird als wiederkehrende Aufgabe gespeichert
- **„Mieten"-Flow**: Level wählen → Warenkorb → Mock-Checkout
- **„Meine Agenten"**: zeigt gemietete Agenten + Automatisierungen, merkt sich alles im Browser
- **Konto & XP-Gamification**: Name eingeben, persönliche Begrüßung, XP & Nutzer-Level
  fürs Mieten, Chatten und Automatisieren
- **Token-Guthaben pro Agent**: jedes Level hat ein Token-Budget, das im Chat verbraucht
  und auf dem Dashboard angezeigt wird
- **Level-Vergleich**: alle drei Level (Preis, Tempo, Genauigkeit, Power, Tokens) in einer Tabelle
- Reagiert auf Handy & Desktop (responsives Design)

## 📁 Aus welchen Dateien besteht die App?

| Datei         | Was steht drin?                                              |
|---------------|-------------------------------------------------------------|
| `index.html`  | Das Grundgerüst der Seite (Kopfzeile, Bereiche, Warenkorb)  |
| `styles.css`  | Das Aussehen (Farben, Abstände, Layout)                     |
| `data.js`     | Die **Liste der Agenten** – hier neue Agenten eintragen     |
| `app.js`      | Die Logik (Seiten wechseln, Warenkorb, Chat, Speichern)     |
| `server/`     | Node.js-Server: KI-Chat, Login, Werkzeuge, Zeitplaner, Bezahlung |

### Dateien im `server/`-Ordner

| Datei            | Was steht drin?                                          |
|------------------|----------------------------------------------------------|
| `server.js`      | Verbindet alles (Routen, Chat, Bezahlung, Start)         |
| `db.js`          | Einfache Datenbank (JSON-Datei)                          |
| `auth.js`        | Konten & Login (Passwörter sicher gehasht)               |
| `tools.js`       | Werkzeuge, die der Agent benutzen darf                   |
| `automations.js` | Zeitplaner für wiederkehrende Aufgaben                   |

## ✏️ Einen neuen Agenten hinzufügen

Öffne `data.js` und kopiere einen vorhandenen Eintrag in der Liste `AGENTS`.
Ändere `id`, `name`, `tagline`, `emoji`, `description`, `skills` und `levels` (Level 1–3).
Speichern, Seite neu laden – fertig.

## ✅ Schon umgesetzt (mit Server)

- echte KI im Chat (Modell je Level)
- Login / Konten für Kunden
- Datenbank (Datei-basiert) statt nur Browser-Speicher
- Agenten-Werkzeuge (Tool-Use): Status abrufen, Automatisierungen anlegen
- Zeitplaner, der Automatisierungen automatisch ausführt
- Bezahlung über Stripe (optional, mit Schlüssel)
- Anbieter-Bereich: Dritte stellen eigene Agenten in den Marktplatz ein

## 🔜 Nächste mögliche Schritte

- echte x-sale-Anbindung (statt Demo-Zahlen im Werkzeug)
- Dauerbetrieb des Zeitplaners (Cron-Job / Queue)
- echte Datenbank (SQLite/Postgres) statt JSON-Datei
- Bewertungen/Reviews für Anbieter-Agenten

> Hinweis: Ohne laufenden Server bleibt die App ein lokaler Prototyp
> (Browser-Speicher, Demo-Antworten). Mit Server werden die Funktionen oben echt.
