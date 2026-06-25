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
| `app.js`      | Die Logik (Seiten wechseln, Warenkorb, Speichern)           |

## ✏️ Einen neuen Agenten hinzufügen

Öffne `data.js` und kopiere einen vorhandenen Eintrag in der Liste `AGENTS`.
Ändere `id`, `name`, `tagline`, `emoji`, `description`, `skills` und `plans`.
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
