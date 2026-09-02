import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/movies").then(setMovies).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <div className="hero">
        <h1>Now showing</h1>
        <p>Pick a film, choose a show, book seats.</p>
      </div>
      {error && <p className="alert">{error}</p>}
      <div className="grid">
        {movies.map((m) => (
          <Link key={m.id} to={`/movies/${m.id}`} className="card">
            <img src={m.poster_url} alt="" />
            <div className="body">
              <h3>{m.title}</h3>
              <div className="meta">
                {m.genre} · {m.duration_mins} min
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
