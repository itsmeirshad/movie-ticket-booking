import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <h1>Create account</h1>
        <p>New accounts are regular users. Only seeded admin can open the admin panel.</p>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
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
          Register
        </button>
        <p className="meta">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
