"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/reservas": "Reservas & Mesas",
  "/carta": "Carta & Menú",
  "/stock": "Stock & Compras",
  "/facturacion": "Facturación",
};

export default function Topbar() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Panel";

  return (
    <header className="topbar">
      <span className="pg-title">{title}</span>
      <div className="tb-right">
        <div className="status-pill">
          <span className="sdot" />
          Restaurante abierto
        </div>
        <button className="btn btn-g btn-sm">⚙️ Config</button>
        <Link href="/reservas" className="btn btn-p btn-sm">
          + Nueva reserva
        </Link>
      </div>
    </header>
  );
}
