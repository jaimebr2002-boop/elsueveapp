import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// GHL envía distintos payloads según el evento.
// Mapeamos los campos más comunes del appointment webhook.
function parseGhlPayload(body: Record<string, unknown>) {
  // Campos del appointment booking de GHL
  const contact = (body.contact as Record<string, unknown>) ?? {};
  const appointment = (body.appointment as Record<string, unknown>) ?? body;

  const nombre =
    (contact.full_name as string) ??
    (contact.name as string) ??
    ((contact.first_name ?? "") + " " + (contact.last_name ?? "")).trim() ??
    "Sin nombre";

  const tel =
    (contact.phone as string) ??
    (contact.phoneRaw as string) ??
    null;

  const email = (contact.email as string) ?? null;

  // Fecha y hora del appointment
  const startTime =
    (appointment.startTime as string) ??
    (appointment.start_time as string) ??
    null;

  let fecha: string | null = null;
  let hora: string | null = null;

  if (startTime) {
    const d = new Date(startTime);
    fecha = d.toISOString().split("T")[0]; // YYYY-MM-DD
    hora = d.toTimeString().slice(0, 5);   // HH:MM
  }

  const pax = (body.guests as number) ?? (body.pax as number) ?? null;
  const obs = (appointment.notes as string) ?? (body.notes as string) ?? null;
  const ghl_id =
    (appointment.id as string) ??
    (body.id as string) ??
    (body.appointmentId as string) ??
    null;

  return { nombre, tel, email, fecha, hora, pax, obs, ghl_id };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificación básica: rechazamos payloads vacíos
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Solo procesamos eventos de cita creada/actualizada
    const eventType = (body.type as string) ?? (body.event as string) ?? "";
    const isAppointmentEvent =
      eventType === "" || // sin tipo = asumir appointment
      eventType.toLowerCase().includes("appointment") ||
      eventType.toLowerCase().includes("booking");

    if (!isAppointmentEvent) {
      return NextResponse.json({ skipped: true, event: eventType });
    }

    const reserva = parseGhlPayload(body);
    const db = createServiceClient();

    // Upsert: si ya existe una reserva con este ghl_id la actualizamos
    const { error } = await db.from("reservas").upsert(
      {
        ...reserva,
        estado: "Confirmada",
        source: "ghl",
        updated_at: new Date().toISOString(),
      },
      { onConflict: reserva.ghl_id ? "ghl_id" : undefined }
    );

    if (error) {
      console.error("[GHL webhook] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[GHL webhook] Reserva guardada:", reserva.nombre, reserva.fecha);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[GHL webhook] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GHL a veces hace un GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ status: "El Sueve webhook active" });
}
