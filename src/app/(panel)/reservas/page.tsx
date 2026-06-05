"use client";

import { useEffect } from "react";

const GHL_WIDGET_ID = "Hl5brk3tIbqlAJywDJUW";
const GHL_SCRIPT_SRC = "https://api.leadconnectorhq.com/js/form_embed.js";

export default function ReservasPage() {
  useEffect(() => {
    // Remove stale script so it re-executes fresh on every navigation to this page
    const stale = document.querySelector(`script[src="${GHL_SCRIPT_SRC}"]`);
    if (stale) stale.remove();

    const script = document.createElement("script");
    script.src = GHL_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const s = document.querySelector(`script[src="${GHL_SCRIPT_SRC}"]`);
      if (s) s.remove();
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

      <div className="card" style={{ overflow: "hidden" }}>
        <iframe
          id={GHL_WIDGET_ID}
          src={`https://api.leadconnectorhq.com/widget/booking/${GHL_WIDGET_ID}`}
          style={{
            width: "100%",
            minHeight: 600,
            border: "none",
            overflow: "hidden",
            display: "block",
          }}
          scrolling="no"
          title="Reservas — El Sueve"
        />
      </div>
    </div>
  );
}
