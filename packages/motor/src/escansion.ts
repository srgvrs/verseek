/**
 * Resolución de candidatos de licencia + elecciones del usuario en una
 * escansión concreta (spike). Ver `SPEC.propuesta.md` §6.
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada. Idempotente:
 * `resolverEscansion(v, e)` produce el mismo resultado para las mismas
 * entradas.
 *
 * Reglas (ver `SPEC.propuesta.md` §6):
 *  - §6.2 Sin elección → no se aplica ninguna licencia (baseline = silabeo
 *    plano de cada palabra).
 *  - §6.3 Una `Eleccion` se identifica por `(tipo, palabraA, palabraB)`. Si no
 *    coincide con ningún candidato, se reporta como huérfana y NO se aplica.
 *  - §6.4 Sinalefa e hiato sobre la misma frontera son mutuamente excluyentes:
 *    si el usuario envía ambas, gana la última del array.
 *  - §6.5 Sinéresis y diéresis intra-palabra se combinan con las elecciones
 *    entre palabras sumando sus deltas de sílabas.
 */

import { detectarCandidatos, type Candidato, type TipoLicencia } from "./licencias.js";
import { silabear, type Silaba } from "./silabeo.js";

export interface Eleccion {
  readonly tipo: TipoLicencia;
  readonly palabraA: number;
  readonly palabraB: number;
  readonly valor: "aplicar" | "no-aplicar";
}

export interface Escansion {
  /** Sílaba a sílaba del verso, ya con las licencias aplicadas. */
  readonly silabas: readonly Silaba[];
  /** Nº total de sílabas métricas tras aplicar las elecciones. */
  readonly silabasMetricas: number;
  /** Elecciones que coincidieron con un candidato y se aplicaron. */
  readonly eleccionesAplicadas: readonly Eleccion[];
  /** Elecciones que no coincidieron con ningún candidato. */
  readonly eleccionesHuerfanas: readonly Eleccion[];
}

/** Divide el verso en palabras (secuencias de letras), igual que `licencias`. */
function partirPalabras(verso: string): readonly string[] {
  const out: string[] = [];
  let actual = "";
  for (const c of verso) {
    if (/^\p{L}$/u.test(c)) {
      actual += c;
    } else if (actual.length > 0) {
      out.push(actual);
      actual = "";
    }
  }
  if (actual.length > 0) out.push(actual);
  return out;
}

/** Clave canónica de una frontera o punto intra-palabra. */
function clave(tipo: TipoLicencia, palabraA: number, palabraB: number): string {
  return `${tipo}:${palabraA}:${palabraB}`;
}

/**
 * Construye el índice de candidatos por clave. Si hay varios candidatos con
 * la misma clave (no debería ocurrir con `licencias.ts` actual), se conserva
 * el primero.
 */
function indexarCandidatos(
  candidatos: readonly Candidato[],
): Map<string, Candidato> {
  const mapa = new Map<string, Candidato>();
  for (const c of candidatos) {
    const k = clave(c.tipo, c.palabraA, c.palabraB);
    if (!mapa.has(k)) mapa.set(k, c);
  }
  return mapa;
}

/**
 * Aplica las elecciones del usuario sobre los candidatos detectados y
 * devuelve la escansión resultante.
 */
export function resolverEscansion(
  verso: string,
  elecciones: readonly Eleccion[],
): Escansion {
  const palabras = partirPalabras(verso);
  const candidatos = detectarCandidatos(verso);
  const indice = indexarCandidatos(candidatos);

  // §6.4: sinalefa e hiato sobre la misma frontera son excluyentes.
  // Recorremos en orden y nos quedamos con la última elección por frontera.
  const porFrontera = new Map<string, Eleccion>();
  const aplicadas: Eleccion[] = [];
  const huerfanas: Eleccion[] = [];

  for (const e of elecciones) {
    const k = clave(e.tipo, e.palabraA, e.palabraB);
    if (!indice.has(k)) {
      huerfanas.push(e);
      continue;
    }
    if (e.tipo === "sinalefa" || e.tipo === "hiato") {
      // Clave de frontera sin el tipo: sinalefa e hiato comparten frontera.
      const kFrontera = `${e.palabraA}:${e.palabraB}`;
      porFrontera.set(kFrontera, e);
    } else {
      // Sinéresis / diéresis: clave completa (tipo incluido).
      porFrontera.set(k, e);
    }
    aplicadas.push(e);
  }

  // Baseline: silabeo plano de cada palabra.
  const silabasBase: Silaba[] = [];
  for (const p of palabras) {
    for (const s of silabear(p)) silabasBase.push(s);
  }

  // §6.5: sumamos deltas de sílabas por cada elección "aplicar".
  let delta = 0;
  for (const e of porFrontera.values()) {
    if (e.valor !== "aplicar") continue;
    const k = clave(e.tipo, e.palabraA, e.palabraB);
    const c = indice.get(k);
    if (c === undefined) continue;
    delta += c.silabasCon - c.silabasSin;
  }

  const silabasMetricas = silabasBase.length + delta;

  return {
    silabas: silabasBase,
    silabasMetricas,
    eleccionesAplicadas: aplicadas,
    eleccionesHuerfanas: huerfanas,
  };
}
