"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  {
    section: "Principal",
    items: [
      { icon: "📊", label: "Dashboard", href: "/dashboard" },
      { icon: "📅", label: "Reservas & Mesas", href: "/reservas" },
      { icon: "🍽️", label: "Carta & Menú", href: "/carta" },
    ],
  },
  {
    section: "Operaciones",
    items: [
      { icon: "📦", label: "Stock & Compras", href: "/stock" },
      { icon: "🧾", label: "Facturación", href: "/facturacion" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="name">El Sueve</div>
        <div className="sub">Panel de gestión</div>
      </div>

      {nav.map(({ section, items }) => (
        <div key={section}>
          <div className="sb-sec">{section}</div>
          {items.map(({ icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className={`sb-item${isActive(href) ? " active" : ""}`}
            >
              <span className="ic">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      ))}

      <div className="sb-footer">
        <div className="sb-role">
          <div className="role-dot" />
          <div>
            <div className="role-name">Administrador</div>
            <div className="role-sub">Vista completa</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
