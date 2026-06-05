"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Reserva } from "@/lib/supabase";

const GHL_WIDGET_ID = "Hl5brk3tIbqlAJywDJUW";
const GHL_SCRIPT_SRC = "https://api.leadconnectorhq.com/js/form_embed.js";

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"widget" | "lista">("widget");

  // Carga reservas desde Supabase
  const cargarReservas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setReservas(data as Reserva[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarReservas();

    // Realtime: escucha inserciones nuevas del webhook GHL
    const channel = supabase
      .channel("reservas-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas" },
        () => cargarReservas()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cargarReservas]);

  // Re-inyectar script GHL en cada visita al tab widget
  useEffect(() => {
    if (tab !== "widget") return;

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
  }, [tab]);

  const cambiarEstado = async (id: string, estado: Reserva["estado"]) => {
    await supabase.from("reservas").update({ estado, updated_at: new Date().toISOString() }).eq("id", id);
    cargarReservas();
  };

  const estadoBadge = (estado: string) => {
    if (estado === "Confirmada") return <span className="badge bg">Confirmada</span>;
    if (estado === "Pendiente") return <span className="badge by">Pendiente</span>;
    return <span className="badge bc">Cancelada</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--dark)" }}>
              Reservas & Mesas
            </h1>
            <span className="badge bg">● Sistema conectado</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)" }}>
            Las reservas de GoHighLevel se guardan automáticamente
          </p>
        </div>
        <button className="btn btn-g btn-sm" onClick={cargarReservas}>↻ Actualizar</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${tab === "widget" ? " active" : ""}`} onClick={() => setTab("widget")}>
          📅 Nueva reserva (GHL)
        </button>
        <button className={`tab${tab === "lista" ? " active" : ""}`} onClick={() => setTab("lista")}>
          📋 Reservas guardadas {reservas.length > 0 && <span className="badge bd" style={{ marginLeft: 6 }}>{reservas.length}</span>}
        </button>
      </div>

      {/* Widget GHL */}
      {tab === "widget" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <iframe
            id={GHL_WIDGET_ID}
            src={`https://api.leadconnectorhq.com/widget/booking/${GHL_WIDGET_ID}`}
            style={{ width: "100%", minHeight: 600, border: "none", overflow: "hidden", display: "block" }}
            scrolling="no"
            title="Reservas — El Sueve"
          />
        </div>
      )}

      {/* Lista de reservas */}
      {tab === "lista" && (
        <div className="card">
          {loading ? (
            <div className="cp" style={{ textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
              Cargando reservas...
            </div>
          ) : reservas.length === 0 ? (
            <div className="cp" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                Aún no hay reservas guardadas.
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                Las reservas aparecerán aquí automáticamente cuando lleguen desde GoHighLevel.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Tel.</th>
                    <th>Pax</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.fecha ?? "—"}</td>
                      <td>{r.hora ?? "—"}</td>
                      <td>
                        <div>{r.nombre}</div>
                        {r.email && <div style={{ fontSize: 11, color: "var(--text2)" }}>{r.email}</div>}
                      </td>
                      <td>
                        {r.tel ? (
                          <button
                            className="ibt wa"
                            onClick={() => window.open(`https://wa.me/${r.tel!.replace(/\D/g, "")}`, "_blank")}
                          >
                            {r.tel}
                          </button>
                        ) : "—"}
                      </td>
                      <td>{r.pax ?? "—"}</td>
                      <td>{estadoBadge(r.estado)}</td>
                      <td>
                        <div className="tba">
                          {r.estado !== "Confirmada" && (
                            <button className="ibt" onClick={() => cambiarEstado(r.id, "Confirmada")}>✓ Confirmar</button>
                          )}
                          {r.estado !== "Cancelada" && (
                            <button className="ibt red" onClick={() => cambiarEstado(r.id, "Cancelada")}>Cancelar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
