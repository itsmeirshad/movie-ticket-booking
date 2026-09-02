import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import showtimeRoutes from "./routes/showtimes.js";
import bookingRoutes from "./routes/bookings.js";
import "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "movie-ticket-booking-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
