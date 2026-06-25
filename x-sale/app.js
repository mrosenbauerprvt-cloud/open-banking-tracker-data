/* ============================================================
   app.js – die Logik der x-sale App
   ------------------------------------------------------------
   1) Zustand (State)
   2) Hilfsfunktionen
   3) Warenkorb
   4) Seiten: Marktplatz, Detail, Chat-Demo, Dashboard, How-To
   5) Router
   6) Start
   ============================================================ */

/* ---------- 1) Zustand ---------- */
const state = {
  route: "market",
  agentId: null,        // aktueller Agent (Detail/Chat)
  selectedLevel: 1,     // gewähltes Level in der Detailansicht (1–3)
  custom: false,        // "auf Wunsch trainieren" angekreuzt?
  search: "",
  category: "all",
  cart: [],             // { agentId, level, price, custom }
  rentals: [],          // gemietete Agenten
  chats: {},            // Chatverlauf je Agent: { agentId: [ {from, text} ] }
  automations: {},      // Automatisierungen je Agent: { agentId: [ "täglich ..." ] }
  user: null,           // { name }  – einfaches Konto
  xp: 0,                // Erfahrungspunkte (Gamification)
  tokenUsed: {},        // verbrauchte Tokens je Agent: { agentId: number }
};

const STORAGE_KEY = "xsale_state_v3";

// Gamification-Einstellungen
const XP_PER_LEVEL = 500;                 // XP, die ein Nutzer-Level kostet
const XP = { rent: 100, chat: 10, auto: 50, signup: 50 };
const TOKENS_PER_MESSAGE = 250;           // Demo: so viele Tokens "kostet" eine Nachricht
const tokenBudget = (agent, level) => getLevel(agent, level).stats.tokens * 1000;

/* ---------- 2) Hilfsfunktionen ---------- */
const $ = (sel) => document.querySelector(sel);
const app = $("#app");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cart: state.cart, rentals: state.rentals,
    chats: state.chats, automations: state.automations,
    user: state.user, xp: state.xp, tokenUsed: state.tokenUsed,
  }));
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s) {
      state.cart = s.cart || [];
      state.rentals = s.rentals || [];
      state.chats = s.chats || {};
      state.automations = s.automations || {};
      state.user = s.user || null;
      state.xp = s.xp || 0;
      state.tokenUsed = s.tokenUsed || {};
    }
  } catch (e) {}
}

/* ---------- Gamification: XP & Konto ---------- */
const userLevel = () => Math.floor(state.xp / XP_PER_LEVEL) + 1;
const xpInLevel = () => state.xp % XP_PER_LEVEL;

function addXp(amount, reason) {
  const before = userLevel();
  state.xp += amount;
  save();
  if (userLevel() > before) toast(`🏆 Level ${userLevel()} erreicht! Stark!`);
  else if (amount > 0) toast(`+${amount} XP ${reason ? "· " + reason : ""}`);
  renderAccount();
}

function renderAccount() {
  const label = $("#account-label");
  if (!label) return;
  label.textContent = state.user ? `👤 ${state.user.name} · ⭐ Lvl ${userLevel()}` : "👤 Anmelden";
}

function openAccount() {
  const modal = $("#account-modal");
  const input = $("#account-name");
  const stats = $("#account-stats");
  $("#account-title").textContent = state.user
    ? `Hallo, ${state.user.name}! 👋` : "Willkommen bei x-sale 👋";
  input.value = state.user ? state.user.name : "";
  stats.innerHTML = state.user ? `
    <div class="xp-box">
      <div class="xp-head"><span>⭐ Nutzer-Level ${userLevel()}</span><span>${xpInLevel()} / ${XP_PER_LEVEL} XP</span></div>
      <div class="stat-track"><div class="stat-fill" style="width:${(xpInLevel()/XP_PER_LEVEL)*100}%"></div></div>
      <p class="modal-text" style="margin-top:10px">Du sammelst XP durchs Mieten, Chatten und Automatisieren.</p>
    </div>` : "";
  modal.hidden = false;
  $("#overlay").hidden = false;
  input.focus();
}
function closeAccount() { $("#account-modal").hidden = true; $("#overlay").hidden = true; }
function saveAccount() {
  const name = $("#account-name").value.trim();
  if (!name) { toast("Bitte gib einen Namen ein."); return; }
  const isNew = !state.user;
  state.user = { name };
  save();
  renderAccount();
  if (isNew) addXp(XP.signup, "Willkommen!");
  closeAccount();
  toast(`Willkommen, ${name}! 🎉`);
}
const getAgent = (id) => AGENTS.find((a) => a.id === id);
const euro = (n) => n.toLocaleString("de-DE") + " €";
const categoryLabel = (id) => (CATEGORIES.find((x) => x.id === id) || {}).label || id;
const getLevel = (agent, lvl) => agent.levels.find((l) => l.level === lvl);

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full) + ` ${rating.toFixed(1)}`;
}
const cheapest = (agent) => Math.min(...agent.levels.map((l) => l.price));

