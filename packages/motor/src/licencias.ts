/**
 * Detección de candidatos de licencia métrica entre palabras de un verso
 * (spike). Ver `SPEC.propuesta.md` §5.
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada.
 *
 * El motor NO elige: devuelve todas las opciones posibles para que el caller
 * (UI / `computo`) decida. Cada `Candidato` describe la frontera entre dos
 * palabras adyacentes y las licencias aplicables.
 *
 * Reglas (ver `SPEC.propuesta.md` §5):
 *  - §5.2 Sinalefa: vocal final de palabra A + vocal inicial de palabra B
 *    (con o sin *h* muda intermedia) → fusionan en una sola sílaba.
 *  - §5.3 Hiato: las mismas vocales pueden NO fusionarse (opción alternativa).
 *  - §5.4 Sinéresis: dentro de una palabra, dos vocales en hiato pueden
 *    fusionarse en diptongo (opción alternativa).
 *  - §5.5 Diéresis: dentro de una palabra, un diptongo puede deshacerse en
 *    hiato (opción alternativa).
 *  - §5.6 La puntuación entre palabras NO bloquea la sinalefa (LIC-05).
 *  - §5.7 *h* muda inicial de B no bloquea la sinalefa; *h* aspirada fuera
 *    de alcance.
 */

import { silabear, type Silaba } from "./silabeo.js";

export type TipoLicencia = "sinalefa" | "hiato" | "sineresis" | "dieresis";

