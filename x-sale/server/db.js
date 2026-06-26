/*
  db.js – winzige "Datenbank" auf Datei-Basis (JSON)
  --------------------------------------------------
  Für einen Prototyp reicht eine einzige JSON-Datei.
  Später leicht durch eine echte Datenbank (z. B. SQLite/Postgres) ersetzbar.

  Struktur:
    users       { id, email, name, salt, hash, createdAt }
    sessions    { token, userId, createdAt }     (Login-Token)
    rentals     { id, userId, agentId, level, custom, price, since }
    automations { id, userId, agentId, description, intervalMin, nextRun, active }
    runs        { id, automationId, userId, at, output }   (Protokoll der Ausführungen)
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const EMPTY = { users: [], sessions: [], rentals: [], automations: [], runs: [], agents: [] };

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY, null, 2));
}

export function read() {
  ensure();
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  } catch {
    return { ...EMPTY };
  }
}

export function write(db) {
  ensure();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// kleine Helfer
export function id(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Eine Collection bequem bearbeiten: update("rentals", list => list.concat(x))
export function update(collection, fn) {
  const db = read();
  db[collection] = fn(db[collection] || []);
  write(db);
  return db[collection];
}
