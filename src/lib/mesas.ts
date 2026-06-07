export type Mesa = {
  id: number;
  nombre: string;
  cap: number;
};

export const MESAS: Mesa[] = [
  { id: 1,  nombre: "Mesa 1",  cap: 2  },
  { id: 2,  nombre: "Mesa 2",  cap: 2  },
  { id: 3,  nombre: "Mesa 3",  cap: 4  },
  { id: 4,  nombre: "Mesa 4",  cap: 4  },
  { id: 5,  nombre: "Mesa 5",  cap: 4  },
  { id: 6,  nombre: "Mesa 6",  cap: 4  },
  { id: 7,  nombre: "Mesa 7",  cap: 6  },
  { id: 8,  nombre: "Mesa 8",  cap: 6  },
  { id: 9,  nombre: "Mesa 9",  cap: 6  },
  { id: 10, nombre: "Mesa 10", cap: 8  },
  { id: 11, nombre: "Mesa 11", cap: 8  },
  { id: 12, nombre: "Mesa 12", cap: 12 },
];

// Total simultaneous capacity
export const CAPACIDAD_TOTAL = MESAS.reduce((s, m) => s + m.cap, 0); // 66

export function getMesa(id: number | null | undefined): Mesa | undefined {
  if (id == null) return undefined;
  return MESAS.find(m => m.id === id);
}

// Two reservations conflict if they share the same date and are within 2 hours of each other
export function horasConflictan(hora1: string | null, hora2: string | null): boolean {
  if (!hora1 || !hora2) return true;
  const toMin = (h: string) => { const [hh, mm] = h.split(":").map(Number); return hh * 60 + mm; };
  return Math.abs(toMin(hora1) - toMin(hora2)) < 120;
}

// Returns the ID of the smallest mesa that fits `pax` and is not in `ocupadas`
export function asignarMesa(pax: number, ocupadas: Set<number>): number | null {
  const candidatos = MESAS
    .filter(m => m.cap >= pax && !ocupadas.has(m.id))
    .sort((a, b) => a.cap - b.cap);
  return candidatos[0]?.id ?? null;
}
