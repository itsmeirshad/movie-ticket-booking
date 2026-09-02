import { Router } from "express";
import db, { lastId } from "../db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/", (_req, res) => {
  const movies = db.prepare("SELECT * FROM movies ORDER BY id DESC").all();
  res.json(movies);
});

router.get("/:id", (req, res) => {
  const movie = db.prepare("SELECT * FROM movies WHERE id = ?").get(req.params.id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });
  const showtimes = db
    .prepare("SELECT * FROM showtimes WHERE movie_id = ? ORDER BY show_date, show_time")
    .all(movie.id);
  res.json({ ...movie, showtimes });
});

router.post("/", authRequired, adminOnly, (req, res) => {
  const { title, genre, duration_mins, description, poster_url } = req.body || {};
  if (!title || !genre || !duration_mins || !description) {
    return res.status(400).json({ error: "title, genre, duration_mins, description required" });
  }
  const result = db
    .prepare(
      "INSERT INTO movies (title, genre, duration_mins, description, poster_url) VALUES (?, ?, ?, ?, ?)"
    )
    .run(title, genre, Number(duration_mins), description, poster_url || null);
  res.status(201).json(db.prepare("SELECT * FROM movies WHERE id = ?").get(lastId(result)));
});

router.put("/:id", authRequired, adminOnly, (req, res) => {
  const existing = db.prepare("SELECT * FROM movies WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Movie not found" });
  const title = req.body.title ?? existing.title;
  const genre = req.body.genre ?? existing.genre;
  const duration_mins = Number(req.body.duration_mins ?? existing.duration_mins);
  const description = req.body.description ?? existing.description;
  const poster_url = req.body.poster_url ?? existing.poster_url;
  db.prepare(
    "UPDATE movies SET title=?, genre=?, duration_mins=?, description=?, poster_url=? WHERE id=?"
  ).run(title, genre, duration_mins, description, poster_url, req.params.id);
  res.json(db.prepare("SELECT * FROM movies WHERE id = ?").get(req.params.id));
});

router.delete("/:id", authRequired, adminOnly, (req, res) => {
  const info = db.prepare("DELETE FROM movies WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Movie not found" });
  res.json({ ok: true });
});

export default router;
