import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Usa service_role si está disponible, si no anon (ambas tienen INSERT abierto vía RLS)
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function parseGhlPayload(body: Record<string, unknown>) {
  const contact = (body.contact as Record<string, unknown>) ?? {};
  const appointment = (body.appointment as Record<string, unknown>) ?? {};

  const nombre =
    (contact.name as string) ??
    (contact.full_name as string) ??
    ((String(contact.first_name ?? "") + " " + String(contact.last_name ?? "")).trim() || "Sin nombre");

  const tel   = (contact.phone as string) ?? null;
  const email = (contact.email as string) ?? null;

  const startTime =
    (appointment.startTime as string) ??
    (appointment.start_time as string) ??
    null;

  let fecha: string | null = null;
  let hora: string | null  = null;

  if (startTime) {
    const d = new Date(startTime);
    if (!isNaN(d.getTime())) {
      fecha = d.toISOString().split("T")[0];
      hora  = d.toTimeString().slice(0, 5);
    }
  }

  const obs = (appointment.notes as string) ?? null;
  const ghl_id = (appointment.id as string) ?? (contact.id as string) ?? null;

  // Número de personas — varios formatos posibles según versión de GHL
  const customField = (contact.customField as Record<string, unknown>) ?? {};
  const customFields = (contact.customFields as Record<string, unknown>) ??
                       (contact.custom_fields as Record<string, unknown>) ?? {};

  const paxRaw =
    contact.pax ??                              // "pax": "{{contact.numero_de_personas}}"
    contact.numero_de_personas ??               // directo sin alias
    customField.numero_de_personas ??           // "{{contact.customField.numero_de_personas}}"
    customFields.numero_de_personas ??          // variante snake_case
    appointment.guests ??                        // campo nativo GHL
    null;

  // Descartar si GHL envió la plantilla sin resolver
  const paxStr = paxRaw != null ? String(paxRaw) : "";
  const pax = paxStr && !paxStr.includes("{{")
    ? parseInt(paxStr, 10) || null
    : null;

  return { nombre, tel, email, fecha, hora, obs, ghl_id, pax };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Log de campos clave para diagnóstico
    const contact = (body.contact as Record<string, unknown>) ?? {};
    console.log("[GHL contact keys]", Object.keys(contact).join(", "));
    console.log("[GHL contact.pax]", contact.pax);
    console.log("[GHL contact.numero_de_personas]", contact.numero_de_personas);
    console.log("[GHL contact.customField]", JSON.stringify(contact).slice(0, 300));

    const reserva = parseGhlPayload(body);
    console.log("[GHL parsed] pax:", reserva.pax, "| nombre:", reserva.nombre);
    const db = getDb();

    // Si ya existe una reserva con el mismo ghl_id, la actualizamos
    if (reserva.ghl_id) {
      const { data: existing } = await db
        .from("reservas")
        .select("id")
        .eq("ghl_id", reserva.ghl_id)
        .maybeSingle();

      if (existing) {
        await db
          .from("reservas")
          .update({ ...reserva, updated_at: new Date().toISOString() })
          .eq("ghl_id", reserva.ghl_id);

        console.log("[GHL webhook] Reserva actualizada:", reserva.nombre);
        return NextResponse.json({ ok: true, action: "updated" });
      }
    }

    // Insert nueva reserva
    const { error } = await db.from("reservas").insert({
      ...reserva,
      estado: "Confirmada",
      source: "ghl",
    });

    if (error) {
      console.error("[GHL webhook] Supabase error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[GHL webhook] Reserva guardada:", reserva.nombre, reserva.fecha);
    return NextResponse.json({ ok: true, action: "inserted" });

  } catch (err) {
    console.error("[GHL webhook] Unexpected error:", String(err));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GHL hace un GET para verificar el endpoint al guardar el workflow
export async function GET() {
  return NextResponse.json({ status: "El Sueve webhook active" });
}
