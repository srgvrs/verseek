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
 * Construye las unidades métricas del verso: cada unidad es un grupo de
 * índices de sílaba plana (0-based, sobre la concatenación de `silabear`
 * por palabra) que cuentan como UNA sola sílaba métrica.
 *
 * §8.4: cada frontera `{palabraA, palabraB}` en `esc.fronterasSinalefa`
 * fusiona la última sílaba de A con la primera de B. Las fusiones pueden
 * encadenarse (p. ej. "una a una": la sílaba final de "una" se fusiona con
 * "a", y esa "a" se fusiona con la inicial de "una" final), así que se
 * agrupa por componentes conectados (union-find), no con `i += 2`.
 *
 * Invariante: `unidades.length === esc.silabasMetricas`.
 */
export function unidadesMetricas(
  escansion: Escansion,
  verso: string,
): number[][] {
  const palabras = partirPalabras(verso);

  // Índice plano de la primera sílaba de cada palabra y total de sílabas.
  const inicioPalabra: number[] = [];
  const silabasPorPalabra: number[] = [];
  let total = 0;
  for (const p of palabras) {
    inicioPalabra.push(total);
    const n = silabear(p).length;
    silabasPorPalabra.push(n);
    total += n;
  }

  // Union-find sobre índices de sílaba plana.
  const padre: number[] = [];
  for (let i = 0; i < total; i++) padre.push(i);
  const encontrar = (x: number): number => {
    let r = x;
    while (padre[r] !== r) r = padre[r] as number;
    // Compresión de camino.
    let c = x;
    while (padre[c] !== r) {
      const sig = padre[c] as number;
      padre[c] = r;
      c = sig;
    }
    return r;
  };
  const unir = (a: number, b: number): void => {
    const ra = encontrar(a);
    const rb = encontrar(b);
    if (ra !== rb) padre[rb] = ra;
  };

  for (const f of escansion.fronterasSinalefa) {
    const inicioA = inicioPalabra[f.palabraA];
    const inicioB = inicioPalabra[f.palabraB];
    const nA = silabasPorPalabra[f.palabraA];
    if (inicioA === undefined || inicioB === undefined || nA === undefined) {
      continue;
    }
    if (nA === 0) continue;
    const idxA = inicioA + nA - 1;
    const idxB = inicioB;
    if (idxA < 0 || idxB >= total) continue;
    unir(idxA, idxB);
  }

  // Agrupar por raíz, preservando el orden de aparición.
  const grupos = new Map<number, number[]>();
  const orden: number[] = [];
  for (let i = 0; i < total; i++) {
    const r = encontrar(i);
    let g = grupos.get(r);
    if (g === undefined) {
      g = [];
      grupos.set(r, g);
      orden.push(r);
    }
    g.push(i);
  }
  return orden.map((r) => grupos.get(r) as number[]);
}

/** Tónicas por sílaba plana (mismo criterio que `construirPatron`). */
function tonicasPorSilaba(verso: string): boolean[] {
  const palabras = partirPalabras(verso);
  const out: boolean[] = [];
  for (const p of palabras) {
    const silabas = silabear(p);
    const { silabaTonica } = clasificarAcento(p);
    for (let i = 0; i < silabas.length; i++) {
      out.push(i === silabaTonica);
    }
  }
  return out;
}

/**
 * Construye el patrón de acentos a partir de las unidades métricas.
 *
 * §8.3: el patrón tiene exactamente `escansion.silabasMetricas + ajuste`
 * posiciones (el cómputo métrico final). Una unidad es tónica si cualquiera
 * de sus sílabas planas lo es. Las sílabas ganadas por la ley de acento
 * final (aguda) se añaden como átonas al final; las perdidas (esdrújula)
 * se descartan del final.
 */
function construirPatron(escansion: Escansion, verso: string): ("T" | "a")[] {
  const unidades = unidadesMetricas(escansion, verso);
  const tonicas = tonicasPorSilaba(verso);

  const patron: ("T" | "a")[] = [];
  for (const u of unidades) {
    const esTonica = u.some((i) => tonicas[i] === true);
    patron.push(esTonica ? "T" : "a");
  }

  // §8.3: ajustar la longitud al cómputo métrico final.
  const ajuste = ajusteFinal(verso);
  const objetivo = escansion.silabasMetricas + ajuste;
  while (patron.length < objetivo) patron.push("a");
  while (patron.length > objetivo) patron.pop();

  return patron;
}

/**
 * Calcula las posiciones tónicas (1-based) sobre las unidades métricas.
 * Una unidad es tónica si cualquiera de sus sílabas planas lo es.
 */
function posicionesTonicas(
  escansion: Escansion,
  verso: string,
): number[] {
  const unidades = unidadesMetricas(escansion, verso);
  const tonicas = tonicasPorSilaba(verso);

  const posiciones: number[] = [];
  for (let u = 0; u < unidades.length; u++) {
    const grupo = unidades[u];
    if (grupo === undefined) continue;
    if (grupo.some((i) => tonicas[i] === true)) posiciones.push(u + 1);
  }
  return posiciones;
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

  // §8.5: patrón binario. Se decide por la última tónica: par → yámbico,
  // impar → trocaico (métrica acentual).
  if (deltas.length === 0 || todosIguales(2)) {
    const etiqueta: EtiquetaRitmo = ultima % 2 === 0 ? "yambico" : "trocaico";
    const confianza = deltas.length === 0 ? 0.4 : 0.8;
    return { etiqueta, confianza };
  }

  // Mezcla de deltas 2 y 3 → mixto con confianza baja.
  const soloBinarioOTernario = deltas.every((d) => d === 2 || d === 3);
  if (soloBinarioOTernario) {
    return { etiqueta: "mixto", confianza: 0.4 };
  }

  // §8.5: si el patrón no es uniforme, se clasifica por la paridad de la
  // última tónica (métrica acentual): par → yámbico, impar → trocaico.
  // Confianza baja por la irregularidad.
  const etiqueta: EtiquetaRitmo = ultima % 2 === 0 ? "yambico" : "trocaico";
  return { etiqueta, confianza: 0.3 };
}

/**
 * Calcula el patrón de acentos y la etiqueta experimental de ritmo.
 */
export function analizarRitmo(escansion: Escansion, verso: string): Ritmo {
  const patron = construirPatron(escansion, verso);
  const posiciones = posicionesTonicas(escansion, verso);
  const { etiqueta, confianza } = etiquetar(posiciones, patron.length);
  return { patron, posicionesTonicas: posiciones, etiqueta, confianza };
}
