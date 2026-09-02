import { NavLink, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Movies from "./pages/Movies.jsx";
import MovieDetail from "./pages/MovieDetail.jsx";
import BookShow from "./pages/BookShow.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Admin from "./pages/Admin.jsx";

function Private({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="page">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="page">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="nav">
        <NavLink to="/" className="brand">CINEDESK</NavLink>
        <div className="nav-links">
          <NavLink to="/">Movies</NavLink>
          {user && <NavLink to="/bookings">My bookings</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          {!user && <NavLink to="/login">Login</NavLink>}
          {!user && <NavLink to="/register">Register</NavLink>}
          {user && (
            <button
              className="btn secondary"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout ({user.name})
            </button>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/book/:showtimeId" element={<Private><BookShow /></Private>} />
        <Route path="/bookings" element={<Private><MyBookings /></Private>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
      </Routes>
    </>
  );
}
