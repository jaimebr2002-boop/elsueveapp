"use client";

import { useState } from "react";

const facturas = [
  { id: 1, num: "2025-0480", fecha: "2025-05-16", tipo: "cliente", cliente: "Celebración Bautizo Gómez", concepto: "Evento 40 pax", base: 2100, iva: 210, total: 2310, estado: "Pagada", metodo: "Transferencia" },
  { id: 2, num: "2025-0481", fecha: "2025-05-17", tipo: "cliente", cliente: "López Ibáñez, Sofía", concepto: "Cena mesa 9 · 5 pax", base: 145, iva: 14.5, total: 159.5, estado: "Pagada", metodo: "Tarjeta" },
  { id: 3, num: "2025-0482", fecha: "2025-05-18", tipo: "proveedor", cliente: "Hortalizas Muñoz S.L.", concepto: "Compra semanal verduras", base: 87, iva: 9.14, total: 96.14, estado: "Pagada", metodo: "Transferencia" },
  { id: 4, num: "2025-0483", fecha: "2025-05-19", tipo: "cliente", cliente: "Rodríguez Vega, Miguel", concepto: "Comida mesa 15 · 3 pax", base: 74, iva: 7.4, total: 81.4, estado: "Pendiente", metodo: "Pendiente" },
  { id: 5, num: "2025-0484", fecha: "2025-05-20", tipo: "cliente", cliente: "Fernández Soto, Laura", concepto: "Cena mesa 3 · 6 pax", base: 186, iva: 18.6, total: 204.6, estado: "Pagada", metodo: "Tarjeta" },
  { id: 6, num: "2025-0485", fecha: "2025-05-20", tipo: "cliente", cliente: "Evento TechCorp", concepto: "Cena privada 25 pax", base: 1450, iva: 145, total: 1595, estado: "Pagada", metodo: "Transferencia" },
  { id: 7, num: "2025-0486", fecha: "2025-05-21", tipo: "cliente", cliente: "García Ruiz, Carlos", concepto: "Comida mesa 12 · 2 pax", base: 58, iva: 5.8, total: 63.8, estado: "Pagada", metodo: "Efectivo" },
  { id: 8, num: "2025-0487", fecha: "2025-05-21", tipo: "cliente", cliente: "Martínez López, Ana", concepto: "Comida mesa 7 · 4 pax", base: 112, iva: 11.2, total: 123.2, estado: "Pagada", metodo: "Tarjeta" },
];

