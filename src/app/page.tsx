import Link from "next/link";
export default function Login() {
  return (
    <div className="login">
      <section className="login-art">
        <div className="brand">
          <span className="brandmark" />
          Livora
        </div>
        <div>
          <span className="eyebrow">Economía circular verificable</span>
          <h1>
            Trazabilidad que <em>transforma.</em>
          </h1>
          <p>
            Conectamos a recicladores, centros de acopio y empresas para
            convertir cada kilo recuperado en impacto ambiental demostrable.
          </p>
        </div>
        <small className="muted">
          Arbitrum Sepolia · IPFS · Datos verificables
        </small>
      </section>
      <section className="login-form">
        <div className="login-card">
          <span className="eyebrow">Demo interactiva</span>
          <h2 style={{ fontSize: 30, marginBottom: 8 }}>Bienvenido a Livora</h2>
          <p className="muted">Selecciona el espacio que deseas explorar.</p>
          <div className="role-grid">
            <Link className="card role selected" href="/admin">
              <strong>Livora</strong>
              <span>Operaciones, lotes y administración.</span>
            </Link>
            <Link className="card role" href="/company">
              <strong>Empresa B2B</strong>
              <span>Impacto ESG y certificados.</span>
            </Link>
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input value="demo@livora.pe" readOnly />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input value="livora-demo" type="password" readOnly />
          </div>
          <Link
            className="btn primary"
            style={{ display: "block", textAlign: "center" }}
            href="/admin"
          >
            Ingresar a la plataforma →
          </Link>
          <p
            className="muted"
            style={{ fontSize: 11, textAlign: "center", marginTop: 18 }}
          >
            Acceso de presentación · No requiere credenciales reales
          </p>
        </div>
      </section>
    </div>
  );
}
