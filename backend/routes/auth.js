import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db, { lastId } from "../db.js";
import { JWT_SECRET, authRequired } from "../middleware/auth.js";

const router = Router();

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

router.post("/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  try {
    const password_hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')")
      .run(name, email.toLowerCase().trim(), password_hash);
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(lastId(result));
    res.status(201).json({ user, token: tokenFor(user) });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Could not register" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  res.json({ user, token: tokenFor(user) });
});

router.get("/me", authRequired, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

export default router;
