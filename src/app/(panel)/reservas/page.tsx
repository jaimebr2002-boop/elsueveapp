"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Reserva } from "@/lib/supabase";

const GHL_WIDGET_ID = "Hl5brk3tIbqlAJywDJUW";
const GHL_SCRIPT_SRC = "https://api.leadconnectorhq.com/js/form_embed.js";
const PAX_OPTS = [1,2,3,4,5,6,7,8,9,10];

export default function ReservasPage() {
  const [reservas, setReservas]     = useState<Reserva[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<"widget" | "lista">("widget");
  const [editingPax, setEditingPax] = useState<string | null>(null); // reserva.id en edición

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
    const channel = supabase
      .channel("reservas-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservas" }, () => cargarReservas())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cargarReservas]);

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

  const cambiarPax = async (id: string, pax: number) => {
    await supabase.from("reservas").update({ pax, updated_at: new Date().toISOString() }).eq("id", id);
    setEditingPax(null);
    cargarReservas();
  };

  const eliminarReserva = async (id: string) => {
    if (!confirm("¿Eliminar esta reserva? Esta acción no se puede deshacer.")) return;
    await supabase.from("reservas").delete().eq("id", id);
    cargarReservas();
  };

  const estadoBadge = (estado: string) => {
    if (estado === "Confirmada") return <span className="badge bg">Confirmada</span>;
    if (estado === "Pendiente")  return <span className="badge by">Pendiente</span>;
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
          📋 Reservas guardadas{reservas.length > 0 && <span className="badge bd" style={{ marginLeft: 6 }}>{reservas.length}</span>}
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

      {/* Lista */}
      {tab === "lista" && (
        <div className="card">
          {loading ? (
            <div className="cp" style={{ textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
              Cargando reservas...
            </div>
          ) : reservas.length === 0 ? (
            <div className="cp" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Aún no hay reservas guardadas.</div>
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
                    <th>Personas</th>
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
                        <div style={{ fontWeight: 500 }}>{r.nombre}</div>
                        {r.email && <div style={{ fontSize: 11, color: "var(--text2)" }}>{r.email}</div>}
                      </td>
                      <td>
                        {r.tel ? (
                          <button className="ibt wa" onClick={() => window.open(`https://wa.me/${r.tel!.replace(/\D/g, "")}`, "_blank")}>
                            {r.tel}
                          </button>
                        ) : "—"}
                      </td>

                      {/* PAX — click para editar */}
                      <td>
                        {editingPax === r.id ? (
                          <select
                            className="fi"
                            style={{ padding: "3px 6px", fontSize: 12, width: 70 }}
                            defaultValue={r.pax ?? ""}
                            autoFocus
                            onBlur={() => setEditingPax(null)}
                            onChange={(e) => cambiarPax(r.id, parseInt(e.target.value))}
                          >
                            <option value="" disabled>—</option>
                            {PAX_OPTS.map(n => (
                              <option key={n} value={n}>{n} pax</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            className="ibt"
                            style={{ minWidth: 52, textAlign: "center" }}
                            title="Haz clic para editar"
                            onClick={() => setEditingPax(r.id)}
                          >
                            {r.pax ? `${r.pax} pax` : "✎ —"}
                          </button>
                        )}
                      </td>

                      <td>{estadoBadge(r.estado)}</td>

                      {/* Acciones */}
                      <td>
                        <div className="tba">
                          {r.estado !== "Confirmada" && (
                            <button className="ibt" onClick={() => cambiarEstado(r.id, "Confirmada")}>✓ Confirmar</button>
                          )}
                          {r.estado !== "Cancelada" && (
                            <button className="ibt red" onClick={() => cambiarEstado(r.id, "Cancelada")}>Cancelar</button>
                          )}
                          {/* Papelera — siempre visible */}
                          <button
                            className="ibt red"
                            title="Eliminar reserva"
                            onClick={() => eliminarReserva(r.id)}
                            style={{ padding: "4px 7px" }}
                          >
                            🗑
                          </button>
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
