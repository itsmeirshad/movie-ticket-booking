import { Router } from "express";
import db, { lastId } from "../db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = Router();

function bookedSeatsFor(showtimeId) {
  const rows = db
    .prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND status = 'confirmed'")
    .all(showtimeId);
  return rows.flatMap((r) => JSON.parse(r.seats));
}

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*, m.title AS movie_title
       FROM showtimes s JOIN movies m ON m.id = s.movie_id
       ORDER BY s.show_date, s.show_time`
    )
    .all();
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const show = db
    .prepare(
      `SELECT s.*, m.title AS movie_title, m.genre, m.duration_mins
       FROM showtimes s JOIN movies m ON m.id = s.movie_id
       WHERE s.id = ?`
    )
    .get(req.params.id);
  if (!show) return res.status(404).json({ error: "Showtime not found" });
  res.json({ ...show, booked_seats: bookedSeatsFor(show.id) });
});

router.post("/", authRequired, adminOnly, (req, res) => {
  const { movie_id, hall, show_date, show_time, price, rows, seats_per_row } = req.body || {};
  if (!movie_id || !hall || !show_date || !show_time || price == null) {
    return res.status(400).json({ error: "movie_id, hall, show_date, show_time, price required" });
  }
  const movie = db.prepare("SELECT id FROM movies WHERE id = ?").get(movie_id);
  if (!movie) return res.status(400).json({ error: "Movie does not exist" });
  const result = db
    .prepare(
      "INSERT INTO showtimes (movie_id, hall, show_date, show_time, price, rows, seats_per_row) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      movie_id,
      hall,
      show_date,
      show_time,
      Number(price),
      Number(rows || 8),
      Number(seats_per_row || 10)
    );
  res.status(201).json(db.prepare("SELECT * FROM showtimes WHERE id = ?").get(lastId(result)));
});

router.put("/:id", authRequired, adminOnly, (req, res) => {
  const existing = db.prepare("SELECT * FROM showtimes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Showtime not found" });
  db.prepare(
    `UPDATE showtimes SET movie_id=?, hall=?, show_date=?, show_time=?, price=?, rows=?, seats_per_row=? WHERE id=?`
  ).run(
    req.body.movie_id ?? existing.movie_id,
    req.body.hall ?? existing.hall,
    req.body.show_date ?? existing.show_date,
    req.body.show_time ?? existing.show_time,
    Number(req.body.price ?? existing.price),
    Number(req.body.rows ?? existing.rows),
    Number(req.body.seats_per_row ?? existing.seats_per_row),
    req.params.id
  );
  res.json(db.prepare("SELECT * FROM showtimes WHERE id = ?").get(req.params.id));
});

router.delete("/:id", authRequired, adminOnly, (req, res) => {
  const info = db.prepare("DELETE FROM showtimes WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Showtime not found" });
  res.json({ ok: true });
});

export default router;
