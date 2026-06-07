"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Reserva } from "@/lib/supabase";
import { MESAS, getMesa, asignarMesa, horasConflictan } from "@/lib/mesas";

const WIDGET_ID  = "Hl5brk3tIbqlAJywDJUW";
const WIDGET_SRC = "https://api.leadconnectorhq.com/js/form_embed.js";
const PAX_OPTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const DIAS_CERRADO  = new Set([3]);
const DIAS_CON_CENA = new Set([1, 4, 5, 6]);

// ── Fila reutilizable ────────────────────────────────────────────────────────
function FilaReserva({ r, onEdit, onDelete, onCambiarEstado, onCambiarMesa }: {
  r: Reserva;
  onEdit: (id: string, pax: number) => void;
  onDelete: (id: string) => void;
  onCambiarEstado: (id: string, estado: Reserva["estado"]) => void;
  onCambiarMesa: (id: string, mesaId: number | null) => void;
}) {
  const [editingPax,  setEditingPax]  = useState(false);
  const [editingMesa, setEditingMesa] = useState(false);

  const mesa = getMesa(r.mesa_id);

  const estadoBadge = (estado: string) => {
    if (estado === "Confirmada") return <span className="badge bg">Confirmada</span>;
    if (estado === "Pendiente")  return <span className="badge by">Pendiente</span>;
    return <span className="badge bc">Cancelada</span>;
  };

  const zonaBadge = (zona: string) => {
    if (zona === "Terraza") return <span style={{ fontSize: 9, color: "var(--olive)", fontWeight: 600, marginLeft: 3 }}>T</span>;
    if (zona === "Privado") return <span style={{ fontSize: 9, color: "var(--warm)", fontWeight: 600, marginLeft: 3 }}>P</span>;
    return null;
  };

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{r.hora ?? "—"}</td>
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
      <td>
        {editingPax ? (
          <select
            className="fi"
            style={{ padding: "3px 6px", fontSize: 12, width: 70 }}
            defaultValue={r.pax ?? ""}
            autoFocus
            onBlur={() => setEditingPax(false)}
            onChange={(e) => { onEdit(r.id, parseInt(e.target.value)); setEditingPax(false); }}
          >
            <option value="" disabled>—</option>
            {PAX_OPTS.map(n => <option key={n} value={n}>{n} pers</option>)}
          </select>
        ) : (
          <button className="ibt" style={{ minWidth: 52, textAlign: "center" }} title="Haz clic para editar" onClick={() => setEditingPax(true)}>
            {r.pax ? `${r.pax} pers` : "✎ —"}
          </button>
        )}
      </td>
      <td>
        {editingMesa ? (
          <select
            className="fi"
            style={{ padding: "3px 6px", fontSize: 12, width: 140 }}
            defaultValue={r.mesa_id ?? ""}
            autoFocus
            onBlur={() => setEditingMesa(false)}
            onChange={(e) => {
              const val = e.target.value;
              onCambiarMesa(r.id, val ? parseInt(val) : null);
              setEditingMesa(false);
            }}
          >
            <option value="">Sin mesa</option>
            {MESAS.map(m => (
              <option key={m.id} value={m.id}>
                Mesa {m.id} — {m.cap} pax · {m.zona}
              </option>
            ))}
          </select>
        ) : (
          <button
            className="ibt"
            style={{ minWidth: 80, textAlign: "center" }}
            title="Haz clic para cambiar mesa"
            onClick={() => setEditingMesa(true)}
          >
            {mesa ? (
              <>Mesa {mesa.id}{zonaBadge(mesa.zona)}</>
            ) : (
              <span style={{ color: "var(--coral)" }}>✎ Asignar</span>
            )}
          </button>
        )}
      </td>
      <td>{estadoBadge(r.estado)}</td>
      <td>
        <div className="tba">
          {r.estado !== "Confirmada" && (
            <button className="ibt" onClick={() => onCambiarEstado(r.id, "Confirmada")}>✓ Confirmar</button>
          )}
          {r.estado !== "Cancelada" && (
            <button className="ibt red" onClick={() => onCambiarEstado(r.id, "Cancelada")}>Cancelar</button>
          )}
          <button className="ibt red" title="Eliminar" onClick={() => onDelete(r.id)} style={{ padding: "4px 7px" }}>🗑</button>
        </div>
      </td>
    </tr>
  );
}

