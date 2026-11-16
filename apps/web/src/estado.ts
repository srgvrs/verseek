import type { CandidatoAnalizado, Eleccion } from "@verseek/motor";

const eleccionesPorVerso = new Map<number, Eleccion[]>();

/** Devuelve las elecciones acumuladas para un verso (copia defensiva). */
export function eleccionesDe(versoId: number): Eleccion[] {
  const actuales = eleccionesPorVerso.get(versoId);
  return actuales === undefined ? [] : [...actuales];
}

/**
 * Alterna el estado de un candidato para un verso, actualizando la lista
 * de elecciones según las reglas del motor:
 *  - sinalefa/hiato comparten frontera "A:B" (sin tipo).
 *  - sineresis/dieresis se identifican por "tipo:A:B".
 */
export function alternarCandidato(
  versoId: number,
  c: CandidatoAnalizado,
): void {
  const previas = eleccionesPorVerso.get(versoId) ?? [];
  let siguientes: Eleccion[];

  if (c.tipo === "sinalefa" || c.tipo === "hiato") {
    const sinalefaActiva = c.tipo === "sinalefa" ? c.activo : !c.activo;
    const nueva: Eleccion = sinalefaActiva
      ? {
          tipo: "hiato",
          palabraA: c.palabraA,
          palabraB: c.palabraB,
          valor: "aplicar",
        }
      : {
          tipo: "sinalefa",
          palabraA: c.palabraA,
          palabraB: c.palabraB,
          valor: "aplicar",
        };
    siguientes = previas.filter(
      (e) =>
        !(
          (e.tipo === "sinalefa" || e.tipo === "hiato") &&
          e.palabraA === c.palabraA &&
          e.palabraB === c.palabraB
        ),
    );
    siguientes.push(nueva);
  } else {
    const valor: Eleccion["valor"] = c.activo ? "no-aplicar" : "aplicar";
    const nueva: Eleccion = {
      tipo: c.tipo,
      palabraA: c.palabraA,
      palabraB: c.palabraB,
      valor,
    };
    siguientes = previas.filter(
      (e) =>
        !(
          e.tipo === c.tipo &&
          e.palabraA === c.palabraA &&
          e.palabraB === c.palabraB
        ),
    );
    siguientes.push(nueva);
  }

  eleccionesPorVerso.set(versoId, siguientes);
}
