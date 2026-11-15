/**
 * Análisis completo de un verso: escansión + cómputo + ritmo + candidatos
 * con su estado de activación (spike).
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada. El resultado es
 * serializable (sin `Map`/`Set`), de modo que `structuredClone(resultado)`
 * es igual al resultado.
 *
 * Contrato:
 *  - Verso sin palabras (vacío, sólo puntuación) → `palabras`, `silabas`,
 *    `candidatos`, `eleccionesAplicadas`, `eleccionesHuerfanas` vacíos y
 *    `computo`/`ritmo` en `null`.
 *  - `silabas[].inicio`/`fin` son offsets absolutos sobre el verso
 *    (`palabra.inicio + silaba.inicio`).
 *  - `silabas[].tonica` reutiliza `tonicasPorSilaba` de `ritmo.ts`, así que
 *    coincide siempre con `ritmo.posicionesTonicas`.
 *  - `candidatos[].activo`:
 *      · sinalefa → activa si su frontera está en `fronterasSinalefa`.
 *      · sinéresis / diéresis → activa si está en `eleccionesAplicadas`.
 *      · hiato → activa si su licencia complementaria NO está activa
 *        (entre palabras: no hay sinalefa activa en esa frontera; dentro
 *        de una palabra: no hay sinéresis aplicada en esa palabra).
 */

import type { Computo } from "./computo.js";
import { computar } from "./computo.js";
import {
  resolverEscansion,
  type Eleccion,
  type Escansion,
  type FronteraSinalefa,
} from "./escansion.js";
import {
  detectarCandidatos,
  type Candidato,
} from "./licencias.js";
import { palabrasConOffsets, type PalabraConOffsets } from "./palabras.js";
import { analizarRitmo, tonicasPorSilaba, type Ritmo } from "./ritmo.js";
import { silabear } from "./silabeo.js";

export interface SilabaAnalizada {
  /** Índice (0-based) de la palabra en `palabras[]`. */
  readonly palabra: number;
  /** Texto de la sílaba. */
  readonly texto: string;
  /** Offset absoluto de inicio sobre el verso. */
  readonly inicio: number;
  /** Offset absoluto de fin (exclusivo) sobre el verso. */
  readonly fin: number;
  /** ¿Es la sílaba tónica de su palabra? (coincide con `ritmo`). */
  readonly tonica: boolean;
}

export interface CandidatoAnalizado extends Candidato {
  /** ¿Está activa la licencia en esta escansión? */
  readonly activo: boolean;
}

export interface AnalisisVerso {
  readonly palabras: readonly PalabraConOffsets[];
  readonly silabas: readonly SilabaAnalizada[];
  readonly candidatos: readonly CandidatoAnalizado[];
  readonly eleccionesAplicadas: readonly Eleccion[];
  readonly eleccionesHuerfanas: readonly Eleccion[];
  readonly computo: Computo | null;
  readonly ritmo: Ritmo | null;
}

/** Clave de frontera entre palabras (para sinalefa/hiato). */
function claveFrontera(palabraA: number, palabraB: number): string {
  return `${palabraA}:${palabraB}`;
}

/** Clave de elección intra-palabra (tipo incluido). */
function claveIntra(tipo: string, palabra: number): string {
  return `${tipo}:${palabra}:${palabra}`;
}

/**
 * Decide si un candidato está activo en la escansión resuelta.
 *
 * - sinalefa: activa si su frontera está en `fronterasSinalefa`.
 * - sinéresis / diéresis: activa si está en `eleccionesAplicadas` con
 *   `valor === "aplicar"`.
 * - hiato: activa si su complemento NO está activo.
 *     · entre palabras: no hay sinalefa activa en esa frontera.
 *     · intra-palabra: no hay sinéresis aplicada en esa palabra.
 */
function estaActivo(
  c: Candidato,
  fronterasSinalefa: ReadonlySet<string>,
  eleccionesAplicadas: ReadonlySet<string>,
): boolean {
  if (c.tipo === "sinalefa") {
    return fronterasSinalefa.has(claveFrontera(c.palabraA, c.palabraB));
  }
  if (c.tipo === "sineresis" || c.tipo === "dieresis") {
    return eleccionesAplicadas.has(claveIntra(c.tipo, c.palabraA));
  }
  // hiato
  if (c.palabraA === c.palabraB) {
    // Intra-palabra: activo si no hay sinéresis aplicada en esa palabra.
    return !eleccionesAplicadas.has(claveIntra("sineresis", c.palabraA));
  }
  // Entre palabras: activo si no hay sinalefa activa en esa frontera.
  return !fronterasSinalefa.has(claveFrontera(c.palabraA, c.palabraB));
}

/** Construye las sílabas analizadas con offsets absolutos y tónica. */
function construirSilabas(
  palabras: readonly PalabraConOffsets[],
  escansion: Escansion,
  verso: string,
): SilabaAnalizada[] {
  const tonicas = tonicasPorSilaba(escansion, verso);
  const out: SilabaAnalizada[] = [];
  let plano = 0;
  for (let w = 0; w < palabras.length; w++) {
    const p = palabras[w];
    if (p === undefined) continue;
    const silabas = silabear(p.texto);
    for (const s of silabas) {
      out.push({
        palabra: w,
        texto: s.texto,
        inicio: p.inicio + s.inicio,
        fin: p.inicio + s.fin,
        tonica: tonicas[plano] === true,
      });
      plano += 1;
    }
  }
  return out;
}

/**
 * Analiza un verso completo: escansión, sílabas con offsets absolutos,
 * candidatos con su estado de activación, cómputo y ritmo.
 */
export function analizarVerso(
  verso: string,
  elecciones: readonly Eleccion[],
): AnalisisVerso {
  const palabras = palabrasConOffsets(verso);

  if (palabras.length === 0) {
    return {
      palabras: [],
      silabas: [],
      candidatos: [],
      eleccionesAplicadas: [],
      eleccionesHuerfanas: [],
      computo: null,
      ritmo: null,
    };
  }

  const escansion = resolverEscansion(verso, elecciones);

  const fronterasSinalefa = new Set<string>();
  for (const f of escansion.fronterasSinalefa) {
    fronterasSinalefa.add(claveFrontera(f.palabraA, f.palabraB));
  }

  const eleccionesAplicadas = new Set<string>();
  for (const e of escansion.eleccionesAplicadas) {
    if (e.valor !== "aplicar") continue;
    if (e.tipo === "sineresis" || e.tipo === "dieresis") {
      eleccionesAplicadas.add(claveIntra(e.tipo, e.palabraA));
    }
  }

  const candidatos: CandidatoAnalizado[] = detectarCandidatos(verso).map(
    (c) => ({
      ...c,
      activo: estaActivo(c, fronterasSinalefa, eleccionesAplicadas),
    }),
  );

  const silabas = construirSilabas(palabras, escansion, verso);
  const computo = computar(escansion, verso);
  const ritmo = analizarRitmo(escansion, verso);

  return {
    palabras,
    silabas,
    candidatos,
    eleccionesAplicadas: escansion.eleccionesAplicadas,
    eleccionesHuerfanas: escansion.eleccionesHuerfanas,
    computo,
    ritmo,
  };
}

/** Reexport para conveniencia del caller. */
export type { FronteraSinalefa };
