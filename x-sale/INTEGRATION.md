# X-Sales-Integration & Admin-Zugang

Diese Anleitung erklärt, **wie die Miet-App in den X-Sales-App-Store kommt** und
**wie Du Admin wirst**.

---

## 1. Admin-Zugang (sofort nutzbar)

Die App hat jetzt eine echte **Admin-Rolle** mit eigenem Admin-Bereich
(Statistiken, Nutzer, Anbieter-Agenten, Bewertungen – mit Löschrechten).

**So wirst Du Admin – zwei Wege:**

1. **Per E-Mail (empfohlen):** In `server/.env` eintragen:
   ```
   ADMIN_EMAIL=m.rosenbauer.prvt@gmail.com
   ```
   Dann registrierst Du Dich in der App mit genau dieser E-Mail → Du bist Admin.

2. **Automatisch:** Der **allererste** registrierte Nutzer wird automatisch Admin
   (praktisch, wenn die Datenbank noch leer ist).

Nach dem Login erscheint oben der Menüpunkt **„Admin"** (nur für Admins sichtbar).

---

## 2. App in den X-Sales-App-Store einhängen

Die App liegt als eigenständiges, einbettbares Plugin vor. Beschreibung im
**`plugin.json`** (Name, Icon, Berechtigungen, Preis-Stufen, Konfigfelder).

**Empfohlener Weg (Einbettung):**
Die App ist `embeddable: true` – sie lässt sich im X-Sales-Dashboard per
`<iframe>` einbinden:
```html
<iframe src="https://DEINE-DEPLOY-URL/" style="width:100%;height:100%;border:0"></iframe>
```
Die App-Store-Kachel nutzt die Felder aus `plugin.json` (Titel, Icon, Beschreibung,
Preis-Stufen Basis/Pro/Premium = Level 1/2/3).

**Schritte:**
1. App deployen (siehe Abschnitt 3) → Du bekommst eine URL.
2. Im X-Sales-Plugin-Store einen neuen Eintrag anlegen und `plugin.json` hinterlegen.
3. Als „Embed-URL" die Deploy-URL eintragen.
4. Die Secrets (`ANTHROPIC_API_KEY`, optional `STRIPE_SECRET_KEY`, `ADMIN_EMAIL`)
   in den X-Sales-Plugin-Einstellungen hinterlegen (Felder stehen in `plugin.json`).

> Hinweis: Den finalen Eintrag im Store muss X-Sales selbst vornehmen – auf Dein
> live X-Sales (Vercel) habe ich von hier aus keinen direkten Zugriff. Diese
> Dateien liefern aber alles Nötige dafür.

---

## 3. Deployment (z. B. Vercel)

Die App besteht aus statischem Frontend + kleinem Node-Server (`server/`).

- **Einfach (nur Schaufenster):** Frontend statisch hosten (App läuft mit
  Demo-Antworten, ohne echten Chat/Konten).
- **Voll (mit Server):** Den Node-Server (`server/server.js`) als Dienst
  betreiben (Node-Host, Render, Railway, eigener VPS) und die Secrets setzen.

> Hinweis zu den fehlgeschlagenen Vercel-Deployments: Vercel braucht für den
> Express-Server eine Serverless-Anpassung. Wenn Du möchtest, baue ich eine
> Vercel-taugliche Variante (`api/`-Funktionen statt Dauer-Server) – sag Bescheid.
