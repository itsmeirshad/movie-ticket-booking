import { Router } from "express";
import db, { lastId } from "../db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = Router();

function bookedSeatsFor(showtimeId, excludeBookingId = null) {
  let sql = "SELECT seats FROM bookings WHERE showtime_id = ? AND status = 'confirmed'";
  const params = [showtimeId];
  if (excludeBookingId) {
    sql += " AND id != ?";
    params.push(excludeBookingId);
  }
  return db
    .prepare(sql)
    .all(...params)
    .flatMap((r) => JSON.parse(r.seats));
}

function enrich(row) {
  return {
    ...row,
    seats: JSON.parse(row.seats),
  };
}

router.get("/", authRequired, (req, res) => {
  if (req.user.role === "admin") {
    const rows = db
      .prepare(
        `SELECT b.*, u.name AS user_name, u.email AS user_email, m.title AS movie_title,
                s.hall, s.show_date, s.show_time
         FROM bookings b
         JOIN users u ON u.id = b.user_id
         JOIN showtimes s ON s.id = b.showtime_id
         JOIN movies m ON m.id = s.movie_id
         ORDER BY b.id DESC`
      )
      .all();
    return res.json(rows.map(enrich));
  }
  const rows = db
    .prepare(
      `SELECT b.*, m.title AS movie_title, s.hall, s.show_date, s.show_time
       FROM bookings b
       JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id
       WHERE b.user_id = ?
       ORDER BY b.id DESC`
    )
    .all(req.user.id);
  res.json(rows.map(enrich));
});

router.post("/", authRequired, (req, res) => {
  const { showtime_id, seats } = req.body || {};
  if (!showtime_id || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: "showtime_id and seats[] required" });
  }
  const unique = [...new Set(seats)];
  const show = db.prepare("SELECT * FROM showtimes WHERE id = ?").get(showtime_id);
  if (!show) return res.status(404).json({ error: "Showtime not found" });

  const taken = new Set(bookedSeatsFor(showtime_id));
  const clash = unique.filter((s) => taken.has(s));
  if (clash.length) {
    return res.status(409).json({ error: `Seats already booked: ${clash.join(", ")}` });
  }

  const total_amount = unique.length * show.price;
  const result = db
    .prepare(
      "INSERT INTO bookings (user_id, showtime_id, seats, total_amount, status) VALUES (?, ?, ?, ?, 'confirmed')"
    )
    .run(req.user.id, showtime_id, JSON.stringify(unique), total_amount);
  const row = db
    .prepare(
      `SELECT b.*, m.title AS movie_title, s.hall, s.show_date, s.show_time
       FROM bookings b
       JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id
       WHERE b.id = ?`
    )
    .get(lastId(result));
  res.status(201).json(enrich(row));
});

router.put("/:id", authRequired, (req, res) => {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (req.user.role !== "admin" && booking.user_id !== req.user.id) {
    return res.status(403).json({ error: "Not your booking" });
  }

  const { seats, status } = req.body || {};
  let nextSeats = JSON.parse(booking.seats);
  let nextStatus = booking.status;

  if (status) {
    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    nextStatus = status;
  }

  if (seats) {
    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "seats must be a non-empty array" });
    }
    nextSeats = [...new Set(seats)];
    if (nextStatus === "confirmed") {
      const taken = new Set(bookedSeatsFor(booking.showtime_id, booking.id));
      const clash = nextSeats.filter((s) => taken.has(s));
      if (clash.length) {
        return res.status(409).json({ error: `Seats already booked: ${clash.join(", ")}` });
      }
    }
  }

  const show = db.prepare("SELECT price FROM showtimes WHERE id = ?").get(booking.showtime_id);
  const total_amount = nextStatus === "cancelled" ? 0 : nextSeats.length * show.price;
  db.prepare("UPDATE bookings SET seats=?, status=?, total_amount=? WHERE id=?").run(
    JSON.stringify(nextSeats),
    nextStatus,
    total_amount,
    booking.id
  );
  const row = db
    .prepare(
      `SELECT b.*, m.title AS movie_title, s.hall, s.show_date, s.show_time
       FROM bookings b
       JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id
       WHERE b.id = ?`
    )
    .get(booking.id);
  res.json(enrich(row));
});

router.delete("/:id", authRequired, adminOnly, (req, res) => {
  const info = db.prepare("DELETE FROM bookings WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Booking not found" });
  res.json({ ok: true });
});

export default router;
