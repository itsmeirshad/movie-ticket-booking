import { useEffect, useState } from "react";
import { api } from "../api.js";

const emptyMovie = { title: "", genre: "", duration_mins: 120, description: "", poster_url: "" };
const emptyShow = { movie_id: "", hall: "Hall A", show_date: "2026-09-07", show_time: "19:00", price: 250 };

export default function Admin() {
  const [tab, setTab] = useState("movies");
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [editingMovie, setEditingMovie] = useState(null);
  const [showForm, setShowForm] = useState(emptyShow);
  const [editingShow, setEditingShow] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [m, s, b] = await Promise.all([
        api("/api/movies"),
        api("/api/showtimes"),
        api("/api/bookings"),
      ]);
      setMovies(m);
      setShows(s);
      setBookings(b);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveMovie(e) {
    e.preventDefault();
    try {
      if (editingMovie) {
        await api(`/api/movies/${editingMovie}`, { method: "PUT", body: JSON.stringify(movieForm) });
      } else {
        await api("/api/movies", { method: "POST", body: JSON.stringify(movieForm) });
      }
      setMovieForm(emptyMovie);
      setEditingMovie(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveShow(e) {
    e.preventDefault();
    try {
      const payload = { ...showForm, movie_id: Number(showForm.movie_id), price: Number(showForm.price) };
      if (editingShow) {
        await api(`/api/showtimes/${editingShow}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/showtimes", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowForm(emptyShow);
      setEditingShow(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page admin-layout">
      <div className="hero">
        <h1>Admin panel</h1>
        <p>Full CRUD for movies and showtimes. Bookings can be listed, cancelled, or deleted.</p>
      </div>
      <div className="row-actions">
        <button className={`btn ${tab === "movies" ? "" : "secondary"}`} onClick={() => setTab("movies")}>
          Movies
        </button>
        <button className={`btn ${tab === "shows" ? "" : "secondary"}`} onClick={() => setTab("shows")}>
          Showtimes
        </button>
        <button className={`btn ${tab === "bookings" ? "" : "secondary"}`} onClick={() => setTab("bookings")}>
          Bookings
        </button>
      </div>
      {error && <p className="alert">{error}</p>}

      {tab === "movies" && (
        <>
          <form className="form wide" onSubmit={saveMovie}>
            <h2>{editingMovie ? "Edit movie" : "Add movie"}</h2>
            <label>
              Title
              <input value={movieForm.title} onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })} required />
            </label>
            <label>
              Genre
              <input value={movieForm.genre} onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })} required />
            </label>
            <label>
              Duration (mins)
              <input
                type="number"
                value={movieForm.duration_mins}
                onChange={(e) => setMovieForm({ ...movieForm, duration_mins: e.target.value })}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                required
              />
            </label>
            <label>
              Poster URL
              <input value={movieForm.poster_url} onChange={(e) => setMovieForm({ ...movieForm, poster_url: e.target.value })} />
            </label>
            <div className="row-actions">
              <button className="btn" type="submit">
                {editingMovie ? "Update" : "Create"}
              </button>
              {editingMovie && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setEditingMovie(null);
                    setMovieForm(emptyMovie);
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Mins</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m.id}>
                    <td>{m.title}</td>
                    <td>{m.genre}</td>
                    <td>{m.duration_mins}</td>
                    <td className="row-actions">
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setEditingMovie(m.id);
                          setMovieForm(m);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        onClick={async () => {
                          await api(`/api/movies/${m.id}`, { method: "DELETE" });
                          load();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "shows" && (
        <>
          <form className="form wide" onSubmit={saveShow}>
            <h2>{editingShow ? "Edit showtime" : "Add showtime"}</h2>
            <label>
              Movie
              <select
                value={showForm.movie_id}
                onChange={(e) => setShowForm({ ...showForm, movie_id: e.target.value })}
                required
              >
                <option value="">Select</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hall
              <input value={showForm.hall} onChange={(e) => setShowForm({ ...showForm, hall: e.target.value })} required />
            </label>
            <label>
              Date
              <input
                type="date"
                value={showForm.show_date}
                onChange={(e) => setShowForm({ ...showForm, show_date: e.target.value })}
                required
              />
            </label>
            <label>
              Time
              <input
                type="time"
                value={showForm.show_time}
                onChange={(e) => setShowForm({ ...showForm, show_time: e.target.value })}
                required
              />
            </label>
            <label>
              Price
              <input
                type="number"
                value={showForm.price}
                onChange={(e) => setShowForm({ ...showForm, price: e.target.value })}
                required
              />
            </label>
            <button className="btn" type="submit">
              {editingShow ? "Update" : "Create"}
            </button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Hall</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.movie_title}</td>
                    <td>{s.hall}</td>
                    <td>{s.show_date}</td>
                    <td>{s.show_time}</td>
                    <td>₹{s.price}</td>
                    <td className="row-actions">
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setEditingShow(s.id);
                          setShowForm({
                            movie_id: s.movie_id,
                            hall: s.hall,
                            show_date: s.show_date,
                            show_time: s.show_time,
                            price: s.price,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        onClick={async () => {
                          await api(`/api/showtimes/${s.id}`, { method: "DELETE" });
                          load();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "bookings" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Movie</th>
                <th>When</th>
                <th>Seats</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.user_name}
                    <br />
                    <span className="meta">{b.user_email}</span>
                  </td>
                  <td>{b.movie_title}</td>
                  <td>
                    {b.show_date} {b.show_time}
                  </td>
                  <td>{b.seats.join(", ")}</td>
                  <td>{b.status}</td>
                  <td className="row-actions">
                    {b.status === "confirmed" && (
                      <button
                        className="btn secondary"
                        onClick={async () => {
                          await api(`/api/bookings/${b.id}`, {
                            method: "PUT",
                            body: JSON.stringify({ status: "cancelled" }),
                          });
                          load();
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="btn danger"
                      onClick={async () => {
                        await api(`/api/bookings/${b.id}`, { method: "DELETE" });
                        load();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