// Aufschlag für individuelles Training (auf Wunsch trainiert): +40 %
const CUSTOM_SURCHARGE = 0.4;
function priceFor(agent, level, custom) {
  const base = getLevel(agent, level).price;
  return Math.round(custom ? base * (1 + CUSTOM_SURCHARGE) : base);
}

function toast(msg) {
  let el = $(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2400);
}

// kleiner Werte-Balken (z.B. Geschwindigkeit 80/100)
function statBar(label, value) {
  return `
    <div class="stat">
      <div class="stat-head"><span>${label}</span><span>${value}</span></div>
      <div class="stat-track"><div class="stat-fill" style="width:${value}%"></div></div>
    </div>`;
}

// Level-Abzeichen (gamifiziert)
function levelBadge(lvl) {
  const info = LEVEL_INFO[lvl];
  return `<span class="lvl-badge" style="--lc:${info.color}">${info.icon} Lvl ${lvl} · ${info.name}</span>`;
}

/* ---------- 3) Warenkorb ---------- */
function addToCart(agentId, level, custom) {
  const agent = getAgent(agentId);
  state.cart.push({ agentId, level, price: priceFor(agent, level, custom), custom });
  save();
  renderCart();
  toast("Zum Warenkorb hinzugefügt ✓");
  openCart();
}
function removeFromCart(i) { state.cart.splice(i, 1); save(); renderCart(); }
const cartTotal = () => state.cart.reduce((s, it) => s + it.price, 0);

function renderCart() {
  $("#cart-count").textContent = state.cart.length;
  $("#cart-total").textContent = euro(cartTotal());
  const box = $("#cart-items");
  if (state.cart.length === 0) {
    box.innerHTML = `<p class="cart-empty">Dein Warenkorb ist leer.<br/>Stöbere im Marktplatz und miete einen Agenten.</p>`;
    return;
  }
  box.innerHTML = state.cart.map((item, i) => {
    const a = getAgent(item.agentId);
    return `
      <div class="cart-item">
        <div class="avatar">${a.emoji}</div>
        <div class="cart-item-info">
          <strong>${a.name}</strong>
          <span>${levelBadge(item.level)} ${item.custom ? "· 🎓 individuell" : ""}</span>
          <span>${euro(item.price)}/Monat</span>
        </div>
        <button class="icon-btn" data-remove="${i}" title="Entfernen">🗑️</button>
      </div>`;
  }).join("");
  box.querySelectorAll("[data-remove]").forEach((b) => b.onclick = () => removeFromCart(Number(b.dataset.remove)));
}
function openCart() { $("#cart-drawer").classList.add("open"); $("#overlay").hidden = false; }
function closeCart() { $("#cart-drawer").classList.remove("open"); $("#overlay").hidden = true; }

function checkout() {
  if (state.cart.length === 0) { toast("Dein Warenkorb ist leer."); return; }
  const today = new Date().toLocaleDateString("de-DE");
  const count = state.cart.length;
  state.cart.forEach((item) => {
    state.rentals.push({ ...item, since: today });
  });
  state.cart = [];
  save();
  renderCart();
  closeCart();
  addXp(XP.rent * count, "Agent gemietet");
  toast("🎉 Vermietung abgeschlossen! Viel Erfolg mit Deinen Agenten.");
  navigate("dashboard");
}

/* ---------- 4) Seiten ---------- */

