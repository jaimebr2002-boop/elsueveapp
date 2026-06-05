"use client";

import { useState } from "react";

const platos = [
  { id: 1, cat: "Entrantes", nombre: "Croquetas caseras de jamón ibérico", precio: 12, desc: "8 uds · Bechamel cremosa · Jamón D.O. Teruel", estado: "Disponible", emoji: "🥘" },
  { id: 2, cat: "Entrantes", nombre: "Ensalada de burrata con tomate rosa", precio: 14, desc: "Burrata italiana · Tomate valenciano · Albahaca · AOVE", estado: "Disponible", emoji: "🫙" },
  { id: 3, cat: "Entrantes", nombre: "Pulpo a la gallega", precio: 22, desc: "Pulpo O Grove · Pimentón dulce · Cachelos", estado: "Agotado", emoji: "🐙" },
  { id: 7, cat: "Pescados y Mariscos", nombre: "Lubina a la sal", precio: 28, desc: "Lubina 800g-1kg · Sal Cádiz · Guarnición estacional", estado: "Stock bajo", emoji: "🐟" },
  { id: 8, cat: "Pescados y Mariscos", nombre: "Arroz caldoso de bogavante", precio: 32, desc: "Bogavante · Caldo de pescado · Azafrán — Para 2 personas", estado: "Disponible", emoji: "🦞" },
  { id: 10, cat: "Carnes", nombre: "Chuletón de vaca gallega", precio: 48, desc: "Madurado 45 días · Raza rubia gallega — precio por kg", estado: "Disponible", emoji: "🥩" },
  { id: 11, cat: "Carnes", nombre: "Secreto ibérico", precio: 19, desc: "Cerdo ibérico · Pimientos de padrón", estado: "Disponible", emoji: "🍖" },
  { id: 13, cat: "Postres", nombre: "Tarta de queso casera", precio: 7, desc: "Receta de la abuela · Base de galleta crujiente", estado: "Disponible", emoji: "🍰" },
  { id: 14, cat: "Postres", nombre: "Coulant de chocolate", precio: 8, desc: "Chocolate 70% · Helado de vainilla", estado: "Disponible", emoji: "🍫" },
];

const categorias = ["Entrantes", "Pescados y Mariscos", "Carnes", "Postres", "Bebidas"];

function estadoBadge(estado: string) {
  if (estado === "Disponible") return <span className="badge bg">Disponible</span>;
  if (estado === "Agotado") return <span className="badge bk">Agotado</span>;
  return <span className="badge bc">⚠️ Stock bajo</span>;
}

export default function CartaPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({ Entrantes: true });
  const [tab, setTab] = useState(0);

  const toggle = (cat: string) =>
    setOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const porCat = (cat: string) => platos.filter((p) => p.cat === cat);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="tabs">
        {["Editar carta", "Vista QR cliente", "Categorías y precios"].map((t, i) => (
          <button key={t} className={`tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-p btn-sm">+ Añadir plato</button>
          </div>
          {categorias.map((cat) => {
            const items = porCat(cat);
            return (
              <div key={cat} className="cat-block">
                <div className="cat-hdr" onClick={() => toggle(cat)}>
                  <span>
                    {cat}
                    <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 400, marginLeft: 8 }}>
                      {items.length} platos
                    </span>
                  </span>
                  <span className="chev" style={{ transform: open[cat] ? "rotate(180deg)" : "none" }}>▼</span>
                </div>
                {open[cat] && (
                  <div className="cat-body">
                    {items.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--text2)", padding: "12px 0" }}>Sin platos en esta categoría.</p>
                    ) : (
                      items.map((p) => (
                        <div key={p.id} className="dish">
                          <div className="dish-img">{p.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="dish-name">{p.nombre}</div>
                            <div className="dish-desc">{p.desc}</div>
                            <div style={{ marginTop: 5 }}>{estadoBadge(p.estado)}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                            <div className="dish-price">{p.precio} €</div>
                            <div className="tba">
                              <button className="ibt">✏️</button>
                              <button className="ibt red">🗑</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 1 && (
        <div className="g2" style={{ alignItems: "flex-start" }}>
          <div className="card cp">
            <div className="ct" style={{ marginBottom: 12 }}>Vista cliente · Mesa 7</div>
            <div className="mob-frame">
              <div style={{ textAlign: "center", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #e8dfd6" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: 14 }}>El Sueve</div>
                <div style={{ fontSize: 10, color: "var(--text2)" }}>Mesa 7</div>
              </div>
              <div className="mob-cats">
                {categorias.map((c) => (
                  <button key={c} className="pb" style={{ fontSize: 10, padding: "3px 9px" }}>{c}</button>
                ))}
              </div>
              {platos.slice(0, 4).map((p) => (
                <div key={p.id} className="mob-dish">
                  <span style={{ fontSize: 18 }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-playfair)", fontSize: 12, fontWeight: 600 }}>{p.nombre}</div>
                    <div style={{ fontSize: 10, color: "var(--warm)", fontWeight: 700 }}>{p.precio} €</div>
                  </div>
                </div>
              ))}
              <button className="btn btn-p" style={{ width: "100%", marginTop: 8, justifyContent: "center", fontSize: 12 }}>
                🔔 Llamar al camarero
              </button>
            </div>
          </div>
          <div className="card cp">
            <div className="ct" style={{ marginBottom: 12 }}>QR por mesa</div>
            <div className="qr-blk" style={{ margin: "0 auto 16px" }}>
              <div className="qr-box">⬛</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", textAlign: "center" }}>elsueve.es/carta?mesa=7</div>
            </div>
            <div className="tba" style={{ justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-g btn-sm">⬇ Descargar PNG</button>
              <button className="btn btn-p btn-sm">Exportar PDF — 22 QRs</button>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="card">
          <div className="cp">
            <div className="ct" style={{ marginBottom: 14 }}>Resumen por categoría</div>
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Activos</th>
                  <th>Agotados</th>
                  <th>Precio medio</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => {
                  const items = porCat(cat);
                  const activos = items.filter((p) => p.estado === "Disponible" || p.estado === "Stock bajo").length;
                  const agotados = items.filter((p) => p.estado === "Agotado").length;
                  const media = items.length > 0 ? (items.reduce((s, p) => s + p.precio, 0) / items.length).toFixed(2) : "—";
                  return (
                    <tr key={cat}>
                      <td style={{ fontWeight: 600 }}>{cat}</td>
                      <td><span className="badge bg">{activos}</span></td>
                      <td><span className="badge bk">{agotados}</span></td>
                      <td style={{ color: "var(--warm)", fontWeight: 700 }}>{media !== "—" ? `${media} €` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
