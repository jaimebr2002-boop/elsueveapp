import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente público (browser / Server Components sin privilegios elevados)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con service_role para API routes (bypasa RLS)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    // Fallback al anon key si aún no está configurado
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return createClient(supabaseUrl, serviceKey);
}

export type Plato = {
  id: string;
  cat: string;
  nombre: string;
  precio: number;
  desc_: string | null;
  estado: "Disponible" | "Agotado" | "Stock bajo";
  imagen_url: string | null;
  orden: number;
  created_at: string;
};

export type Reserva = {
  id: string;
  nombre: string;
  tel: string | null;
  email: string | null;
  fecha: string | null;
  hora: string | null;
  pax: number | null;
  mesa_id: number | null;
  estado: "Confirmada" | "Pendiente" | "Cancelada";
  obs: string | null;
  source: string;
  ghl_id: string | null;
  created_at: string;
};
