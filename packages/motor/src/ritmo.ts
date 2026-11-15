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

import { clasificarAcento, esAtono } from "./acento.js";
import type { Escansion } from "./escansion.js";
import { silabear, type Silaba } from "./silabeo.js";

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

const VOCALES_ABIERTAS = new Set(["a", "e", "o", "á", "é", "ó"]);
const VOCALES_CERRADAS = new Set(["i", "u", "ü", "í", "ú"]);
const VOCALES_TILDADAS = new Set(["á", "é", "í", "ó", "ú"]);

function esVocal(c: string): boolean {
  const l = c.toLowerCase();
  return VOCALES_ABIERTAS.has(l) || VOCALES_CERRADAS.has(l);
}

function esAbierta(c: string): boolean {
  return VOCALES_ABIERTAS.has(c.toLowerCase());
}

function esCerrada(c: string): boolean {
  return VOCALES_CERRADAS.has(c.toLowerCase());
}

function esTildada(c: string): boolean {
  return VOCALES_TILDADAS.has(c.toLowerCase());
}

/**
 * §OVR-05: índice (dentro de `silaba.texto`) de la vocal tónica de una
 * sílaba tónica. Prioridad: vocal con tilde; si no, la abierta; si no,
 * la segunda de `ui/iu` (ACE-04); si no, la primera vocal.
 */
function indiceVocalTonicaEnSilaba(texto: string): number {
  const chars = Array.from(texto);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c !== undefined && esTildada(c)) return i;
  }
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c !== undefined && esAbierta(c)) return i;
  }
  // ui / iu: la segunda vocal.
  const vocales: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c !== undefined && esVocal(c)) vocales.push(i);
  }
  if (vocales.length >= 2) return vocales[1] as number;
  if (vocales.length === 1) return vocales[0] as number;
  return 0;
}

/**
 * §OVR-05: aplica sinéresis a una palabra. Fusiona el ÚLTIMO par de
 * sílabas contiguas separadas por hiato (dos vocales en contacto, sin
 * consonante entre ellas). Devuelve los grupos de índices planos
 * (relativos a `inicio`) que forman cada unidad de la palabra.
 *
 * Si no hay par de sílabas en hiato, devuelve la agrupación por defecto
 * (una unidad por sílaba).
 */
function agruparConSineresis(
  silabas: readonly Silaba[],
  inicio: number,
): number[][] {
  const grupos: number[][] = silabas.map((_, i) => [inicio + i]);
  for (let k = silabas.length - 2; k >= 0; k--) {
    const a = silabas[k];
    const b = silabas[k + 1];
    if (a === undefined || b === undefined) continue;
    const ultimoA = a.texto[a.texto.length - 1] ?? "";
    const primeroB = b.texto[0] ?? "";
    if (esVocal(ultimoA) && esVocal(primeroB)) {
      // Fusionar k y k+1 en una sola unidad.
      const fusion = [...(grupos[k] as number[]), ...(grupos[k + 1] as number[])];
      grupos.splice(k, 2, fusion);
      return grupos;
    }
  }
  return grupos;
}

/**
 * §OVR-05: aplica diéresis a una palabra. Divide el PRIMER diptongo en
 * dos unidades. La tónica va a la mitad que contiene la vocal tónica de
 * la palabra (según `clasificarAcento`).
 *
 * Si no hay diptongo, devuelve la agrupación por defecto.
 */
function agruparConDieresis(
  palabra: string,
  silabas: readonly Silaba[],
  inicio: number,
): number[][] {
  const { silabaTonica } = clasificarAcento(palabra);

  for (let k = 0; k < silabas.length; k++) {
    const s = silabas[k];
    if (s === undefined) continue;
    const chars = Array.from(s.texto);
    // Buscar el primer par de vocales contiguas que formen diptongo.
    for (let i = 0; i < chars.length - 1; i++) {
      const c1 = chars[i];
      const c2 = chars[i + 1];
      if (c1 === undefined || c2 === undefined) continue;
      if (!esVocal(c1) || !esVocal(c2)) continue;
      // Diptongo: al menos una cerrada, y ninguna cerrada tónica.
      const c1Ab = esAbierta(c1);
      const c2Ab = esAbierta(c2);
      if (c1Ab && c2Ab) continue;
      if (esTildada(c1) && esCerrada(c1)) continue;
      if (esTildada(c2) && esCerrada(c2)) continue;

      // Dividir la sílaba k en dos unidades: [inicio+k] y [inicio+k] (misma
      // sílaba plana, pero dos unidades métricas). La tónica va a la mitad
      // que contiene la vocal tónica de la palabra.
      const idxTonica = indiceVocalTonicaEnSilaba(s.texto);
      const tonicaEnPrimeraMitad = idxTonica <= i;

      const grupos: number[][] = [];
      for (let j = 0; j < silabas.length; j++) {
        if (j === k) {
          // Dos unidades para esta sílaba. Ambas apuntan al mismo índice
          // plano; la tónica se marca en `tonicasPorSilaba` por sílaba, así
          // que la mitad no tónica debe quedar como átona. Para lograrlo,
          // devolvemos el índice plano en la mitad tónica y un índice
          // "fantasma" negativo en la otra mitad (nunca tónico).
          const idxPlano = inicio + k;
          if (tonicaEnPrimeraMitad) {
            grupos.push([idxPlano]);
            grupos.push([-1]);
          } else {
            grupos.push([-1]);
            grupos.push([idxPlano]);
          }
        } else {
          grupos.push([inicio + j]);
        }
      }
      return grupos;
    }
  }
  return silabas.map((_, i) => [inicio + i]);
}

