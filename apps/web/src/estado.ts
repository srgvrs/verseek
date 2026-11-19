import type { CandidatoAnalizado, Eleccion } from "@verseek/motor";
import { reubicarElecciones, type CambioLineas } from "./anclaje.js";

let eleccionesPorVerso = new Map<number, Eleccion[]>();

/**
 * §OVR-02: reubica las elecciones ancladas a líneas tras los cambios del
 * documento. Reemplaza el mapa interno por el resultado de
 * `reubicarElecciones`.
 */
export function aplicarCambios(cambios: readonly CambioLineas[]): void {
  eleccionesPorVerso = reubicarElecciones(eleccionesPorVerso, cambios);
}

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

/**
 * §OVR-06: alterna el override de acento de una sílaba concreta.
 * Si ya existe una elección `acento` para `(palabra, silaba)`, la elimina;
 * si no, la añade con `valor = tonicaActual ? "no-aplicar" : "aplicar"`.
 */
export function alternarAcento(
  versoId: number,
  palabra: number,
  silaba: number,
  tonicaActual: boolean,
): void {
  const previas = eleccionesPorVerso.get(versoId) ?? [];
  const existe = previas.some(
    (e) =>
      e.tipo === "acento" &&
      e.palabraA === palabra &&
      e.palabraB === palabra &&
      e.silaba === silaba,
  );
  if (existe) {
    const siguientes = previas.filter(
      (e) =>
        !(
          e.tipo === "acento" &&
          e.palabraA === palabra &&
          e.palabraB === palabra &&
          e.silaba === silaba
        ),
    );
    eleccionesPorVerso.set(versoId, siguientes);
    return;
  }
  const nueva: Eleccion = {
    tipo: "acento",
    palabraA: palabra,
    palabraB: palabra,
    silaba,
    valor: tonicaActual ? "no-aplicar" : "aplicar",
  };
  eleccionesPorVerso.set(versoId, [...previas, nueva]);
}
