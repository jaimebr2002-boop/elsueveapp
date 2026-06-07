import { createServiceClient } from "@/lib/supabase";
import type { Reserva } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const CAPACIDAD_TOTAL = 85;

async function eliminarReserva(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const sb = createServiceClient();
  await sb.from("reservas").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
  const sb = createServiceClient();
  const hoy = new Date().toISOString().split("T")[0];

  const { data } = await sb
    .from("reservas")
    .select("*")
    .eq("fecha", hoy)
    .neq("estado", "Cancelada")
    .order("hora");

  const reservas = (data ?? []) as Reserva[];

  const aforoOcupado  = reservas.reduce((s, r) => s + (r.pax ?? 0), 0);
  const pctAforo      = Math.min(Math.round((aforoOcupado / CAPACIDAD_TOTAL) * 100), 100);
  const confirmadas   = reservas.filter(r => r.estado === "Confirmada").length;
  const pendientes    = reservas.filter(r => r.estado === "Pendiente").length;

  const DIAS    = ["L", "M", "X", "J", "V", "S", "D"];
  const valores = [45, 38, 52, 67, 89, 95, 78];
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Hero banner */}
      <div
        className="card"
        style={{ background: "var(--dark)", position: "relative", overflow: "hidden", padding: "24px 28px" }}
      >
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)`,
          backgroundSize: "28px 28px",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "rgba(255,255,255,.4)", marginBottom: 6 }}>
            Restaurante El Sueve · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
            Buenas tardes, bienvenido 👋
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 2 }}>Estado</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(107,124,89,.25)", border: "1px solid rgba(107,124,89,.4)", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#8FCB7E" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8FCB7E" }} />
                Abierto · Servicio comida
              </span>
            </div>
            {reservas.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 2 }}>Próxima reserva</div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                  {reservas[0].hora} — {reservas[0].nombre} ({reservas[0].pax} pax)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mg">
        <div className="mc">
          <div className="mic mi-o">🪑</div>
          <div className="ml">Aforo actual</div>
          <div className="mv">
            {aforoOcupado} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text2)" }}>/ {CAPACIDAD_TOTAL}</span>
          </div>
          <div className="ms">{pctAforo}% de capacidad</div>
          <div className="pbar"><div className="pf pf-o" style={{ width: `${pctAforo}%` }} /></div>
        </div>
        <div className="mc">
          <div className="mic mi-w">📅</div>
          <div className="ml">Reservas hoy</div>
          <div className="mv">{reservas.length}</div>
          <div className="ms">{confirmadas} confirmadas · {pendientes} pendientes</div>
        </div>
        <div className="mc">
          <div className="mic mi-c">📦</div>
          <div className="ml">Stock crítico</div>
          <div className="mv" style={{ color: "var(--coral)" }}>3</div>
          <div className="ms"><span className="badge bc">⚠ Reponer urgente</span></div>
        </div>
        <div className="mc">
          <div className="mic mi-w">🧾</div>
          <div className="ml">Facturación mes</div>
          <div className="mv">4.125 €</div>
          <div className="ms">↑ 12% vs mes anterior</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="g2">
        <div className="card cp">
          <div className="ch">
            <span className="ct">Aforo semanal</span>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>Esta semana</span>
          </div>
          <div style={{ height: 148, display: "flex", alignItems: "flex-end", gap: 10, padding: "0 4px" }}>
            {valores.map((v, i) => {
              const isToday = i === todayIdx;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: "62%",
                    height: `${(v / 100) * 124}px`,
                    background: isToday ? "var(--warm)" : "var(--dark)",
                    borderRadius: "50px",
                    opacity: isToday ? 1 : 0.55,
                    transition: "height .25s",
                  }} />
                  <span style={{ fontSize: 9, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--dark)" : "var(--text2)" }}>
                    {DIAS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card cp">
          <div className="ch">
            <span className="ct">Alertas activas</span>
            <span className="badge bc">3</span>
          </div>
          <div className="al">
            <div className="ai crit">
              <div className="ad ac" />
              <div>
                <div className="at">Stock crítico: Aceite oliva virgen extra</div>
                <div className="as_">2.5L disponibles · umbral: 5L</div>
              </div>
            </div>
            <div className="ai crit">
              <div className="ad ac" />
              <div>
                <div className="at">Stock crítico: Lubina fresca</div>
                <div className="as_">3Kg disponibles · umbral: 8Kg</div>
              </div>
            </div>
            <div className="ai warn">
              <div className="ad aw" />
              <div>
                <div className="at">Pedido pendiente: Pescados Frescos del Mar</div>
                <div className="as_">Próximo envío programado: mañana 07:00</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservas de hoy */}
      <div className="card">
        <div className="cp" style={{ paddingBottom: 0 }}>
          <div className="ch">
            <span className="ct">Reservas de hoy</span>
            <a href="/reservas" className="btn btn-g btn-sm">Ver todas →</a>
          </div>
        </div>
        <div className="tbl-x">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Pax</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "28px 16px", color: "var(--text2)", fontSize: 13 }}>
                    Sin reservas para hoy
                  </td>
                </tr>
              ) : (
                reservas.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.hora ?? "—"}</td>
                    <td>{r.nombre}</td>
                    <td>{r.pax ?? "—"} pax</td>
                    <td>
                      <span className={`badge ${r.estado === "Confirmada" ? "bg" : r.estado === "Pendiente" ? "by" : "bc"}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <div className="tba">
                        {r.tel && (
                          <a
                            href={`https://wa.me/${r.tel.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ibt wa"
                          >
                            WhatsApp
                          </a>
                        )}
                        <form action={eliminarReserva} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className="ibt red">Eliminar</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