export interface Candidato {
  /** Tipo de licencia detectada. */
  readonly tipo: TipoLicencia;
  /** Índice de la palabra A (0-based) en el verso. */
  readonly palabraA: number;
  /** Índice de la palabra B (0-based) en el verso. */
  readonly palabraB: number;
  /** Texto de la sílaba afectada en A (o la sílaba completa si es intra-palabra). */
  readonly silabaA: string;
  /** Texto de la sílaba afectada en B (o la sílaba completa si es intra-palabra). */
  readonly silabaB: string;
  /** Nº de sílabas si NO se aplica la licencia (baseline). */
  readonly silabasSin: number;
  /** Nº de sílabas si SÍ se aplica la licencia. */
  readonly silabasCon: number;
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

/** Primera letra vocal de la palabra, saltando *h* muda inicial (§5.7). */
function primeraVocal(palabra: string): { letra: string; indice: number } | null {
  // §SIL-10: la conjunción "y" cuenta como vocal cerrada.
  if (palabra.toLowerCase() === "y") return { letra: "i", indice: 0 };
  for (let i = 0; i < palabra.length; i++) {
    const c = palabra[i];
    if (c === undefined) continue;
    const l = c.toLowerCase();
    if (l === "h") continue; // §5.7: h muda no bloquea.
    if (esVocal(l)) return { letra: l, indice: i };
    return null; // primera letra no-h no es vocal → no hay sinalefa.
  }
  return null;
}

/** Última letra vocal de la palabra. */
function ultimaVocal(palabra: string): { letra: string; indice: number } | null {
  // §SIL-10: la conjunción "y" cuenta como vocal cerrada.
  if (palabra.toLowerCase() === "y") return { letra: "i", indice: 0 };
  for (let i = palabra.length - 1; i >= 0; i--) {
    const c = palabra[i];
    if (c === undefined) continue;
    const l = c.toLowerCase();
    if (esVocal(l)) return { letra: l, indice: i };
    return null;
  }
  return null;
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

/**
 * Detecta candidatos de sinalefa / hiato entre palabras adyacentes.
 * Devuelve un candidato por frontera donde ambas palabras empiezan/terminan
 * en vocal (con o sin *h* muda intermedia).
 */
function candidatosEntrePalabras(
  verso: string,
  palabras: readonly string[],
): Candidato[] {
  const out: Candidato[] = [];
  for (let i = 0; i < palabras.length - 1; i++) {
    const a = palabras[i];
    const b = palabras[i + 1];
    if (a === undefined || b === undefined) continue;

    const finA = ultimaVocal(a);
    const iniB = primeraVocal(b);
    if (finA === null || iniB === null) continue;

    // §5.6 (LIC-05): la puntuación NO bloquea la sinalefa.

    const silabasA = silabear(a);
    const silabasB = silabear(b);
    const silabaA = silabasA[silabasA.length - 1];
    const silabaB = silabasB[0];
    if (silabaA === undefined || silabaB === undefined) continue;

    const base = silabasA.length + silabasB.length;

    // §5.3 (D7 cerrada): una vocal cerrada con tilde en el límite entre
    // palabras NO bloquea la sinalefa ("su último" → su‿úl).

    // §5.2: sinalefa (fusiona).
    out.push({
      tipo: "sinalefa",
      palabraA: i,
      palabraB: i + 1,
      silabaA: silabaA.texto,
      silabaB: silabaB.texto,
      silabasSin: base,
      silabasCon: base - 1,
    });

    // §5.3: hiato (no fusiona) como alternativa.
    out.push({
      tipo: "hiato",
      palabraA: i,
      palabraB: i + 1,
      silabaA: silabaA.texto,
      silabaB: silabaB.texto,
      silabasSin: base,
      silabasCon: base,
    });
  }
  return out;
}

/**
 * Detecta candidatos intra-palabra: sinéresis (hiato → diptongo) y diéresis
 * (diptongo → hiato). Se apoya en `silabear` para saber la partición actual.
 */
function candidatosIntraPalabra(palabras: readonly string[]): Candidato[] {
  const out: Candidato[] = [];
  for (let i = 0; i < palabras.length; i++) {
    const p = palabras[i];
    if (p === undefined) continue;
    const silabas = silabear(p);
    if (silabas.length < 2) continue;

    // §5.4 sinéresis: dos sílabas contiguas cuyas vocales podrían fusionarse.
    for (let k = 0; k < silabas.length - 1; k++) {
      const s1 = silabas[k];
      const s2 = silabas[k + 1];
      if (s1 === undefined || s2 === undefined) continue;
      const v1 = ultimaVocal(s1.texto);
      const v2 = primeraVocal(s2.texto);
      if (v1 === null || v2 === null) continue;
      const esHiato =
        (esAbierta(v1.letra) && esAbierta(v2.letra)) ||
        (esCerrada(v1.letra) && esTildada(v1.letra)) ||
        (esCerrada(v2.letra) && esTildada(v2.letra));
      if (!esHiato) continue;
      out.push({
        tipo: "sineresis",
        palabraA: i,
        palabraB: i,
        silabaA: s1.texto,
        silabaB: s2.texto,
        silabasSin: silabas.length,
        silabasCon: silabas.length - 1,
      });
    }

    // §5.5 diéresis: una sílaba con diptongo podría deshacerse en hiato.
    for (let k = 0; k < silabas.length; k++) {
      const s = silabas[k];
      if (s === undefined) continue;
      const vocales: string[] = [];
      for (const c of s.texto) {
        if (esVocal(c)) vocales.push(c.toLowerCase());
      }
      if (vocales.length < 2) continue;
      const hayAbierta = vocales.some((v) => esAbierta(v));
      const hayCerrada = vocales.some((v) => esCerrada(v));
      const esDiptongo =
        (hayAbierta && hayCerrada) ||
        (vocales.length === 2 &&
          esCerrada(vocales[0] ?? "") &&
          esCerrada(vocales[1] ?? "") &&
          vocales[0] !== vocales[1]);
      if (!esDiptongo) continue;
      out.push({
        tipo: "dieresis",
        palabraA: i,
        palabraB: i,
        silabaA: s.texto,
        silabaB: s.texto,
        silabasSin: silabas.length,
        silabasCon: silabas.length + 1,
      });
    }
  }
  return out;
}

/**
 * Devuelve todos los candidatos de licencia detectables en un verso.
 * El motor NO elige: el caller decide qué combinación aplicar.
 */
export function detectarCandidatos(verso: string): readonly Candidato[] {
  if (verso.length === 0) return [];
  const palabras = partirPalabras(verso);
  if (palabras.length === 0) return [];

  const entre = candidatosEntrePalabras(verso, palabras);
  const intra = candidatosIntraPalabra(palabras);
  return [...entre, ...intra];
}

/** Reexport para conveniencia del caller. */
export type { Silaba };