// ---- Marktplatz (gamifiziert) ----
function viewMarket() {
  const filtered = AGENTS.filter((a) => {
    const matchCat = state.category === "all" || a.category === state.category;
    const text = (a.name + " " + a.tagline + " " + a.description).toLowerCase();
    return matchCat && text.includes(state.search.toLowerCase());
  });

  const chips = CATEGORIES.map((c) =>
    `<button class="chip ${state.category === c.id ? "active" : ""}" data-cat="${c.id}">${c.label}</button>`
  ).join("");

  const cards = filtered.map((a) => {
    const lvls = a.levels.map((l) => levelBadge(l.level)).join(" ");
    const top = getLevel(a, 3).stats; // Top-Werte als kleine Vorschau
    return `
    <article class="card" data-agent="${a.id}">
      <div class="card-top">
        <div class="avatar glow">${a.emoji}</div>
        <div>
          <h3>${a.name}</h3>
          <div class="rating">${stars(a.rating)}</div>
        </div>
        ${a.trainable ? `<span class="train-flag" title="Kann auf Wunsch trainiert werden">🎓 trainierbar</span>` : ""}
      </div>
      <p class="card-tagline">${a.tagline}</p>
      <div class="card-levels">${lvls}</div>
      <div class="mini-stats">
        <span title="Geschwindigkeit">⚡ ${top.speed}</span>
        <span title="Genauigkeit">🎯 ${top.accuracy}</span>
        <span title="Rechenleistung">🧠 ${top.power}</span>
      </div>
      <div class="card-foot">
        <div class="price-from">ab <strong>${euro(cheapest(a))}</strong>/Monat</div>
        <span class="tag">${categoryLabel(a.category)}</span>
      </div>
    </article>`;
  }).join("");

  app.innerHTML = `
    <section class="hero">
      <h1>Miete <span class="grad">fertige KI-Agenten</span><br/>in Level 1 bis 3.</h1>
      <p>x-sale ist der Marktplatz, auf dem Du geprüfte KI-Agenten flexibel mietest –
         vortrainiert oder <strong>auf Deinen Wunsch trainiert</strong>. Jeder Agent gibt es in
         drei Leveln (Tokens, Tempo, Genauigkeit, Rechenleistung). Du chattest einfach mit ihnen
         wie mit einem Kollegen.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-route="market-scroll">Agenten ansehen</button>
        <button class="btn btn-ghost" data-route="how">So funktioniert's</button>
      </div>
    </section>

    <div class="toolbar" id="agents">
      <div class="search-box">
        <input id="search" type="text" placeholder="Agenten durchsuchen…" value="${state.search}" />
      </div>
      <div class="chips">${chips}</div>
    </div>

    ${filtered.length
      ? `<div class="grid">${cards}</div>`
      : `<div class="empty-state">Keine Agenten gefunden. Versuche einen anderen Suchbegriff.</div>`}
  `;

  const s = $("#search");
  s.oninput = (e) => {
    state.search = e.target.value;
    const pos = e.target.selectionStart;
    viewMarket();
    const box = $("#search"); box.focus(); box.setSelectionRange(pos, pos);
  };
  app.querySelectorAll("[data-cat]").forEach((b) => b.onclick = () => { state.category = b.dataset.cat; viewMarket(); });
  app.querySelectorAll("[data-agent]").forEach((c) => c.onclick = () => openDetail(c.dataset.agent));
  app.querySelector('[data-route="market-scroll"]').onclick = () => $("#agents").scrollIntoView({ behavior: "smooth" });
  app.querySelector('[data-route="how"]').onclick = () => navigate("how");
}

// ---- Detailseite ----
function openDetail(agentId) {
  state.agentId = agentId;
  state.selectedLevel = 1;
  state.custom = false;
  navigate("detail");
}

