"use client";

import { useState } from "react";

const productos = [
  { id: 1, nombre: "Aceite oliva virgen extra", cat: "Secos", stock: 2.5, unidad: "Litros", umbral: 5 },
  { id: 2, nombre: "Lubina fresca", cat: "Frescos", stock: 3, unidad: "Kg", umbral: 8 },
  { id: 3, nombre: "Vino Albariño Pazo", cat: "Bebidas", stock: 4, unidad: "Botellas", umbral: 10 },
  { id: 4, nombre: "Harina de trigo", cat: "Secos", stock: 25, unidad: "Kg", umbral: 15 },
  { id: 5, nombre: "Tomate rosa", cat: "Frescos", stock: 12, unidad: "Kg", umbral: 8 },
  { id: 6, nombre: "Jamón ibérico bellota", cat: "Frescos", stock: 1.8, unidad: "Kg", umbral: 2 },
  { id: 7, nombre: "Queso manchego", cat: "Frescos", stock: 6, unidad: "Kg", umbral: 4 },
  { id: 8, nombre: "Detergente lavavajillas", cat: "Limpieza", stock: 8, unidad: "Litros", umbral: 5 },
  { id: 9, nombre: "Café en grano", cat: "Secos", stock: 4, unidad: "Kg", umbral: 3 },
  { id: 10, nombre: "Patatas", cat: "Frescos", stock: 45, unidad: "Kg", umbral: 20 },
];

function getEstado(stock: number, umbral: number) {
  if (stock <= 0) return "Crítico";
  const ratio = stock / umbral;
  if (stock < umbral && ratio < 0.5) return "Crítico";
  if (stock < umbral) return "Bajo";
  return "OK";
}

export default function StockPage() {
  const [tab, setTab] = useState(0);
  const [buscar, setBuscar] = useState("");
  const [catFiltro, setCatFiltro] = useState("Todas");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");

  const filtrados = productos.filter((p) => {
    const est = getEstado(p.stock, p.umbral);
    return (
      p.nombre.toLowerCase().includes(buscar.toLowerCase()) &&
      (catFiltro === "Todas" || p.cat === catFiltro) &&
      (estadoFiltro === "Todos" || est === estadoFiltro)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="tabs">
        {["Inventario", "Pedidos semanales", "Proveedores"].map((t, i) => (
          <button key={t} className={`tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div className="frow">
            <input
              className="fi"
              placeholder="Buscar producto..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              style={{ minWidth: 180 }}
            />
            <select className="fi" value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)}>
              <option>Todas</option>
              <option>Frescos</option>
              <option>Secos</option>
              <option>Bebidas</option>
              <option>Limpieza</option>
            </select>
            <select className="fi" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option>Todos</option>
              <option>OK</option>
              <option>Bajo</option>
              <option>Crítico</option>
            </select>
            <button className="btn btn-p btn-sm" style={{ marginLeft: "auto" }}>+ Añadir producto</button>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cat.</th>
                  <th>Stock</th>
                  <th>Umbral</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const est = getEstado(p.stock, p.umbral);
                  const ratio = Math.min(p.stock / p.umbral, 1);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                      <td><span className="badge bd">{p.cat}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{p.stock} {p.unidad}</span>
                          <div style={{ width: 50 }}>
                            <div className="pbar">
                              <div
                                className={`pf ${est === "OK" ? "pf-o" : est === "Bajo" ? "pf-w" : "pf-c"}`}
                                style={{ width: `${ratio * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{p.umbral} {p.unidad}</td>
                      <td>
                        <span className={`badge ${est === "OK" ? "bg" : est === "Bajo" ? "by" : "bc"}`}>
                          {est}
                        </span>
                      </td>
                      <td>
                        <div className="tba">
                          <button className="ibt">✏️ Editar</button>
                          <button className="ibt">+ Reponer</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-p btn-sm">+ Nuevo pedido programado</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { id: 1, nombre: "Pedido semanal verduras", prov: "Hortalizas Muñoz S.L.", freq: "Semanal (martes)", hora: "08:00", productos: "Tomate rosa 15kg, Lechuga 10 uds, Cebolla 8kg", total: 87, estado: "Activo" },
              { id: 2, nombre: "Pedido semanal pescado", prov: "Pescados Frescos del Mar S.A.", freq: "Lunes, Miércoles, Viernes", hora: "07:00", productos: "Lubina 10kg, Merluza 8kg, Dorada 6kg", total: 340, estado: "Activo" },
              { id: 3, nombre: "Pedido mensual limpieza", prov: "Suministros Hostelería Global", freq: "Mensual (1er lunes)", hora: "10:00", productos: "Detergente 20L, Lejía 10L, Bayetas 50u", total: 156, estado: "Activo" },
            ].map((ped) => (
              <div key={ped.id} className="ped">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: 14, color: "var(--dark)" }}>{ped.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{ped.prov}</div>
                  </div>
                  <span className="badge bg">{ped.estado}</span>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>🕐 {ped.freq} · {ped.hora}</span>
                  <span style={{ fontSize: 11, color: "var(--warm)", fontWeight: 700 }}>~{ped.total} €</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)" }}>{ped.productos}</div>
                <div className="tba" style={{ marginTop: 10 }}>
                  <button className="ibt">Pausar</button>
                  <button className="ibt">Enviar ahora</button>
                  <button className="ibt red">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="g2">
          {[
            { nombre: "Hortalizas Muñoz S.L.", cat: "Frescos — Verduras y Frutas", contacto: "José Muñoz", tel: "+34 618 234 567", email: "jose@hortalizasmunoz.es", stars: 4.5, nota: "Producto fresco, puntual", ultima: "87€" },
            { nombre: "Pescados Frescos del Mar S.A.", cat: "Frescos — Pescado y Marisco", contacto: "Laura Fernández", tel: "+34 625 876 432", email: "pedidos@pescadosdelmar.com", stars: 5, nota: "Calidad excepcional", ultima: "340€" },
            { nombre: "Carnes Selectas Ibérica", cat: "Frescos — Carnes", contacto: "Miguel Rodríguez", tel: "+34 610 345 678", email: "miguel@carnesselectas.es", stars: 4, nota: "Buena calidad", ultima: "520€" },
            { nombre: "Suministros Hostelería Global", cat: "Limpieza y Consumibles", contacto: "Dpto. Ventas", tel: "+34 917 654 321", email: "ventas@sumhostglobal.com", stars: 4, nota: "Buen servicio", ultima: "156€" },
          ].map((prov) => (
            <div key={prov.nombre} className="prov">
              <div className="prov-name">{prov.nombre}</div>
              <div className="prov-cat">{prov.cat}</div>
              <div className="prow">👤 {prov.contacto} · <a href={`tel:${prov.tel}`} style={{ color: "var(--warm)" }}>{prov.tel}</a></div>
              <div className="prow">✉️ {prov.email}</div>
              <div className="prow" style={{ marginTop: 6 }}>
                <span className="stars">{"★".repeat(Math.floor(prov.stars))}</span>
                <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 4 }}>{prov.nota}</span>
              </div>
              <div className="prow" style={{ fontSize: 11 }}>Última compra: <strong>{prov.ultima}</strong></div>
              <div className="tba" style={{ marginTop: 10 }}>
                <button className="ibt">✏️ Editar</button>
                <button className="ibt wa">WhatsApp</button>
                <button className="ibt">Historial</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
