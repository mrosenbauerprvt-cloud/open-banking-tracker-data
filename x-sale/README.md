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
| `server/`     | Kleiner Node.js-Server für **echte KI im Chat** (optional)  |

## ✏️ Einen neuen Agenten hinzufügen

Öffne `data.js` und kopiere einen vorhandenen Eintrag in der Liste `AGENTS`.
Ändere `id`, `name`, `tagline`, `emoji`, `description`, `skills` und `levels` (Level 1–3).
Speichern, Seite neu laden – fertig.

## 🔜 Nächste mögliche Schritte (wenn Du willst)

Dies ist bewusst ein einfacher Start. Später ausbaubar zu:
- echtem Login / Konten für Kunden
- echter Bezahlung (z. B. Stripe)
- einer Datenbank statt Browser-Speicher
- einem Anbieter-Bereich, in dem Dritte eigene Agenten einstellen
- der tatsächlichen Anbindung lauffähiger KI-Agenten

> Hinweis: Dies ist ein Prototyp zur Veranschaulichung des Konzepts.
> Bezahlung und Agenten-Ausführung sind noch simuliert.