function viewDetail() {
  const a = getAgent(state.agentId);
  if (!a) { navigate("market"); return; }
  const lvl = getLevel(a, state.selectedLevel);
  const price = priceFor(a, state.selectedLevel, state.custom);

  const levelTabs = a.levels.map((l) => {
    const info = LEVEL_INFO[l.level];
    return `<button class="level-tab ${l.level === state.selectedLevel ? "active" : ""}"
              style="--lc:${info.color}" data-level="${l.level}">
              ${info.icon} Level ${l.level}<small>${info.name}</small>
            </button>`;
  }).join("");

  const statsHtml = statBar("⚡ Geschwindigkeit", lvl.stats.speed)
    + statBar("🎯 Genauigkeit", lvl.stats.accuracy)
    + statBar("🧠 Rechenleistung", lvl.stats.power)
    + statBar("🪙 Token-Kontingent", lvl.stats.tokens);

  const skillTags = a.skills.map((s) => `<span class="tag">${s}</span>`).join("");

  // Vergleichstabelle aller drei Level
  const compareRows = [
    ["", a.levels.map((l) => `<th>${LEVEL_INFO[l.level].icon} Level ${l.level}<br/><small>${LEVEL_INFO[l.level].name}</small></th>`).join("")],
    ["💶 Preis/Monat", a.levels.map((l) => `<td><strong>${euro(l.price)}</strong></td>`).join("")],
    ["⚡ Geschwindigkeit", a.levels.map((l) => `<td>${l.stats.speed}</td>`).join("")],
    ["🎯 Genauigkeit", a.levels.map((l) => `<td>${l.stats.accuracy}</td>`).join("")],
    ["🧠 Rechenleistung", a.levels.map((l) => `<td>${l.stats.power}</td>`).join("")],
    ["🪙 Tokens", a.levels.map((l) => `<td>${(l.stats.tokens*1000).toLocaleString("de-DE")}</td>`).join("")],
    ["📦 Enthalten", a.levels.map((l) => `<td>${l.includes}</td>`).join("")],
  ].map((r, i) => i === 0 ? `<tr><th></th>${r[1]}</tr>` : `<tr><th class="rowhead">${r[0]}</th>${r[1]}</tr>`).join("");

  app.innerHTML = `
    <section class="detail">
      <a class="back-link" data-route="market">← Zurück zum Marktplatz</a>
      <div class="detail-head">
        <div class="avatar glow">${a.emoji}</div>
        <div>
          <h1>${a.name}</h1>
          <div class="rating">${stars(a.rating)} · ${categoryLabel(a.category)}
            ${a.trainable ? `· <span class="train-flag">🎓 trainierbar</span>` : ""}</div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="panel">
          <h2>Über diesen Agenten</h2>
          <p>${a.description}</p>
          <h2 style="margin-top:20px">Fähigkeiten</h2>
          <div class="skill-list">${skillTags}</div>
          <h2 style="margin-top:20px">Leistung in Level ${state.selectedLevel}</h2>
          <div class="stats">${statsHtml}</div>
        </div>

        <div class="panel">
          <h2>Level wählen</h2>
          <div class="level-tabs">${levelTabs}</div>
          <p class="plan-includes" style="margin:12px 0">📦 ${lvl.includes}</p>

          ${a.trainable ? `
          <label class="custom-toggle">
            <input type="checkbox" id="custom-check" ${state.custom ? "checked" : ""} />
            <span>🎓 Auf meinen Wunsch trainieren <small>(+${Math.round(CUSTOM_SURCHARGE*100)} %)</small></span>
          </label>` : `<p class="plan-includes">Dieser Agent ist nur vortrainiert verfügbar.</p>`}

          <div class="price-display">
            <span>${euro(price)}</span><small>/Monat</small>
          </div>

          <button class="btn btn-primary btn-block" id="rent-btn">In den Warenkorb</button>
          <button class="btn btn-ghost btn-block" id="try-btn" style="margin-top:10px">💬 Agent ausprobieren</button>
        </div>
      </div>

      <div class="panel" style="margin-top:18px">
        <h2>Level vergleichen</h2>
        <div class="compare-wrap">
          <table class="compare-table">${compareRows}</table>
        </div>
      </div>
    </section>
  `;

  app.querySelector('[data-route="market"]').onclick = () => navigate("market");
  app.querySelectorAll("[data-level]").forEach((el) =>
    el.onclick = () => { state.selectedLevel = Number(el.dataset.level); viewDetail(); });
  const cc = $("#custom-check");
  if (cc) cc.onchange = () => { state.custom = cc.checked; viewDetail(); };
  $("#rent-btn").onclick = () => addToCart(a.id, state.selectedLevel, state.custom);
  $("#try-btn").onclick = () => navigate("chat");
}

