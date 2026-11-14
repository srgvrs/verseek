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

/** §LIC-03: conjunciones de una letra que pueden formar sinalefa triple. */
function esConjuncionBreve(palabra: string): boolean {
  const l = palabra.toLowerCase();
  return l === "y" || l === "e" || l === "o";
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

  // §LIC-03: índice de fronteras con sinalefa candidata, para detectar
  // sinalefa triple con conjunción breve en el centro.
  const fronterasSinalefa = new Set<string>();
  for (const c of candidatos) {
    if (c.tipo === "sinalefa") {
      fronterasSinalefa.add(`${c.palabraA}:${c.palabraB}`);
    }
  }

  // §6.5 + LIC-01: la sinalefa se aplica por defecto. Sinéresis y diéresis
  // solo por elección explícita del usuario.
  //
  // Para cada candidato decidimos si está activo:
  //  - sinalefa: activa salvo que el usuario la desactive con
  //    `sinalefa:no-aplicar` o active el hiato con `hiato:aplicar` en la
  //    misma frontera.
  //  - hiato: nunca suma delta (es el baseline); su única función es
  //    desactivar la sinalefa de su frontera.
  //  - sinéresis / diéresis: activas solo si el usuario elige `aplicar`.
  let delta = 0;
  for (const c of candidatos) {
    if (c.tipo === "hiato") continue;

    if (c.tipo === "sinalefa") {
      const kFrontera = `${c.palabraA}:${c.palabraB}`;
      const eleccion = porFrontera.get(kFrontera);
      const desactivada =
        eleccion !== undefined &&
        ((eleccion.tipo === "sinalefa" && eleccion.valor === "no-aplicar") ||
          (eleccion.tipo === "hiato" && eleccion.valor === "aplicar"));
      if (desactivada) continue;

      // §LIC-03: si la palabra B es una conjunción breve (y/e/o) y también
      // hay sinalefa entre esa conjunción y la palabra siguiente, no aplicar
      // la primera (evita la sinalefa triple). Una elección explícita del
      // usuario sigue mandando.
      const palabraB = palabras[c.palabraB];
      if (
        eleccion === undefined &&
        palabraB !== undefined &&
        esConjuncionBreve(palabraB) &&
        fronterasSinalefa.has(`${c.palabraB}:${c.palabraB + 1}`)
      ) {
        continue;
      }

      delta += c.silabasCon - c.silabasSin;
      continue;
    }

    // sinéresis / diéresis: solo por elección explícita.
    const k = clave(c.tipo, c.palabraA, c.palabraB);
    const eleccion = porFrontera.get(k);
    if (eleccion === undefined || eleccion.valor !== "aplicar") continue;
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
