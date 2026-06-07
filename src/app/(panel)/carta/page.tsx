"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, type Plato } from "@/lib/supabase";

const CATEGORIAS = ["Entrantes", "Pescados y Mariscos", "Carnes", "Postres", "Bebidas"];

type FormData = {
  cat: string;
  nombre: string;
  precio: string;
  desc_: string;
  estado: Plato["estado"];
  imagen_url: string;
};

async function subirImagen(file: File, platoId: string): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${platoId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("platos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from("platos").getPublicUrl(path);
  return data.publicUrl;
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "Disponible") return <span className="badge bg">Disponible</span>;
  if (estado === "Agotado")    return <span className="badge bk">Agotado</span>;
  return <span className="badge bc">⚠ Stock bajo</span>;
}

export default function CartaPage() {
  const [platos,    setPlatos]    = useState<Plato[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState<Record<string, boolean>>({ Entrantes: true });
  const [tab,       setTab]       = useState(0);
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState<Plato | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form,      setForm]      = useState<FormData>({
    cat: "Entrantes", nombre: "", precio: "", desc_: "", estado: "Disponible", imagen_url: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platos")
      .select("*")
      .order("cat")
      .order("orden")
      .order("created_at");
    if (data) setPlatos(data as Plato[]);
    if (error) console.error(error);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ cat: "Entrantes", nombre: "", precio: "", desc_: "", estado: "Disponible", imagen_url: "" });
    setModal(true);
  };

  const abrirEditar = (p: Plato) => {
    setEditando(p);
    setForm({
      cat: p.cat, nombre: p.nombre, precio: String(p.precio),
      desc_: p.desc_ ?? "", estado: p.estado, imagen_url: p.imagen_url ?? "",
    });
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const id = editando?.id ?? crypto.randomUUID();
    const url = await subirImagen(file, id);
    if (url) setForm(f => ({ ...f, imagen_url: url }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.precio) return;
    setSaving(true);
    const payload = {
      cat:        form.cat,
      nombre:     form.nombre.trim(),
      precio:     parseFloat(form.precio),
      desc_:      form.desc_.trim() || null,
      estado:     form.estado,
      imagen_url: form.imagen_url || null,
      updated_at: new Date().toISOString(),
    };
    if (editando) {
      await supabase.from("platos").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("platos").insert(payload);
    }
    await cargar();
    setSaving(false);
    cerrar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este plato? No se puede deshacer.")) return;
    await supabase.from("platos").delete().eq("id", id);
    cargar();
  };

  const toggleEstado = async (p: Plato) => {
    const sig: Record<string, Plato["estado"]> = {
      Disponible: "Agotado", Agotado: "Disponible", "Stock bajo": "Disponible",
    };
    await supabase.from("platos")
      .update({ estado: sig[p.estado], updated_at: new Date().toISOString() })
      .eq("id", p.id);
    cargar();
  };

  const toggle  = (cat: string) => setOpen(prev => ({ ...prev, [cat]: !prev[cat] }));
  const porCat  = (cat: string) => platos.filter(p => p.cat === cat);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="tabs">
        {["Editar carta", "Vista QR cliente", "Resumen"].map((t, i) => (
          <button key={t} className={`tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* ── Editar carta ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-p btn-sm" onClick={abrirNuevo}>+ Añadir plato</button>
          </div>

          {loading ? (
            <div className="card cp" style={{ textAlign: "center", fontSize: 13, color: "var(--text2)" }}>
              Cargando carta...
            </div>
          ) : (
            CATEGORIAS.map(cat => {
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
                        <p style={{ fontSize: 12, color: "var(--text2)", padding: "12px 0" }}>
                          Sin platos en esta categoría.
                        </p>
                      ) : (
                        items.map(p => (
                          <div key={p.id} className="dish">
                            {/* Foto */}
                            <div className="dish-img" onClick={() => abrirEditar(p)} title="Editar plato">
                              {p.imagen_url
                                ? <img src={p.imagen_url} alt={p.nombre} />
                                : <span style={{ fontSize: 20, opacity: .5 }}>📷</span>
                              }
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="dish-name">{p.nombre}</div>
                              {p.desc_ && <div className="dish-desc">{p.desc_}</div>}
                              <div style={{ marginTop: 5 }}>
                                <EstadoBadge estado={p.estado} />
                              </div>
                            </div>
                            {/* Acciones */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                              <div className="dish-price">{p.precio.toFixed(2)} €</div>
                              <div className="tba">
                                <button
                                  className="ibt"
                                  title={p.estado === "Disponible" ? "Marcar agotado" : "Marcar disponible"}
                                  onClick={() => toggleEstado(p)}
                                >
                                  {p.estado === "Disponible" ? "✓" : "✗"}
                                </button>
                                <button className="ibt" onClick={() => abrirEditar(p)}>✏️</button>
                                <button className="ibt red" onClick={() => eliminar(p.id)}>🗑</button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Vista QR ── */}
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
                {CATEGORIAS.map(c => (
                  <button key={c} className="pb" style={{ fontSize: 10, padding: "3px 9px" }}>{c}</button>
                ))}
              </div>
              {platos.slice(0, 4).map(p => (
                <div key={p.id} className="mob-dish">
                  {p.imagen_url
                    ? <img src={p.imagen_url} alt={p.nombre} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                    : <span style={{ fontSize: 18 }}>🍽️</span>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-playfair)", fontSize: 12, fontWeight: 600 }}>{p.nombre}</div>
                    <div style={{ fontSize: 10, color: "var(--warm)", fontWeight: 700 }}>{p.precio.toFixed(2)} €</div>
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

      {/* ── Resumen ── */}
      {tab === 2 && (
        <div className="card">
          <div className="cp">
            <div className="ct" style={{ marginBottom: 14 }}>Resumen por categoría</div>
            <div className="tbl-x">
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
                  {CATEGORIAS.map(cat => {
                    const items = porCat(cat);
                    const activos  = items.filter(p => p.estado !== "Agotado").length;
                    const agotados = items.filter(p => p.estado === "Agotado").length;
                    const media    = items.length > 0
                      ? (items.reduce((s, p) => s + p.precio, 0) / items.length).toFixed(2)
                      : "—";
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
        </div>
      )}

      {/* ── Modal añadir / editar ── */}
      {modal && (
        <div className="mo open" onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
          <div className="modal">
            <div className="modal-title">{editando ? "Editar plato" : "Añadir plato"}</div>

            {/* Foto */}
            <div className="fg">
              <label>Foto del plato</label>
              <div
                className={`img-upload${form.imagen_url ? " has-img" : ""}`}
                style={{ marginTop: 4 }}
                onClick={() => !uploading && fileRef.current?.click()}
              >
                {uploading ? (
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>Subiendo imagen...</span>
                ) : form.imagen_url ? (
                  <>
                    <img src={form.imagen_url} alt="preview" />
                    <div className="img-overlay">📷 Cambiar foto</div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>Haz clic para añadir foto</span>
                    <span style={{ fontSize: 10, color: "var(--text2)", opacity: .7 }}>JPG, PNG, WEBP</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            </div>

            {/* Categoría y estado */}
            <div className="fr" style={{ marginBottom: 0 }}>
              <div className="fg">
                <label>Categoría</label>
                <select className="fi" value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Estado</label>
                <select className="fi" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as Plato["estado"] }))}>
                  <option>Disponible</option>
                  <option>Agotado</option>
                  <option>Stock bajo</option>
                </select>
              </div>
            </div>

            <div className="fg">
              <label>Nombre del plato *</label>
              <input
                className="fi" type="text"
                placeholder="Ej: Croquetas caseras de jamón ibérico"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div className="fg">
              <label>Descripción</label>
              <input
                className="fi" type="text"
                placeholder="Ingredientes, uds, notas..."
                value={form.desc_}
                onChange={e => setForm(f => ({ ...f, desc_: e.target.value }))}
              />
            </div>

            <div className="fg">
              <label>Precio (€) *</label>
              <input
                className="fi" type="number" step="0.01" min="0"
                placeholder="12.50"
                value={form.precio}
                onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                style={{ maxWidth: 130 }}
              />
            </div>

            <div className="fa">
              <button className="btn btn-g btn-sm" onClick={cerrar}>Cancelar</button>
              <button
                className="btn btn-p btn-sm"
                onClick={guardar}
                disabled={saving || uploading || !form.nombre.trim() || !form.precio}
              >
                {saving ? "Guardando..." : editando ? "Guardar cambios" : "Añadir plato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