// ── Calendario ──────────────────────────────────────────────────────────────
function CalendarioReservas({ reservas, onEdit, onDelete, onCambiarEstado, onCambiarMesa }: {
  reservas: Reserva[];
  onEdit: (id: string, pax: number) => void;
  onDelete: (id: string) => void;
  onCambiarEstado: (id: string, estado: Reserva["estado"]) => void;
  onCambiarMesa: (id: string, mesaId: number | null) => void;
}) {
  const hoy = new Date();
  const [year, setYear]           = useState(hoy.getFullYear());
  const [month, setMonth]         = useState(hoy.getMonth());
  const [diaActivo, setDiaActivo] = useState<string | null>(null);

  const prevMes = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMes = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const primerDia = new Date(year, month, 1);
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const offset = (primerDia.getDay() + 6) % 7;
  const celdas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const diaSemana = (dia: number) => new Date(year, month, dia).getDay();
  const esCerrado = (dia: number) => DIAS_CERRADO.has(diaSemana(dia));
  const tieneCena = (dia: number) => DIAS_CON_CENA.has(diaSemana(dia));

  const reservasPorDia = (dia: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return reservas.filter(r => r.fecha === key);
  };
  const diaKey = (dia: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const esHoy = (dia: number) =>
    dia === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();

  const reservasDiaActivo = diaActivo ? reservas.filter(r => r.fecha === diaActivo) : [];

  const TurnoTabla = ({ titulo, color, rs }: { titulo: string; color: string; rs: Reserva[] }) => (
    <div>
      <div style={{ padding: "8px 16px", background: color, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dark)" }}>{titulo}</span>
        <span className="badge bd">{rs.length} reserva{rs.length !== 1 ? "s" : ""}</span>
        <span style={{ fontSize: 11, color: "var(--text2)" }}>
          · {rs.reduce((s, r) => s + (r.pax ?? 0), 0)} personas
        </span>
      </div>
      {rs.length === 0 ? (
        <div style={{ padding: "10px 16px", fontSize: 12, color: "var(--text2)" }}>Sin reservas en este turno</div>
      ) : (
        <div className="tbl-x">
          <table>
            <thead>
              <tr>
                <th>Hora</th><th>Cliente</th><th>Tel.</th><th>Personas</th><th>Mesa</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rs.map(r => (
                <FilaReserva key={r.id} r={r} onEdit={onEdit} onDelete={onDelete} onCambiarEstado={onCambiarEstado} onCambiarMesa={onCambiarMesa} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="btn btn-g btn-sm" onClick={prevMes}>‹ Anterior</button>
        <span style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: 16, color: "var(--dark)" }}>
          {MESES[month]} {year}
        </span>
        <button className="btn btn-g btn-sm" onClick={nextMes}>Siguiente ›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DIAS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.6px", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`e-${i}`} />;
          const rs = reservasPorDia(dia);
          const key = diaKey(dia);
          const activo = diaActivo === key;
          const cerrado = esCerrado(dia);
          const confirmadas = rs.filter(r => r.estado === "Confirmada").length;
          const pendientes  = rs.filter(r => r.estado === "Pendiente").length;
          const canceladas  = rs.filter(r => r.estado === "Cancelada").length;

          return (
            <div
              key={key}
              onClick={() => setDiaActivo(activo ? null : key)}
              style={{
                minHeight: 64,
                border: `1.5px solid ${activo ? "var(--warm)" : esHoy(dia) ? "var(--olive)" : "var(--border)"}`,
                borderRadius: 8, padding: "6px 8px", cursor: "pointer",
                background: cerrado
                  ? "repeating-linear-gradient(135deg,#f5f1ee 0px,#f5f1ee 4px,#ede8e4 4px,#ede8e4 8px)"
                  : activo ? "rgba(200,149,110,0.08)" : esHoy(dia) ? "rgba(107,124,89,0.05)" : "var(--card)",
                opacity: cerrado ? 0.7 : 1, transition: "all 140ms",
              }}
            >
              <div style={{ fontWeight: esHoy(dia) ? 700 : 500, fontSize: 13, color: cerrado ? "var(--text2)" : esHoy(dia) ? "var(--olive)" : "var(--dark)", marginBottom: 4 }}>
                {dia}
              </div>
              {cerrado ? (
                <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Cerrado</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {confirmadas > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: "var(--olive)", background: "rgba(107,124,89,0.1)", borderRadius: 4, padding: "1px 5px" }}>✓ {confirmadas}</div>}
                  {pendientes > 0  && <div style={{ fontSize: 10, fontWeight: 600, color: "#B8860B", background: "#FFF8E1", borderRadius: 4, padding: "1px 5px" }}>● {pendientes}</div>}
                  {canceladas > 0  && <div style={{ fontSize: 10, fontWeight: 600, color: "var(--coral)", background: "rgba(217,119,87,0.1)", borderRadius: 4, padding: "1px 5px" }}>✕ {canceladas}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {diaActivo && (() => {
        const [dyStr, dmStr, ddStr] = diaActivo.split("-");
        const diaNum = parseInt(ddStr);
        const cerradoHoy = esCerrado(diaNum);
        const cenaDia    = tieneCena(diaNum);
        const sorted     = [...reservasDiaActivo].sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
        const comida = sorted.filter(r => (r.hora ?? "") >= "12:00" && (r.hora ?? "") < "16:00");
        const cena   = sorted.filter(r => (r.hora ?? "") >= "20:00");
        const otros  = sorted.filter(r => !comida.includes(r) && !cena.includes(r));
        const nombreDia = new Date(parseInt(dyStr), parseInt(dmStr) - 1, diaNum)
          .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

        return (
          <div style={{ marginTop: 16, border: "1.5px solid var(--warm)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "rgba(200,149,110,0.08)", padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: 14, color: "var(--dark)", textTransform: "capitalize" }}>
                {nombreDia}
              </span>
              {!cerradoHoy && (
                <>
                  <span className="badge bw">{reservasDiaActivo.length} reservas</span>
                  <span className="badge bd">{reservasDiaActivo.reduce((s, r) => s + (r.pax ?? 0), 0)} personas</span>
                </>
              )}
            </div>
            {cerradoHoy ? (
              <div style={{ padding: "24px 16px", fontSize: 13, color: "var(--text2)", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
                Restaurante cerrado este día
              </div>
            ) : reservasDiaActivo.length === 0 ? (
              <div style={{ padding: "16px", fontSize: 13, color: "var(--text2)", textAlign: "center" }}>Sin reservas para este día</div>
            ) : (
              <>
                {otros.length > 0  && <TurnoTabla titulo="🕐 Otras horas"                    color="#fdfaf8"                  rs={otros} />}
                <TurnoTabla titulo="☀️ Turno comida  · 12:00 – 16:00" color="rgba(107,124,89,0.05)"  rs={comida} />
                {cenaDia           && <TurnoTabla titulo="🌙 Turno cena  · 20:00 – 24:00"    color="rgba(200,149,110,0.05)" rs={cena} />}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"nueva" | "lista">("nueva");
  const [vista, setVista]       = useState<"calendario" | "lista">("calendario");

  const cargarReservas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .order("fecha", { ascending: true })
      .limit(200);
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
    if (tab !== "nueva") return;
    const stale = document.querySelector(`script[src="${WIDGET_SRC}"]`);
    if (stale) stale.remove();
    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const s = document.querySelector(`script[src="${WIDGET_SRC}"]`);
      if (s) s.remove();
    };
  }, [tab]);

  // Devuelve qué mesas ya están ocupadas para una reserva concreta (excluyendo esa misma)
  const getOcupadas = (fecha: string, hora: string | null, excludeId: string): Set<number> =>
    new Set(
      reservas
        .filter(r =>
          r.id !== excludeId &&
          r.fecha === fecha &&
          r.estado !== "Cancelada" &&
          r.mesa_id !== null &&
          horasConflictan(r.hora, hora)
        )
        .map(r => r.mesa_id as number)
    );

  const cambiarEstado = async (id: string, estado: Reserva["estado"]) => {
    await supabase.from("reservas").update({ estado, updated_at: new Date().toISOString() }).eq("id", id);
    cargarReservas();
  };

  const cambiarPax = async (id: string, pax: number) => {
    const reserva = reservas.find(r => r.id === id);
    await supabase.from("reservas").update({ pax, updated_at: new Date().toISOString() }).eq("id", id);

    // Re-assign mesa when pax changes
    if (reserva?.fecha) {
      const ocupadas = getOcupadas(reserva.fecha, reserva.hora, id);
      const nuevaMesa = asignarMesa(pax, ocupadas);
      if (nuevaMesa) {
        await supabase.from("reservas").update({ mesa_id: nuevaMesa }).eq("id", id);
      }
    }
    cargarReservas();
  };

  const cambiarMesa = async (id: string, mesaId: number | null) => {
    await supabase.from("reservas").update({ mesa_id: mesaId, updated_at: new Date().toISOString() }).eq("id", id);
    cargarReservas();
  };

  const eliminarReserva = async (id: string) => {
    if (!confirm("¿Eliminar esta reserva? No se puede deshacer.")) return;
    await supabase.from("reservas").delete().eq("id", id);
    cargarReservas();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--dark)" }}>
              Reservas & Mesas
            </h1>
            <span className="badge bg">● Sistema conectado</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)" }}>Las reservas online se guardan automáticamente</p>
        </div>
        <button className="btn btn-g btn-sm" onClick={cargarReservas}>↻ Actualizar</button>
      </div>

      <div className="tabs">
        <button className={`tab${tab === "nueva" ? " active" : ""}`} onClick={() => setTab("nueva")}>
          📅 Nueva reserva
        </button>
        <button className={`tab${tab === "lista" ? " active" : ""}`} onClick={() => setTab("lista")}>
          📋 Reservas guardadas{reservas.length > 0 && <span className="badge bd" style={{ marginLeft: 6 }}>{reservas.length}</span>}
        </button>
      </div>

      {tab === "nueva" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <iframe
            id={WIDGET_ID}
            src={`https://api.leadconnectorhq.com/widget/booking/${WIDGET_ID}`}
            style={{ width: "100%", minHeight: 600, border: "none", overflow: "hidden", display: "block" }}
            scrolling="no"
            title="Nueva reserva — El Sueve"
          />
        </div>
      )}

      {tab === "lista" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button className={`btn btn-sm ${vista === "calendario" ? "btn-p" : "btn-g"}`} onClick={() => setVista("calendario")}>
              🗓 Calendario
            </button>
            <button className={`btn btn-sm ${vista === "lista" ? "btn-p" : "btn-g"}`} onClick={() => setVista("lista")}>
              ☰ Lista
            </button>
          </div>

          {loading ? (
            <div className="card cp" style={{ textAlign: "center", color: "var(--text2)", fontSize: 13 }}>Cargando reservas...</div>
          ) : (
            <>
              {vista === "calendario" && (
                <div className="card cp">
                  <CalendarioReservas
                    reservas={reservas}
                    onEdit={cambiarPax}
                    onDelete={eliminarReserva}
                    onCambiarEstado={cambiarEstado}
                    onCambiarMesa={cambiarMesa}
                  />
                </div>
              )}

              {vista === "lista" && (
                <div className="card">
                  {reservas.length === 0 ? (
                    <div className="cp" style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                      <div style={{ fontSize: 13, color: "var(--text2)" }}>Aún no hay reservas guardadas.</div>
                    </div>
                  ) : (
                    <div className="tbl-x">
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th><th>Hora</th><th>Cliente</th><th>Tel.</th><th>Personas</th><th>Mesa</th><th>Estado</th><th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservas.map(r => (
                            <FilaReserva
                              key={r.id}
                              r={r}
                              onEdit={cambiarPax}
                              onDelete={eliminarReserva}
                              onCambiarEstado={cambiarEstado}
                              onCambiarMesa={cambiarMesa}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