/**
 * Construye las unidades métricas del verso: cada unidad es un grupo de
 * índices de sílaba plana (0-based, sobre la concatenación de `silabear`
 * por palabra) que cuentan como UNA sola sílaba métrica.
 *
 * §OVR-05: antes de las fusiones por sinalefa, se aplican sinéresis y
 * diéresis intra-palabra según `esc.eleccionesAplicadas`.
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
  const silabasDePalabra: Silaba[][] = [];
  let total = 0;
  for (const p of palabras) {
    inicioPalabra.push(total);
    const ss = [...silabear(p)];
    silabasPorPalabra.push(ss.length);
    silabasDePalabra.push(ss);
    total += ss.length;
  }

  // §OVR-05: índice de elecciones intra-palabra por palabra.
  const sineresisEn = new Set<number>();
  const dieresisEn = new Set<number>();
  for (const e of escansion.eleccionesAplicadas) {
    if (e.valor !== "aplicar") continue;
    if (e.palabraA !== e.palabraB) continue;
    if (e.tipo === "sineresis") sineresisEn.add(e.palabraA);
    else if (e.tipo === "dieresis") dieresisEn.add(e.palabraA);
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

  // §OVR-05: agrupar por palabra, aplicando sinéresis/diéresis intra-palabra
  // ANTES de las fusiones por sinalefa (que ya están en el union-find).
  const unidades: number[][] = [];
  for (let w = 0; w < palabras.length; w++) {
    const p = palabras[w];
    const inicio = inicioPalabra[w];
    const ss = silabasDePalabra[w];
    if (p === undefined || inicio === undefined || ss === undefined) continue;

    let gruposPalabra: number[][];
    if (dieresisEn.has(w)) {
      gruposPalabra = agruparConDieresis(p, ss, inicio);
    } else if (sineresisEn.has(w)) {
      gruposPalabra = agruparConSineresis(ss, inicio);
    } else {
      gruposPalabra = ss.map((_, i) => [inicio + i]);
    }

    for (const g of gruposPalabra) {
      // Fusionar con las raíces del union-find (sinalefa).
      const raices = new Set<number>();
      for (const idx of g) {
        if (idx < 0) continue;
        raices.add(encontrar(idx));
      }
      if (raices.size === 0) {
        // Unidad fantasma (mitad átona de una diéresis): índice negativo.
        unidades.push(g);
        continue;
      }
      // Unir todas las raíces del grupo (por si la sinalefa las separó).
      const arr = [...raices];
      const primera = arr[0] as number;
      for (let i = 1; i < arr.length; i++) {
        unir(primera, arr[i] as number);
      }
      unidades.push(g);
    }
  }

  // Reagrupar por raíz final, preservando el orden de aparición de las
  // unidades (no de los índices planos), para respetar el orden de las
  // mitades de diéresis.
  const grupos = new Map<number, number[]>();
  const orden: number[] = [];
  const resultado: number[][] = [];
  for (const g of unidades) {
    const raices = new Set<number>();
    for (const idx of g) {
      if (idx < 0) continue;
      raices.add(encontrar(idx));
    }
    if (raices.size === 0) {
      resultado.push(g);
      continue;
    }
    const r = [...raices][0] as number;
    let acc = grupos.get(r);
    if (acc === undefined) {
      acc = [];
      grupos.set(r, acc);
      orden.push(r);
      resultado.push(acc);
    }
    for (const idx of g) acc.push(idx);
  }
  return resultado;
}

/**
 * Tónicas por sílaba plana (mismo criterio que `construirPatron`).
 *
 * §OVR-05: si la palabra lleva diéresis, la sílaba dividida produce dos
 * unidades; la tónica va a la mitad que contiene la vocal tónica. Se
 * devuelve un array paralelo al de sílabas planas, pero con la sílaba
 * dividida marcada como tónica (la mitad átona se representa con índice
 * negativo en `unidadesMetricas`, así que aquí basta con marcar la sílaba
 * plana como tónica).
 */
function tonicasPorSilaba(verso: string): boolean[] {
  const palabras = partirPalabras(verso);
  const out: boolean[] = [];
  const ultima = palabras.length - 1;
  for (let w = 0; w < palabras.length; w++) {
    const p = palabras[w];
    if (p === undefined) continue;
    const silabas = silabear(p);
    // §ACE-05: monosílabos átonos de la lista cerrada no llevan tónica.
    // §ACE-05b: la última palabra del verso es siempre tónica, aunque sea
    // un monosílabo de la lista.
    const atono = w !== ultima && esAtono(p);
    const { silabaTonica } = clasificarAcento(p);
    // §ACE-06: adverbios en -mente llevan dos tónicas: la de la base
    // adjetival (ya marcada por `silabaTonica`) y la sílaba "men", que es
    // la penúltima. Si la base no aporta tónica propia (p. ej. "demente",
    // donde la penúltima ya es "men"), no se duplica.
    const esMente = p.toLowerCase().endsWith("mente") && silabas.length >= 2;
    const idxMen = esMente ? silabas.length - 2 : -1;
    for (let i = 0; i < silabas.length; i++) {
      const tonica = i === silabaTonica || i === idxMen;
      out.push(!atono && tonica);
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
    const esTonica = u.some((i) => i >= 0 && tonicas[i] === true);
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
    if (grupo.some((i) => i >= 0 && tonicas[i] === true)) posiciones.push(u + 1);
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
