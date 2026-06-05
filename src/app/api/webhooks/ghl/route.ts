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

  // Número de personas — campo custom {{contact.numero_de_personas}} mapeado como contact.pax en el body
  const paxRaw =
    contact.pax ??               // desde el body RAW del webhook
    contact.numero_de_personas ?? // alternativa directa
    appointment.guests ??          // fallback campo nativo GHL
    null;
  const pax = paxRaw !== null && paxRaw !== "" && paxRaw !== "0"
    ? parseInt(String(paxRaw), 10) || null
    : null;

  return { nombre, tel, email, fecha, hora, obs, ghl_id, pax };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const reserva = parseGhlPayload(body);
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
