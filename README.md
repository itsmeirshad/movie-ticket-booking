# CineDesk — Movie Ticket Booking

Three separate pieces, connected over HTTP:

| Piece | Tech | Folder | Port |
| --- | --- | --- | --- |
| Frontend | React + Vite | `frontend/` | 5173 |
| Backend | Node.js + Express | `backend/` | 4000 |
| Database | SQLite file `cinema.db` (Node built-in `node:sqlite`) | created inside `backend/` | — |

The Vite dev server **proxies** `/api` to `http://localhost:4000`, so the browser talks to the same origin and CORS still works if you hit the API directly.

## Run (two terminals)

```bash
cd backend
npm install
npm start
```

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### Demo logins (seeded on first API start)

- Admin: `admin@cinema.com` / `admin123`
- User: `user@cinema.com` / `user123`

## What to demo in 5 minutes

1. Login as **user** → Movies → Book seats → My bookings → Cancel.
2. Login as **admin** → Admin panel → Create/Edit/Delete a movie and a showtime → see all bookings.

## How it is connected (say this to HR)

1. React UI calls REST endpoints like `POST /api/bookings`.
2. Express routes validate input, check JWT, then run SQL against SQLite (`node:sqlite`).
3. SQLite stores users, movies, showtimes, bookings. Foreign keys keep related rows consistent (deleting a movie also deletes its showtimes).
4. Role is on the user row (`user` vs `admin`). JWT payload carries `id` and `role`. Middleware `authRequired` + `adminOnly` guards write APIs.

## CRUD map

| Resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Movies | Admin POST | Anyone GET | Admin PUT | Admin DELETE |
| Showtimes | Admin POST | Anyone GET | Admin PUT | Admin DELETE |
| Bookings | Logged-in user POST | Own list / admin all | Cancel or change seats | Admin DELETE |
| Users | Register | `/api/auth/me` | — | — |

Seat conflict: confirmed bookings store seat codes (`A1`, `B4`). A new booking is rejected with 409 if a seat is already taken.

## Honest limits (if they ask)

- JWT secret is a demo default — production would use env vars and HTTPS.
- No payment gateway — amount is calculated as seats × price.
- SQLite is one file, fine for a local demo; production would use PostgreSQL/MySQL and connection pooling.
- Double-booking under heavy concurrency would need a DB transaction / unique constraint on (showtime, seat). This demo checks in application code.

## API cheat sheet

- `POST /api/auth/register` `{ name, email, password }`
- `POST /api/auth/login` `{ email, password }`
- `GET /api/movies` · `GET /api/movies/:id`
- `POST/PUT/DELETE /api/movies` (admin JWT)
- `GET /api/showtimes` · `GET /api/showtimes/:id` (includes `booked_seats`)
- `POST /api/bookings` `{ showtime_id, seats: ["A1","A2"] }`
- `PUT /api/bookings/:id` `{ status: "cancelled" }`