// ---- Chat-Demo + Automatisierungen ----
function pushChat(agentId, from, text) {
  if (!state.chats[agentId]) state.chats[agentId] = [];
  state.chats[agentId].push({ from, text });
  save();
}

// Holt eine Antwort vom Server (echte KI). Klappt das nicht (kein Server /
// kein API-Schlüssel / file://), wird auf die Demo-Antwort zurückgefallen.
async function getReply(agent, level, history, userText) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: { name: agent.name, skills: agent.skills, tagline: agent.tagline },
        level,
        history: history.map((m) => ({ from: m.from, text: m.text })),
      }),
    });
    if (!res.ok) throw new Error("Server-Fehler");
    const data = await res.json();
    if (data.reply) return data.reply;
    throw new Error("Leere Antwort");
  } catch (e) {
    // Rückfall: Demo-Antwort (ohne echte KI)
    return botReply(agent, userText);
  }
}

// einfache "Antwort-Logik" der Demo (Rückfall, wenn kein Server läuft)
function botReply(agent, userText) {
  const t = userText.toLowerCase();
  if (/(jeden tag|täglich|immer|wiederhol|automatisch|jede woche|montags)/.test(t)) {
    return `Klar! Ich kann das wiederkehrend für Dich übernehmen. ` +
           `Tippe unten auf „➕ Als Automatisierung speichern", dann erledige ich das automatisch. ` +
           `(In dieser Demo wird die Aufgabe nur gespeichert – die echte Ausführung kommt später.)`;
  }
  if (/(zugriff|x-sale|verbinde|verknüpf|account|konto)/.test(t)) {
    return `Verstanden. Sobald Du mir in der echten Version Zugriff auf Dein x-sale-Konto gibst, ` +
           `kann ich solche Aufgaben direkt dort erledigen. In dieser Demo zeige ich Dir nur, wie es sich anfühlt.`;
  }
  if (/(hallo|hi|hey|guten tag|moin)/.test(t)) {
    return `Hallo! Ich bin ${agent.name}. Ich kann Dir z. B. helfen mit: ${agent.skills.join(", ")}. Was möchtest Du?`;
  }
  return `Als ${agent.name} würde ich das so angehen: Ich nutze meine Fähigkeiten ` +
         `(${agent.skills.slice(0,2).join(", ")}), um „${userText}" für Dich zu erledigen. ` +
         `Sag mir gern mehr Details – oder ob ich das regelmäßig wiederholen soll.`;
}

