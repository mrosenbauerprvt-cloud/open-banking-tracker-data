/*
  auth.js – einfache Konten + Login
  ---------------------------------
  - Passwörter werden NIE im Klartext gespeichert, sondern mit scrypt gehasht.
  - Nach dem Login bekommt der Nutzer ein zufälliges Token (wie ein Ausweis),
    das er bei weiteren Anfragen im Header "Authorization: Bearer <token>" mitschickt.
*/

import crypto from "crypto";
import { read, write, id } from "./db.js";

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

// Admin-Regel: Wer ist Administrator?
//  - die E-Mail aus ADMIN_EMAIL (in .env), ODER
//  - der allererste registrierte Nutzer (praktisch für den Start)
function roleFor(email, isFirstUser) {
  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (adminEmail && email === adminEmail) return "admin";
  if (isFirstUser) return "admin";
  return "user";
}

export function register(email, password, name) {
  email = String(email || "").trim().toLowerCase();
  if (!email || !password) throw new Error("E-Mail und Passwort sind erforderlich.");
  const db = read();
  if (db.users.some((u) => u.email === email)) throw new Error("Diese E-Mail ist bereits registriert.");

  const salt = crypto.randomBytes(16).toString("hex");
  const user = {
    id: id("user"),
    email,
    name: name || email.split("@")[0],
    salt,
    hash: hashPassword(password, salt),
    role: roleFor(email, db.users.length === 0),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  const token = id("tok");
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  write(db);
  return { token, user: publicUser(user) };
}

export function login(email, password) {
  email = String(email || "").trim().toLowerCase();
  const db = read();
  const user = db.users.find((u) => u.email === email);
  if (!user) throw new Error("E-Mail oder Passwort falsch.");
  const hash = hashPassword(password, user.salt);
  // zeitkonstanter Vergleich gegen Timing-Angriffe
  const ok = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.hash));
  if (!ok) throw new Error("E-Mail oder Passwort falsch.");

  const token = id("tok");
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  write(db);
  return { token, user: publicUser(user) };
}

// Findet den Nutzer zu einem Token (oder null)
export function userFromToken(token) {
  if (!token) return null;
  const db = read();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user ? publicUser(user) : null;
}

// Express-Middleware: hängt req.user an, wenn ein gültiges Token mitkommt
export function attachUser(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  req.user = userFromToken(token);
  next();
}

function publicUser(u) {
  // Admin bleibt Admin; zusätzlich greift ADMIN_EMAIL auch nachträglich
  const role = u.role === "admin" ? "admin" : roleFor(u.email, false);
  return { id: u.id, email: u.email, name: u.name, role };
}
