import Script from "next/script";

export default function ReservasPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1
              style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--dark)",
              }}
            >
              Reservas online
            </h1>
            <span className="badge bg">● Sistema conectado</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)" }}>
            Gestión de reservas a través del sistema GoHighLevel
          </p>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <iframe
          id="Hl5brk3tIbqlAJywDJUW"
          src="https://api.leadconnectorhq.com/widget/booking/Hl5brk3tIbqlAJywDJUW"
          style={{
            width: "100%",
            border: "none",
            overflow: "hidden",
            display: "block",
          }}
          scrolling="no"
          title="Reservas — El Sueve"
        />
        {/* Script must follow the iframe — form_embed.js adjusts height via postMessage */}
        <Script
          src="https://api.leadconnectorhq.com/js/form_embed.js"
          strategy="afterInteractive"
        />
      </div>
    </div>
  );
}