function viewChat() {
  const a = getAgent(state.agentId);
  if (!a) { navigate("market"); return; }
  const history = state.chats[a.id] || [];
  const autos = state.automations[a.id] || [];
  const rental = state.rentals.find((r) => r.agentId === a.id);
  const budget = rental ? tokenBudget(a, rental.level) : 0;
  const used = state.tokenUsed[a.id] || 0;
  const remaining = Math.max(0, budget - used);

  const tokenBar = rental ? `
    <div class="token-meter">
      <div class="stat-head"><span>🪙 Token-Guthaben (${levelBadge(rental.level)})</span>
        <span>${remaining.toLocaleString("de-DE")} / ${budget.toLocaleString("de-DE")}</span></div>
      <div class="stat-track"><div class="stat-fill" style="width:${budget ? (remaining/budget)*100 : 0}%"></div></div>
    </div>` : `<p class="plan-includes">🔓 Demo-Modus – miete ${a.name}, um echtes Token-Guthaben zu erhalten.</p>`;

  const typingHtml = state.typing ? `
    <div class="msg bot">
      <div class="msg-ava">${a.emoji}</div>
      <div class="bubble typing"><span></span><span></span><span></span></div>
    </div>` : "";

  const messages = (history.length
    ? history.map((m) => `
        <div class="msg ${m.from}">
          ${m.from === "bot" ? `<div class="msg-ava">${a.emoji}</div>` : ""}
          <div class="bubble">${m.text}</div>
        </div>`).join("")
    : `<div class="chat-hint">👋 Schreib ${a.name} eine Nachricht – z. B.
         „Fasse mir jeden Tag meine neuen Anfragen zusammen".</div>`) + typingHtml;

  const autoList = autos.length
    ? autos.map((x, i) => `<li>🔁 ${x} <button class="icon-btn" data-del-auto="${i}">✕</button></li>`).join("")
    : `<li class="muted">Noch keine Automatisierungen. Beschreibe oben eine wiederkehrende Aufgabe.</li>`;

  app.innerHTML = `
    <section class="detail">
      <a class="back-link" data-back>← Zurück</a>
      <div class="detail-head">
        <div class="avatar glow">${a.emoji}</div>
        <div>
          <h1>${a.name}</h1>
          <div class="rating">Demo-Chat · ${categoryLabel(a.category)}</div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="panel chat-panel">
          ${tokenBar}
          <div class="chat-window" id="chat-window">${messages}</div>
          <div class="chat-input">
            <input id="chat-text" type="text" placeholder="Nachricht an ${a.name}…" />
            <button class="btn btn-primary" id="send-btn">Senden</button>
          </div>
          <button class="btn btn-ghost btn-block" id="auto-btn" style="margin-top:10px">
            ➕ Letzte Aufgabe als Automatisierung speichern
          </button>
        </div>

        <div class="panel">
          <h2>🔁 Automatisierungen</h2>
          <p class="plan-includes">Aufgaben, die ${a.name} immer wieder für Dich erledigt.</p>
          <ul class="auto-list">${autoList}</ul>
        </div>
      </div>
    </section>
  `;

  app.querySelector("[data-back]").onclick = () => openDetail(a.id);

  const input = $("#chat-text");
  const chatLevel = rental ? rental.level : 1;
  const send = async () => {
    const text = input.value.trim();
    if (!text || state.typing) return;
    if (rental && remaining < TOKENS_PER_MESSAGE) {
      toast("🪙 Token-Guthaben aufgebraucht – upgrade das Level für mehr.");
      return;
    }
    pushChat(a.id, "user", text);
    if (rental) { state.tokenUsed[a.id] = used + TOKENS_PER_MESSAGE; save(); }
    input.value = "";
    addXp(XP.chat, "Chat");
    state.typing = true;
    viewChat();
    const w0 = $("#chat-window"); if (w0) w0.scrollTop = w0.scrollHeight;

    const reply = await getReply(a, chatLevel, state.chats[a.id] || [], text);
    pushChat(a.id, "bot", reply);
    state.typing = false;
    viewChat();
    const w = $("#chat-window"); if (w) w.scrollTop = w.scrollHeight;
  };
  $("#send-btn").onclick = send;
  input.onkeydown = (e) => { if (e.key === "Enter") send(); };
  input.focus();

  $("#auto-btn").onclick = () => {
    const lastUser = [...(state.chats[a.id] || [])].reverse().find((m) => m.from === "user");
    if (!lastUser) { toast("Schreibe zuerst, was wiederholt werden soll."); return; }
    if (!state.automations[a.id]) state.automations[a.id] = [];
    state.automations[a.id].push(lastUser.text);
    save();
    addXp(XP.auto, "Automatisierung");
    toast("Automatisierung gespeichert 🔁");
    viewChat();
  };
  app.querySelectorAll("[data-del-auto]").forEach((b) =>
    b.onclick = () => { state.automations[a.id].splice(Number(b.dataset.delAuto), 1); save(); viewChat(); });

  const w = $("#chat-window"); if (w) w.scrollTop = w.scrollHeight;
}

