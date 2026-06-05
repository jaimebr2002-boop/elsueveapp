export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Metric cards */}
      <div className="mg">
        <div className="mc">
          <div className="mic mi-o">🪑</div>
          <div className="ml">Aforo actual</div>
          <div className="mv">32 <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text2)" }}>/ 85</span></div>
          <div className="ms">38% de capacidad</div>
          <div className="pbar"><div className="pf pf-o" style={{ width: "38%" }} /></div>
        </div>
        <div className="mc">
          <div className="mic mi-w">📅</div>
          <div className="ml">Reservas hoy</div>
          <div className="mv">8</div>
          <div className="ms">6 confirmadas · 2 pendientes</div>
        </div>
        <div className="mc">
          <div className="mic mi-c">📦</div>
          <div className="ml">Stock crítico</div>
          <div className="mv" style={{ color: "var(--coral)" }}>3</div>
          <div className="ms"><span className="badge bc">⚠️ Reponer urgente</span></div>
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
          <div style={{ height: 160, display: "flex", alignItems: "flex-end", gap: 8 }}>
            {[45, 38, 52, 67, 89, 95, 78].map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: "100%",
                    height: `${(v / 100) * 130}px`,
                    background: "rgba(200,149,110,0.25)",
                    borderRadius: "4px 4px 0 0",
                    border: "1.5px solid var(--warm)",
                    borderBottom: "none",
                  }}
                />
                <span style={{ fontSize: 9, color: "var(--text2)" }}>
                  {["L","M","X","J","V","S","D"][i]}
                </span>
              </div>
            ))}
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

      {/* Reservas table */}
      <div className="card">
        <div className="cp" style={{ paddingBottom: 0 }}>
          <div className="ch">
            <span className="ct">Reservas de hoy</span>
            <button className="btn btn-g btn-sm">Ver todas →</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Mesa</th>
                <th>Cliente</th>
                <th>Pax</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[
                { hora: "13:00", mesa: 7, cliente: "García Ruiz, Carlos", pax: 4, estado: "Confirmada" },
                { hora: "13:30", mesa: 12, cliente: "López Ibáñez, Sofía", pax: 2, estado: "Confirmada" },
                { hora: "14:00", mesa: 3, cliente: "Martínez López, Ana", pax: 6, estado: "Pendiente" },
                { hora: "21:00", mesa: 9, cliente: "Rodríguez Vega, Miguel", pax: 3, estado: "Confirmada" },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r.hora}</td>
                  <td>Mesa {r.mesa}</td>
                  <td>{r.cliente}</td>
                  <td>{r.pax} pax</td>
                  <td>
                    <span className={`badge ${r.estado === "Confirmada" ? "bg" : "by"}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td>
                    <div className="tba">
                      <button className="ibt">✏️</button>
                      <button className="ibt wa">WhatsApp</button>
                      <button className="ibt red">Cancelar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
