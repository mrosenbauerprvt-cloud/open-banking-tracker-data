/* ============================================================
   app.js – die Logik der x-sale App
   ------------------------------------------------------------
   Aufbau:
   1) Zustand (State)  – was die App sich gerade merkt
   2) Hilfsfunktionen  – kleine Helfer (z.B. Element finden)
   3) Warenkorb        – hinzufügen, anzeigen, Summe rechnen
   4) Seiten (Views)   – Marktplatz, Detail, Dashboard, How-To
   5) Router           – schaltet zwischen den Seiten um
   6) Start            – startet alles, wenn die Seite geladen ist
   ============================================================ */

/* ---------- 1) Zustand ---------- */
const state = {
  route: "market",       // welche Seite gerade angezeigt wird
  agentId: null,         // welcher Agent in der Detailansicht ist
  search: "",            // aktueller Suchtext
  category: "all",       // aktiver Kategorie-Filter
  cart: [],              // Warenkorb: Liste von { agentId, planName, price }
  rentals: [],           // gemietete Agenten (gespeichert im Browser)
};

const STORAGE_KEY = "xsale_state_v1";

/* ---------- 2) Hilfsfunktionen ---------- */
const $ = (sel) => document.querySelector(sel);   // findet EIN Element
const app = $("#app");

function save() {
  // Warenkorb + Mietungen dauerhaft im Browser speichern
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart: state.cart, rentals: state.rentals }));
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      state.cart = saved.cart || [];
      state.rentals = saved.rentals || [];
    }
  } catch (e) { /* falls nichts gespeichert ist, einfach ignorieren */ }
}
function getAgent(id) {
  return AGENTS.find((a) => a.id === id);
}
function euro(n) {
  return n.toLocaleString("de-DE") + " €";
}
function toast(msg) {
  let el = $(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------- 3) Warenkorb ---------- */
function addToCart(agentId, plan) {
  state.cart.push({ agentId, planName: plan.name, price: plan.price });
  save();
  renderCart();
  toast("Zum Warenkorb hinzugefügt ✓");
  openCart();
}
function removeFromCart(index) {
  state.cart.splice(index, 1);
  save();
  renderCart();
}
function cartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price, 0);
}
function renderCart() {
  $("#cart-count").textContent = state.cart.length;
  $("#cart-total").textContent = euro(cartTotal());
  const box = $("#cart-items");

  if (state.cart.length === 0) {
    box.innerHTML = `<p class="cart-empty">Dein Warenkorb ist leer.<br/>Stöbere im Marktplatz und miete einen Agenten.</p>`;
    return;
  }

  box.innerHTML = state.cart.map((item, i) => {
    const agent = getAgent(item.agentId);
    return `
      <div class="cart-item">
        <div class="avatar">${agent.emoji}</div>
        <div class="cart-item-info">
          <strong>${agent.name}</strong>
          <span>Tarif ${item.planName} · ${euro(item.price)}/Monat</span>
        </div>
        <button class="icon-btn" data-remove="${i}" title="Entfernen">🗑️</button>
      </div>`;
  }).join("");

  // Lösch-Buttons aktivieren
  box.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.onclick = () => removeFromCart(Number(btn.dataset.remove));
  });
}
function openCart() {
  $("#cart-drawer").classList.add("open");
  $("#overlay").hidden = false;
}
function closeCart() {
  $("#cart-drawer").classList.remove("open");
  $("#overlay").hidden = true;
}
function checkout() {
  if (state.cart.length === 0) { toast("Dein Warenkorb ist leer."); return; }

  // Jeden Warenkorb-Eintrag in eine aktive Mietung umwandeln
  const today = new Date().toLocaleDateString("de-DE");
  state.cart.forEach((item) => {
    state.rentals.push({
      agentId: item.agentId,
      planName: item.planName,
      price: item.price,
      since: today,
    });
  });
  state.cart = [];
  save();
  renderCart();
  closeCart();
  toast("🎉 Vermietung abgeschlossen! Viel Erfolg mit Deinen Agenten.");
  navigate("dashboard");
}

