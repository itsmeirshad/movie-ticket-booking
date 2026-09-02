import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function MyBookings() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setRows(await api("/api/bookings"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    try {
      await api(`/api/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <h1>My bookings</h1>
        <p>Cancel a confirmed ticket to free those seats for others.</p>
      </div>
      {error && <p className="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Movie</th>
              <th>When</th>
              <th>Hall</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{b.movie_title}</td>
                <td>
                  {b.show_date} {b.show_time}
                </td>
                <td>{b.hall}</td>
                <td>{b.seats.join(", ")}</td>
                <td>₹{b.total_amount}</td>
                <td>
                  <span className={`badge ${b.status === "cancelled" ? "cancel" : ""}`}>{b.status}</span>
                </td>
                <td>
                  {b.status === "confirmed" && (
                    <button className="btn danger" onClick={() => cancel(b.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="7">No bookings yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
