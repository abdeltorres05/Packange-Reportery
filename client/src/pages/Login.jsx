import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email.trim(), password);
      const target = location.state?.from?.pathname || "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-brand">
        <span className="brand-mark large">R</span>
        <h1>Reportería de Paquetería</h1>
        <p>
          Registra y consulta los reportes de bultos de tu agencia. Cada agencia
          administra su información de forma privada.
        </p>
        <ul>
          <li>Reportes por número de guía</li>
          <li>Estados e historial de cada bulto</li>
          <li>Evidencias fotográficas protegidas</li>
        </ul>
      </aside>

      <section className="login-panel">
        <form className="card login-form" onSubmit={handleSubmit}>
          <h2>Iniciar sesión</h2>
          <p className="muted">Accede con la cuenta de tu agencia.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="field">
            <span>Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="responsable@agencia.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Ingresando…" : "Entrar"}
          </button>

          <details className="demo-hint">
            <summary>Cuentas de demostración</summary>
            <p>
              Mary Autopart: <code>mary@maryautopart.test</code>
              <br />
              Rapid Multiservice: <code>rapid@rapidmultiservice.test</code>
              <br />
              Contraseña: <code>Agencia123!</code>
            </p>
          </details>
        </form>
      </section>
    </div>
  );
}
