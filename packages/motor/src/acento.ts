/**
 * Clasificación acentual de una palabra en español (spike).
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada.
 *
 * Reglas (ver `SPEC.propuesta.md` §4):
 *  - §4.2 Si la palabra lleva tilde explícita, la sílaba tónica es la que la
 *    porta; el tipo se deriva de su posición (última → aguda, penúltima →
 *    llana, antepenúltima → esdrújula, anterior → sobresdrújula).
 *  - §4.3 Sin tilde: aguda si termina en vocal, `n` o `s`; llana en el resto.
 *  - §4.4 Monosílabos: siempre `monosilabo`.
 *  - §4.5 Adverbios en `-mente`: se analiza la base (sin `-mente`) y se
 *    reporta el tipo de la base; la tónica cae en la base.
 *  - §4.6 Palabra vacía o sin vocales: `monosilabo`, `tonica: null`.
 */

import { silabear, type Silaba } from "./silabeo.js";

export type TipoAcento = "aguda" | "llana" | "esdrujula" | "sobresdrujula" | "monosilabo";

export interface ResultadoAcento {
  /** Clasificación acentual de la palabra. */
  readonly tipo: TipoAcento;
  /** Índice (0-based) de la sílaba tónica dentro de `silabas`. */
  readonly silabaTonica: number;
  /** Sílaba tónica (referencia al array devuelto por `silabear`). */
  readonly tonica: Silaba | null;
  /** Sílaba completa descompuesta, para conveniencia del caller. */
  readonly silabas: readonly Silaba[];
}

const VOCALES_TILDADAS = new Set(["á", "é", "í", "ó", "ú", "Á", "É", "Í", "Ó", "Ú"]);

function tieneTilde(texto: string): boolean {
  for (const c of texto) {
    if (VOCALES_TILDADAS.has(c)) return true;
  }
  return false;
}

function terminaEnVocalNoS(palabra: string): boolean {
  const ultimo = palabra[palabra.length - 1] ?? "";
  const l = ultimo.toLowerCase();
  return l === "a" || l === "e" || l === "i" || l === "o" || l === "u" || l === "n" || l === "s";
}

function clasificarPorPosicion(posicionDesdeElFinal: number, totalSilabas: number): TipoAcento {
  if (totalSilabas <= 1) return "monosilabo";
  if (posicionDesdeElFinal === 0) return "aguda";
  if (posicionDesdeElFinal === 1) return "llana";
  if (posicionDesdeElFinal === 2) return "esdrujula";
  return "sobresdrujula";
}

function analizarBase(palabra: string): ResultadoAcento {
  const silabas = silabear(palabra);
  if (silabas.length === 0) {
    return { tipo: "monosilabo", silabaTonica: 0, tonica: null, silabas };
  }
  if (silabas.length === 1) {
    return { tipo: "monosilabo", silabaTonica: 0, tonica: silabas[0] ?? null, silabas };
  }

  // §4.2: tilde explícita manda.
  for (let i = 0; i < silabas.length; i++) {
    const s = silabas[i];
    if (s !== undefined && tieneTilde(s.texto)) {
      const desdeFinal = silabas.length - 1 - i;
      return {
        tipo: clasificarPorPosicion(desdeFinal, silabas.length),
        silabaTonica: i,
        tonica: s,
        silabas,
      };
    }
  }

  // §4.3: sin tilde, aguda si termina en vocal/n/s; llana en el resto.
  const esAguda = terminaEnVocalNoS(palabra);
  const idx = esAguda ? silabas.length - 1 : silabas.length - 2;
  const tipo: TipoAcento = esAguda ? "aguda" : "llana";
  return {
    tipo,
    silabaTonica: idx,
    tonica: silabas[idx] ?? null,
    silabas,
  };
}

export function clasificarAcento(palabra: string): ResultadoAcento {
  if (palabra.length === 0) {
    return { tipo: "monosilabo", silabaTonica: 0, tonica: null, silabas: [] };
  }

  // §4.5: adverbios en -mente → analizar la base.
  const lower = palabra.toLowerCase();
  if (lower.endsWith("mente") && palabra.length > 5) {
    const base = palabra.slice(0, palabra.length - 5);
    const resultadoBase = analizarBase(base);
    const silabasCompletas = silabear(palabra);
    const idx = resultadoBase.silabaTonica;
    return {
      tipo: resultadoBase.tipo,
      silabaTonica: idx,
      tonica: silabasCompletas[idx] ?? null,
      silabas: silabasCompletas,
    };
  }

  return analizarBase(palabra);
}
