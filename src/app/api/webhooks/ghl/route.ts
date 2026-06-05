import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-04-15";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── GHL API helpers ──────────────────────────────────────────────────────────

async function ghlGet(path: string) {
  const key = process.env.GHL_API_KEY;
  if (!key) throw new Error("GHL_API_KEY not configured");

  const res = await fetch(`${GHL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Version: GHL_API_VERSION,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL API ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

async function getAppointment(appointmentId: string) {
  const data = await ghlGet(`/calendars/events/appointments/${appointmentId}`);
  // GHL puede devolver { appointment: {...} } o directamente el objeto
  return data.appointment ?? data;
}

async function getContact(contactId: string) {
  const data = await ghlGet(`/contacts/${contactId}`);
  return data.contact ?? data;
}

// Extrae pax de campos custom (array de {key, value} o {id, key, value})
function extractCustomField(fields: unknown[], key: string): string | null {
  if (!Array.isArray(fields)) return null;
  const f = fields.find((f: unknown) => {
    const obj = f as Record<string, unknown>;
    return obj.key === key || obj.fieldKey === key;
  }) as Record<string, unknown> | undefined;
  return f ? String(f.value ?? "") : null;
}

function safeNum(val: unknown): number | null {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s || s === "null" || s === "undefined" || s.includes("{{")) return null;
  const n = parseInt(s, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

function parseDate(startTime: string): { fecha: string | null; hora: string | null } {
  if (!startTime || startTime.includes("{{")) return { fecha: null, hora: null };
  const d = new Date(startTime);
  if (isNaN(d.getTime())) return { fecha: null, hora: null };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hora:  `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

// ── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const webhookContact     = (body.contact     as Record<string, unknown>) ?? {};
    const webhookAppointment = (body.appointment as Record<string, unknown>) ?? {};

    const appointmentId = (webhookAppointment.id as string) ?? null;
    const contactId     = (webhookContact.id     as string) ?? null;

    // Datos base del webhook (siempre disponibles)
    const fullName = (String(webhookContact.first_name ?? "") + " " + String(webhookContact.last_name ?? "")).trim();
    const nombre = (webhookContact.name as string) ?? (fullName || "Sin nombre");
    const tel   = (webhookContact.phone as string) ?? null;
    const email = (webhookContact.email as string) ?? null;
    const ghl_id = appointmentId ?? contactId ?? null;

    const startTimeRaw = (webhookAppointment.startTime as string) ??
                         (webhookAppointment.start_time as string) ?? "";
    const { fecha, hora } = parseDate(startTimeRaw);

    // Intentar leer pax del webhook primero (rápido, sin API call)
    let pax = safeNum(webhookAppointment.guests) ??
              safeNum(webhookContact.pax) ??
              null;

    // Si no hay pax, consultar la API de GHL para obtener los datos completos
    if (pax === null && (appointmentId || contactId)) {
      try {
        if (appointmentId) {
          const appt = await getAppointment(appointmentId);
          console.log("[GHL API] appointment keys:", Object.keys(appt ?? {}).join(", "));

          // Intentar extraer pax del appointment
          const apptFields = (appt.customField ?? appt.customFields ?? []) as unknown[];
          const apptPaxStr = extractCustomField(apptFields, "numero_de_personas");
          pax = safeNum(appt.guests) ??
                safeNum(appt.num_guests) ??
                safeNum(appt.numGuests) ??
                safeNum(apptPaxStr);
        }

        // Si aún no tenemos pax, intentar desde el contacto
        if (pax === null && contactId) {
          const contact = await getContact(contactId);
          const ctFields = (contact.customField ?? contact.customFields ?? []) as unknown[];
          console.log("[GHL API] contact customFields:", JSON.stringify(ctFields).slice(0, 300));
          pax = safeNum(extractCustomField(ctFields, "numero_de_personas"));
        }
      } catch (apiErr) {
        console.error("[GHL API] Error:", String(apiErr));
        // Continuamos sin pax — mejor guardar sin pax que no guardar
      }
    }

    console.log("[GHL webhook] nombre:", nombre, "| fecha:", fecha, "| pax:", pax);

    const db = getDb();

    // Upsert por ghl_id
    if (ghl_id) {
      const { data: existing } = await db
        .from("reservas")
        .select("id")
        .eq("ghl_id", ghl_id)
        .maybeSingle();

      if (existing) {
        await db.from("reservas")
          .update({ nombre, tel, email, fecha, hora, pax, obs: null, updated_at: new Date().toISOString() })
          .eq("ghl_id", ghl_id);
        return NextResponse.json({ ok: true, action: "updated", pax });
      }
    }

    const { error } = await db.from("reservas").insert({
      nombre, tel, email, fecha, hora, pax, obs: null,
      ghl_id, estado: "Confirmada", source: "ghl",
    });

    if (error) {
      console.error("[GHL webhook] Supabase error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: "inserted", pax });

  } catch (err) {
    console.error("[GHL webhook] Unexpected:", String(err));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "El Sueve webhook active" });
}
