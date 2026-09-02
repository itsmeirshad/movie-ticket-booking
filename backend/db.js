import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "cinema.db"));

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    duration_mins INTEGER NOT NULL,
    description TEXT NOT NULL,
    poster_url TEXT
  );

  CREATE TABLE IF NOT EXISTS showtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    hall TEXT NOT NULL,
    show_date TEXT NOT NULL,
    show_time TEXT NOT NULL,
    price REAL NOT NULL,
    rows INTEGER NOT NULL DEFAULT 8,
    seats_per_row INTEGER NOT NULL DEFAULT 10,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    showtime_id INTEGER NOT NULL,
    seats TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
  );
`);

function lastId(result) {
  return Number(result.lastInsertRowid);
}

function seed() {
  const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (userCount > 0) return;

  const hash = (plain) => bcrypt.hashSync(plain, 10);

  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
    "Admin",
    "admin@cinema.com",
    hash("admin123"),
    "admin"
  );
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
    "Demo User",
    "user@cinema.com",
    hash("user123"),
    "user"
  );

  const insertMovie = db.prepare(
    "INSERT INTO movies (title, genre, duration_mins, description, poster_url) VALUES (?, ?, ?, ?, ?)"
  );

  const m1 = lastId(
    insertMovie.run(
      "Neon Nights",
      "Thriller",
      128,
      "A detective chases a hacker through a rain-soaked city.",
      "https://picsum.photos/seed/neon/400/600"
    )
  );
  const m2 = lastId(
    insertMovie.run(
      "Orbit Love",
      "Romance",
      112,
      "Two astronauts fall in love on a long-haul mission.",
      "https://picsum.photos/seed/orbit/400/600"
    )
  );
  const m3 = lastId(
    insertMovie.run(
      "Last Frame",
      "Drama",
      141,
      "A retired cinematographer returns for one final shot.",
      "https://picsum.photos/seed/frame/400/600"
    )
  );

  const insertShow = db.prepare(
    "INSERT INTO showtimes (movie_id, hall, show_date, show_time, price) VALUES (?, ?, ?, ?, ?)"
  );
  insertShow.run(m1, "Hall A", "2026-09-05", "18:30", 250);
  insertShow.run(m1, "Hall A", "2026-09-05", "21:15", 280);
  insertShow.run(m2, "Hall B", "2026-09-05", "17:00", 220);
  insertShow.run(m2, "Hall B", "2026-09-06", "20:00", 240);
  insertShow.run(m3, "Hall C", "2026-09-06", "19:00", 260);

  console.log("Database seeded. Admin: admin@cinema.com / admin123 | User: user@cinema.com / user123");
}

seed();

export { lastId };
export default db;