export default function FacturacionPage() {
  const [tab, setTab] = useState(0);
  const [estadoFiltro, setEstadoFiltro] = useState("Todas");
  const [estados, setEstados] = useState<Record<number, string>>(
    Object.fromEntries(facturas.map((f) => [f.id, f.estado]))
  );

  const filtradas = facturas.filter(
    (f) => estadoFiltro === "Todas" || estados[f.id] === estadoFiltro
  );

  const totalBase = facturas.reduce((s, f) => s + f.base, 0);
  const totalIva = facturas.reduce((s, f) => s + f.iva, 0);
  const totalTotal = facturas.reduce((s, f) => s + f.total, 0);
  const cobrado = facturas.filter((f) => estados[f.id] === "Pagada").reduce((s, f) => s + f.total, 0);
  const pendiente = facturas.filter((f) => estados[f.id] === "Pendiente").reduce((s, f) => s + f.total, 0);

  const toggleEstado = (id: number) =>
    setEstados((prev) => ({ ...prev, [id]: prev[id] === "Pagada" ? "Pendiente" : "Pagada" }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="tabs">
        {["Facturas emitidas", "Informes"].map((t, i) => (
          <button key={t} className={`tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          {/* Summary bar */}
          <div className="fsum">
            <div className="fsi">
              <div className="fsl">Base total</div>
              <div className="fsv">{totalBase.toLocaleString("es-ES")} €</div>
            </div>
            <div className="fsi">
              <div className="fsl">IVA</div>
              <div className="fsv">{totalIva.toFixed(2)} €</div>
            </div>
            <div className="fsi">
              <div className="fsl">Total periodo</div>
              <div className="fsv">{totalTotal.toLocaleString("es-ES")} €</div>
            </div>
            <div className="fsi">
              <div className="fsl">Cobrado</div>
              <div className="fsv" style={{ color: "var(--olive)" }}>{cobrado.toLocaleString("es-ES")} €</div>
            </div>
            <div className="fsi">
              <div className="fsl">Pendiente</div>
              <div className="fsv" style={{ color: "var(--coral)" }}>{pendiente.toLocaleString("es-ES")} €</div>
            </div>
          </div>

          <div className="frow" style={{ marginBottom: 12 }}>
            <select className="fi" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option>Todas</option>
              <option>Pagadas</option>
              <option>Pendientes</option>
            </select>
            <button className="btn btn-p btn-sm" style={{ marginLeft: "auto" }}>+ Nueva factura</button>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Nº Factura</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Concepto</th>
                  <th>Base</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700, color: "var(--warm)" }}>{f.num}</td>
                    <td style={{ fontSize: 12 }}>{f.fecha}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{f.cliente}</span>
                        <span className={`badge ${f.tipo === "cliente" ? "bg" : "bw"}`} style={{ marginTop: 2, width: "fit-content" }}>
                          {f.tipo}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text2)" }}>{f.concepto}</td>
                    <td>{f.base.toFixed(2)} €</td>
                    <td>{f.iva.toFixed(2)} €</td>
                    <td style={{ fontWeight: 700 }}>{f.total.toFixed(2)} €</td>
                    <td>
                      <span className={`badge ${estados[f.id] === "Pagada" ? "bg" : "by"}`}>
                        {estados[f.id]}
                      </span>
                    </td>
                    <td>
                      <div className="tba">
                        <button className="ibt">PDF</button>
                        <button className="ibt" onClick={() => toggleEstado(f.id)}>
                          {estados[f.id] === "Pagada" ? "Pend." : "Pagar"}
                        </button>
                        {f.tipo === "cliente" && <button className="ibt">✉️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="mg">
            <div className="mc">
              <div className="ml">Ingresos totales</div>
              <div className="mv" style={{ color: "var(--olive)" }}>18.450 €</div>
              <div className="ms">Facturas cliente mayo</div>
            </div>
            <div className="mc">
              <div className="ml">Gastos proveedores</div>
              <div className="mv" style={{ color: "var(--coral)" }}>6.720 €</div>
              <div className="ms">Facturas proveedor mayo</div>
            </div>
            <div className="mc">
              <div className="ml">Beneficio neto</div>
              <div className="mv">11.730 €</div>
              <div className="ms">↑ 8% vs mes anterior</div>
            </div>
            <div className="mc">
              <div className="ml">Ticket medio</div>
              <div className="mv">42,50 €</div>
              <div className="ms">Por comensal</div>
            </div>
          </div>

          <div className="g2">
            <div className="card cp">
              <div className="ct" style={{ marginBottom: 12 }}>Ingresos vs Gastos</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
                {[
                  { mes: "Ene", ing: 15200, gas: 5800 },
                  { mes: "Feb", ing: 14800, gas: 6100 },
                  { mes: "Mar", ing: 16500, gas: 6400 },
                  { mes: "Abr", ing: 17200, gas: 6200 },
                  { mes: "May", ing: 18450, gas: 6720 },
                ].map((d) => (
                  <div key={d.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end" }}>
                      <div style={{ flex: 1, height: `${(d.ing / 20000) * 120}px`, background: "var(--olive)", borderRadius: "3px 3px 0 0" }} />
                      <div style={{ flex: 1, height: `${(d.gas / 20000) * 120}px`, background: "var(--coral)", borderRadius: "3px 3px 0 0" }} />
                    </div>
                    <span style={{ fontSize: 9, color: "var(--text2)" }}>{d.mes}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                  <div style={{ width: 10, height: 10, background: "var(--olive)", borderRadius: 2 }} />
                  Ingresos
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                  <div style={{ width: 10, height: 10, background: "var(--coral)", borderRadius: 2 }} />
                  Gastos
                </div>
              </div>
            </div>

            <div className="card cp">
              <div className="ct" style={{ marginBottom: 12 }}>Top 5 platos</div>
              <table>
                <thead>
                  <tr>
                    <th>Plato</th>
                    <th>Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nombre: "Chuletón de vaca gallega", pedidos: 48 },
                    { nombre: "Arroz caldoso de bogavante", pedidos: 41 },
                    { nombre: "Tarta de queso casera", pedidos: 87 },
                    { nombre: "Croquetas caseras", pedidos: 103 },
                    { nombre: "Gambas al ajillo", pedidos: 76 },
                  ].map((p, i) => (
                    <tr key={i}>
                      <td>{p.nombre}</td>
                      <td style={{ fontWeight: 700, color: "var(--warm)" }}>{p.pedidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