// ---- Dashboard ----
function viewDashboard() {
  if (state.rentals.length === 0) {
    app.innerHTML = `
      <div class="section-head"><h1>Meine Agenten</h1></div>
      <div class="empty-state">
        Du hast noch keine Agenten gemietet.<br/>
        <button class="btn btn-primary" style="margin-top:16px" data-route="market">Zum Marktplatz</button>
      </div>`;
    app.querySelector('[data-route="market"]').onclick = () => navigate("market");
    return;
  }

  const monthly = state.rentals.reduce((s, r) => s + r.price, 0);
  const rows = state.rentals.map((r, i) => {
    const a = getAgent(r.agentId);
    const autos = (state.automations[a.id] || []).length;
    const budget = tokenBudget(a, r.level);
    const used = state.tokenUsed[a.id] || 0;
    const remaining = Math.max(0, budget - used);
    const pct = budget ? (remaining / budget) * 100 : 0;
    return `
      <div class="rental-row">
        <div class="avatar glow">${a.emoji}</div>
        <div class="info">
          <strong>${a.name}</strong>
          <div>${levelBadge(r.level)} ${r.custom ? "· 🎓 individuell" : ""} · seit ${r.since}</div>
          <div>🔁 ${autos} Automatisierung${autos === 1 ? "" : "en"}</div>
          <div class="row-token">
            <div class="stat-track"><div class="stat-fill" style="width:${pct}%"></div></div>
            <small>🪙 ${remaining.toLocaleString("de-DE")} Tokens übrig</small>
          </div>
        </div>
        <div class="badge">aktiv</div>
        <div style="font-weight:800; white-space:nowrap">${euro(r.price)}/Mon.</div>
        <button class="btn btn-ghost btn-sm" data-chat="${a.id}">💬 Chat</button>
        <button class="btn btn-ghost btn-sm" data-cancel="${i}">Kündigen</button>
      </div>`;
  }).join("");

  const greeting = state.user ? `Hallo, ${state.user.name}! ` : "";
  app.innerHTML = `
    <div class="section-head">
      <h1>${greeting}Meine Agenten</h1>
      <div class="price-from">⭐ Level ${userLevel()} · Monatlich: <strong>${euro(monthly)}</strong></div>
    </div>
    ${rows}
  `;

  app.querySelectorAll("[data-chat]").forEach((b) =>
    b.onclick = () => { state.agentId = b.dataset.chat; navigate("chat"); });
  app.querySelectorAll("[data-cancel]").forEach((b) =>
    b.onclick = () => {
      const i = Number(b.dataset.cancel);
      const name = getAgent(state.rentals[i].agentId).name;
      state.rentals.splice(i, 1);
      save();
      toast(`${name} gekündigt.`);
      viewDashboard();
    });
}

// ---- "So funktioniert's" ----
function viewHow() {
  app.innerHTML = `
    <div class="section-head"><h1>So funktioniert's</h1></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Agent aussuchen</h3>
        <p>Finde im Marktplatz den passenden KI-Agenten – jeder spielerisch mit Leveln dargestellt.</p></div>
      <div class="step"><div class="num">2</div><h3>Level wählen</h3>
        <p>Level 1–3 bestimmen Tokens, Tempo, Genauigkeit und Rechenleistung. Optional: auf Wunsch trainieren.</p></div>
      <div class="step"><div class="num">3</div><h3>Mieten & chatten</h3>
        <p>Miete den Agenten und rede mit ihm wie mit einem Kollegen – ganz natürlich im Chat.</p></div>
      <div class="step"><div class="num">4</div><h3>Automatisieren</h3>
        <p>Sag „mach das jeden Tag" und der Agent erledigt es immer wieder – auch in Deinem x-sale-Konto.</p></div>
    </div>
    <button class="btn btn-primary" data-route="market">Jetzt Agenten ansehen</button>
  `;
  app.querySelector('[data-route="market"]').onclick = () => navigate("market");
}

/* ---------- 5) Router ---------- */
function render() {
  document.querySelectorAll(".nav-link").forEach((l) =>
    l.classList.toggle("active", l.dataset.route === state.route));
  if (state.route === "market") viewMarket();
  else if (state.route === "detail") viewDetail();
  else if (state.route === "chat") viewChat();
  else if (state.route === "dashboard") viewDashboard();
  else if (state.route === "how") viewHow();
  if (state.route !== "chat") window.scrollTo({ top: 0 });
}
function navigate(route) { state.route = route; render(); }

/* ---------- 6) Start ---------- */
function init() {
  load();
  renderCart();
  renderAccount();
  $("#year").textContent = new Date().getFullYear();
  document.querySelectorAll(".nav-link, .brand").forEach((el) =>
    el.onclick = (e) => { e.preventDefault(); navigate(el.dataset.route); });
  $("#cart-button").onclick = openCart;
  $("#cart-close").onclick = closeCart;
  $("#overlay").onclick = () => { closeCart(); closeAccount(); };
  $("#checkout-btn").onclick = checkout;
  $("#account-button").onclick = openAccount;
  $("#account-close").onclick = closeAccount;
  $("#account-save").onclick = saveAccount;
  $("#account-name").onkeydown = (e) => { if (e.key === "Enter") saveAccount(); };
  render();
}
document.addEventListener("DOMContentLoaded", init);
