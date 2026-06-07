"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "📊", label: "Dashboard", href: "/dashboard" },
  { icon: "📅", label: "Reservas",  href: "/reservas" },
  { icon: "🍽️", label: "Carta",     href: "/carta" },
  { icon: "📦", label: "Stock",     href: "/stock" },
  { icon: "🧾", label: "Facturas",  href: "/facturacion" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="name" style={{ fontSize: 13, letterSpacing: "-.2px" }}>El Sueve</div>
        </div>

        <nav className="sb-nav">
          {navItems.map(({ icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className={`sb-item${isActive(href) ? " active" : ""}`}
            >
              <span className="sb-ic">{icon}</span>
              <span className="sb-lbl">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="role-dot" />
        </div>
      </aside>

      <nav className="bnav">
        {navItems.map(({ icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={`bnav-item${isActive(href) ? " active" : ""}`}
          >
            <span className="bnav-ic">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
