import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function seatId(row, col) {
  return `${String.fromCharCode(65 + row)}${col + 1}`;
}

export default function BookShow() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api(`/api/showtimes/${showtimeId}`).then(setShow).catch((e) => setError(e.message));
  }, [showtimeId]);

  const taken = useMemo(() => new Set(show?.booked_seats || []), [show]);

  function toggle(id) {
    if (taken.has(id)) return;
    setPicked((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function book() {
    setError("");
    try {
      await api("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ showtime_id: Number(showtimeId), seats: picked }),
      });
      setMsg("Booked. Redirecting…");
      setTimeout(() => navigate("/bookings"), 600);
    } catch (e) {
      setError(e.message);
    }
  }

  if (error && !show) return <p className="page alert">{error}</p>;
  if (!show) return <p className="page">Loading…</p>;

  const rows = [];
  for (let r = 0; r < show.rows; r++) {
    const cells = [];
    for (let c = 0; c < show.seats_per_row; c++) {
      const id = seatId(r, c);
      const isTaken = taken.has(id);
      const isPicked = picked.includes(id);
      cells.push(
        <button
          key={id}
          className={`seat ${isTaken ? "taken" : ""} ${isPicked ? "picked" : ""}`}
          disabled={isTaken}
          onClick={() => toggle(id)}
        >
          {c + 1}
        </button>
      );
    }
    rows.push(
      <div className="seat-row" key={r}>
        <span>{String.fromCharCode(65 + r)}</span>
        {cells}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="hero">
        <h1>{show.movie_title}</h1>
        <p>
          {show.hall} · {show.show_date} {show.show_time} · ₹{show.price}/seat
        </p>
      </div>
      <div className="screen">SCREEN</div>
      <div className="seat-map">{rows}</div>
      <p>Selected: {picked.join(", ") || "none"} · Total ₹{picked.length * show.price}</p>
      {error && <p className="alert">{error}</p>}
      {msg && <p className="ok">{msg}</p>}
      <button className="btn" disabled={!picked.length} onClick={book}>
        Confirm booking
      </button>
    </div>
  );
}
