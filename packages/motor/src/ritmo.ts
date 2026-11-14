/**
 * Patrón de acentos y etiqueta de ritmo (spike, experimental).
 * Ver `SPEC.propuesta.md` §8.
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada.
 *
 * Reglas (ver `SPEC.propuesta.md` §8):
 *  - §8.2 Se parte de una `Escansion` ya resuelta y del texto del verso.
 *  - §8.3 Se aplica la ley de acento final (aguda +1, esdrújula −1) para que
 *    las posiciones coincidan con el cómputo métrico.
 *  - §8.4 El patrón es un array de `"T"` (tónica) / `"a"` (átona) por sílaba
 *    métrica, en orden.
 *  - §8.5 La etiqueta de ritmo se deriva de la ÚLTIMA tónica (métrica
 *    acentual, no cuantitativa): par → trocaico, impar → yámbico. Si hay
 *    tónicas cada 3 sílabas → dactílico/anapéstico según el ancla.
 *  - §8.6 La etiqueta es EXPERIMENTAL: se devuelve con `confianza` en [0,1]
 *    y nunca se presenta como verdad.
 */

import { clasificarAcento } from "./acento.js";
import type { Escansion } from "./escansion.js";
import { silabear } from "./silabeo.js";

export type EtiquetaRitmo =
  | "yambico"
  | "trocaico"
  | "dactilico"
  | "anapestico"
  | "mixto"
  | "indeterminado";

export interface Ritmo {
  /** Patrón de acentos por sílaba métrica: `"T"` tónica, `"a"` átona. */
  readonly patron: readonly ("T" | "a")[];
  /** Posiciones tónicas (1-based) dentro del patrón. */
  readonly posicionesTonicas: readonly number[];
  /** Etiqueta experimental de ritmo. */
  readonly etiqueta: EtiquetaRitmo;
  /** Confianza en [0, 1] de la etiqueta. */
  readonly confianza: number;
}

/** Divide el verso en palabras (secuencias de letras). */
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

/** Ajuste por ley de acento final (§8.3). */
function ajusteFinal(verso: string): number {
  const palabras = partirPalabras(verso);
  const ultima = palabras[palabras.length - 1];
  if (ultima === undefined) return 0;
  const { tipo } = clasificarAcento(ultima);
  if (tipo === "aguda") return 1;
  if (tipo === "esdrujula" || tipo === "sobresdrujula") return -1;
  return 0;
}

/**
 * Construye el patrón de acentos a partir de la escansión resuelta.
 * Cada sílaba de cada palabra se marca `"T"` si es la tónica de su palabra,
 * `"a"` en caso contrario. Las sílabas ganadas por la ley de acento final
 * (aguda) se añaden como átonas al final; las perdidas (esdrújula) se
 * descartan del final.
 */
function construirPatron(escansion: Escansion, verso: string): ("T" | "a")[] {
  const palabras = partirPalabras(verso);
  const patron: ("T" | "a")[] = [];

  for (const p of palabras) {
    const silabas = silabear(p);
    const { silabaTonica } = clasificarAcento(p);
    for (let i = 0; i < silabas.length; i++) {
      patron.push(i === silabaTonica ? "T" : "a");
    }
  }

  const ajuste = ajusteFinal(verso);
  if (ajuste > 0) {
    for (let k = 0; k < ajuste; k++) patron.push("a");
  } else if (ajuste < 0) {
    for (let k = 0; k < -ajuste; k++) patron.pop();
  }

  // §8.3: el patrón refleja el cómputo métrico DESPUÉS de la ley de acento
  // final. No se recorta contra `escansion.silabasMetricas` (que es el conteo
  // previo al ajuste); hacerlo desharía la ley de acento final.
  return patron;
}

/** Posiciones (1-based) de las tónicas en el patrón. */
function posicionesTonicas(patron: readonly ("T" | "a")[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < patron.length; i++) {
    if (patron[i] === "T") out.push(i + 1);
  }
  return out;
}

/**
 * Deriva la etiqueta de ritmo a partir de las posiciones tónicas.
 * §8.5: métrica acentual, no cuantitativa.
 */
function etiquetar(
  posiciones: readonly number[],
  totalSilabas: number,
): { etiqueta: EtiquetaRitmo; confianza: number } {
  if (totalSilabas < 2 || posiciones.length === 0) {
    return { etiqueta: "indeterminado", confianza: 0 };
  }

  const ultima = posiciones[posiciones.length - 1];
  if (ultima === undefined) {
    return { etiqueta: "indeterminado", confianza: 0 };
  }

  // Diferencia constante entre tónicas consecutivas.
  const deltas: number[] = [];
  for (let i = 1; i < posiciones.length; i++) {
    const a = posiciones[i - 1];
    const b = posiciones[i];
    if (a === undefined || b === undefined) continue;
    deltas.push(b - a);
  }

  const todosIguales = (v: number): boolean =>
    deltas.length > 0 && deltas.every((d) => d === v);

  // §8.5: patrón ternario (dactílico/anapéstico) si todas las tónicas están
  // cada 3 sílabas.
  if (todosIguales(3)) {
    const primera = posiciones[0] ?? 1;
    if (primera % 3 === 1) {
      return { etiqueta: "dactilico", confianza: 0.7 };
    }
    return { etiqueta: "anapestico", confianza: 0.7 };
  }

  // §8.5: patrón binario. Se decide por la última tónica.
  if (deltas.length === 0 || todosIguales(2)) {
    const etiqueta: EtiquetaRitmo = ultima % 2 === 0 ? "trocaico" : "yambico";
    const confianza = deltas.length === 0 ? 0.4 : 0.8;
    return { etiqueta, confianza };
  }

  // Mezcla de deltas 2 y 3 → mixto con confianza baja.
  const soloBinarioOTernario = deltas.every((d) => d === 2 || d === 3);
  if (soloBinarioOTernario) {
    return { etiqueta: "mixto", confianza: 0.4 };
  }

  // §8.5: si el patrón no es uniforme, se clasifica por la paridad de la
  // última tónica (métrica acentual). Confianza baja por la irregularidad.
  const etiqueta: EtiquetaRitmo = ultima % 2 === 0 ? "trocaico" : "yambico";
  return { etiqueta, confianza: 0.3 };
}

/**
 * Calcula el patrón de acentos y la etiqueta experimental de ritmo.
 */
export function analizarRitmo(escansion: Escansion, verso: string): Ritmo {
  const patron = construirPatron(escansion, verso);
  const posiciones = posicionesTonicas(patron);
  const { etiqueta, confianza } = etiquetar(posiciones, patron.length);
  return { patron, posicionesTonicas: posiciones, etiqueta, confianza };
}
