import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/movies/${id}`).then(setMovie).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="page alert">{error}</p>;
  if (!movie) return <p className="page">Loading…</p>;

  return (
    <div className="page">
      <div className="hero">
        <h1>{movie.title}</h1>
        <p>
          {movie.genre} · {movie.duration_mins} min
        </p>
      </div>
      <p>{movie.description}</p>
      <h2>Showtimes</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Hall</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movie.showtimes.map((s) => (
              <tr key={s.id}>
                <td>{s.show_date}</td>
                <td>{s.show_time}</td>
                <td>{s.hall}</td>
                <td>₹{s.price}</td>
                <td>
                  <Link className="btn" to={`/book/${s.id}`}>
                    Book seats
                  </Link>
                </td>
              </tr>
            ))}
            {!movie.showtimes.length && (
              <tr>
                <td colSpan="5">No showtimes yet. Admin can add them.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