/* ---------- 4) Seiten (Views) ---------- */

// Sterne-Darstellung für eine Bewertung
function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full) + ` ${rating.toFixed(1)}`;
}

// günstigster Tarif eines Agenten (für "ab X €")
function cheapest(agent) {
  return Math.min(...agent.plans.map((p) => p.price));
}

// ---- Marktplatz ----
function viewMarket() {
  const filtered = AGENTS.filter((a) => {
    const matchCat = state.category === "all" || a.category === state.category;
    const text = (a.name + " " + a.tagline + " " + a.description).toLowerCase();
    const matchSearch = text.includes(state.search.toLowerCase());
    return matchCat && matchSearch;
  });

  const chips = CATEGORIES.map((c) =>
    `<button class="chip ${state.category === c.id ? "active" : ""}" data-cat="${c.id}">${c.label}</button>`
  ).join("");

  const cards = filtered.map((a) => `
    <article class="card" data-agent="${a.id}">
      <div class="card-top">
        <div class="avatar">${a.emoji}</div>
        <div>
          <h3>${a.name}</h3>
          <div class="rating">${stars(a.rating)}</div>
        </div>
      </div>
      <p class="card-tagline">${a.tagline}</p>
      <div class="card-foot">
        <div class="price-from">ab <strong>${euro(cheapest(a))}</strong>/Monat</div>
        <span class="tag">${categoryLabel(a.category)}</span>
      </div>
    </article>
  `).join("");

  app.innerHTML = `
    <section class="hero">
      <h1>Miete <span class="grad">fertige KI-Agenten</span><br/>statt sie selbst zu bauen.</h1>
      <p>x-sale ist der Marktplatz, auf dem Du geprüfte KI-Agenten für Support, Vertrieb,
         Texte und mehr flexibel im Monatsabo mietest. Kein Code, sofort einsatzbereit.</p>
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

  // Interaktionen verbinden
  $("#search").oninput = (e) => {
    state.search = e.target.value;
    // nur das Raster neu aufbauen wäre schöner – für Anfänger halten wir es einfach:
    const cursor = e.target.selectionStart;
    viewMarket();
    const box = $("#search");
    box.focus();
    box.setSelectionRange(cursor, cursor);
  };
  app.querySelectorAll("[data-cat]").forEach((b) => {
    b.onclick = () => { state.category = b.dataset.cat; viewMarket(); };
  });
  app.querySelectorAll("[data-agent]").forEach((c) => {
    c.onclick = () => openDetail(c.dataset.agent);
  });
  app.querySelector('[data-route="market-scroll"]').onclick = () => {
    $("#agents").scrollIntoView({ behavior: "smooth" });
  };
  app.querySelector('[data-route="how"]').onclick = () => navigate("how");
}

function categoryLabel(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.label : id;
}

// ---- Detailseite eines Agenten ----
let selectedPlanIndex = 0;

function openDetail(agentId) {
  state.agentId = agentId;
  selectedPlanIndex = 0;
  navigate("detail");
}

function viewDetail() {
  const a = getAgent(state.agentId);
  if (!a) { navigate("market"); return; }

  const plans = a.plans.map((p, i) => `
    <div class="plan ${i === selectedPlanIndex ? "selected" : ""}" data-plan="${i}">
      <div>
        <div class="plan-name">${p.name}</div>
        <div class="plan-includes">${p.includes}</div>
      </div>
      <div class="plan-price">${euro(p.price)}<small>/${p.per}</small></div>
    </div>
  `).join("");

  const skillTags = a.skills.map((s) => `<span class="tag">${s}</span>`).join("");

  app.innerHTML = `
    <section class="detail">
      <a class="back-link" data-route="market">← Zurück zum Marktplatz</a>
      <div class="detail-head">
        <div class="avatar">${a.emoji}</div>
        <div>
          <h1>${a.name}</h1>
          <div class="rating">${stars(a.rating)} · ${categoryLabel(a.category)}</div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="panel">
          <h2>Über diesen Agenten</h2>
          <p>${a.description}</p>
          <h2 style="margin-top:20px">Fähigkeiten</h2>
          <div class="skill-list">${skillTags}</div>
        </div>

        <div class="panel">
          <h2>Tarif wählen</h2>
          ${plans}
          <button class="btn btn-primary btn-block" id="rent-btn" style="margin-top:8px">
            In den Warenkorb
          </button>
        </div>
      </div>
    </section>
  `;

  app.querySelector('[data-route="market"]').onclick = () => navigate("market");
  app.querySelectorAll("[data-plan]").forEach((el) => {
    el.onclick = () => { selectedPlanIndex = Number(el.dataset.plan); viewDetail(); };
  });
  $("#rent-btn").onclick = () => addToCart(a.id, a.plans[selectedPlanIndex]);
}

// ---- Dashboard "Meine Agenten" ----
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
    return `
      <div class="rental-row">
        <div class="avatar">${a.emoji}</div>
        <div class="info">
          <strong>${a.name}</strong>
          <div>Tarif ${r.planName} · seit ${r.since}</div>
        </div>
        <div class="badge">aktiv</div>
        <div style="font-weight:800; white-space:nowrap">${euro(r.price)}/Mon.</div>
        <button class="btn btn-ghost btn-sm" data-cancel="${i}">Kündigen</button>
      </div>`;
  }).join("");

  app.innerHTML = `
    <div class="section-head">
      <h1>Meine Agenten</h1>
      <div class="price-from">Monatliche Kosten: <strong>${euro(monthly)}</strong></div>
    </div>
    ${rows}
  `;

  app.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.cancel);
      const name = getAgent(state.rentals[i].agentId).name;
      state.rentals.splice(i, 1);
      save();
      toast(`${name} gekündigt.`);
      viewDashboard();
    };
  });
}

// ---- "So funktioniert's" ----
function viewHow() {
  app.innerHTML = `
    <div class="section-head"><h1>So funktioniert's</h1></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Agent aussuchen</h3>
        <p>Stöbere im Marktplatz und finde den passenden KI-Agenten für Deine Aufgabe.</p></div>
      <div class="step"><div class="num">2</div><h3>Tarif wählen</h3>
        <p>Such Dir den Tarif aus, der zu Deinem Bedarf passt – monatlich kündbar.</p></div>
      <div class="step"><div class="num">3</div><h3>Mieten</h3>
        <p>In den Warenkorb legen und mit einem Klick mieten. Keine Einrichtung nötig.</p></div>
      <div class="step"><div class="num">4</div><h3>Loslegen</h3>
        <p>Dein Agent ist sofort einsatzbereit und erscheint unter „Meine Agenten".</p></div>
    </div>
    <button class="btn btn-primary" data-route="market">Jetzt Agenten ansehen</button>
  `;
  app.querySelector('[data-route="market"]').onclick = () => navigate("market");
}

/* ---------- 5) Router ---------- */
function render() {
  // aktiven Menüpunkt markieren
  document.querySelectorAll(".nav-link").forEach((l) => {
    l.classList.toggle("active", l.dataset.route === state.route);
  });

  if (state.route === "market") viewMarket();
  else if (state.route === "detail") viewDetail();
  else if (state.route === "dashboard") viewDashboard();
  else if (state.route === "how") viewHow();

  window.scrollTo({ top: 0 });
}
function navigate(route) {
  state.route = route;
  render();
}

/* ---------- 6) Start ---------- */
function init() {
  load();
  renderCart();
  $("#year").textContent = new Date().getFullYear();

  // Navigation in der Kopfzeile
  document.querySelectorAll(".nav-link, .brand").forEach((el) => {
    el.onclick = (e) => { e.preventDefault(); navigate(el.dataset.route); };
  });

  // Warenkorb-Steuerung
  $("#cart-button").onclick = openCart;
  $("#cart-close").onclick = closeCart;
  $("#overlay").onclick = closeCart;
  $("#checkout-btn").onclick = checkout;

  render();
}

document.addEventListener("DOMContentLoaded", init);
