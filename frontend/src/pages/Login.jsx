import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@cinema.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      login(data);
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <h1>Login</h1>
        <p>Demo admin: admin@cinema.com / admin123 · user: user@cinema.com / user123</p>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <p className="alert">{error}</p>}
        <button className="btn" type="submit">
          Sign in
        </button>
        <p className="meta">
          New here? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
