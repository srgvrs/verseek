/**
 * Implementación de `normalizar` según `SPEC.propuesta.md` §2 y §13 (spike).
 *
 * Pureza: sin `Date.now()`, `Math.random()`, red, `window`, `document`,
 * `localStorage` ni efectos secundarios. No muta sus argumentos.
 */

export interface ResultadoNormalizacion {
  readonly texto: string;
  readonly offsets: readonly number[];
}

/** Espacios que unificamos al espacio ASCII U+0020 (SPEC.propuesta §2.5). */
const ESPACIOS_A_UNIFICAR: ReadonlySet<string> = new Set([
  "\u00A0", // NBSP
  "\u2007", // figure space
  "\u2009", // thin space
  "\u202F", // narrow NBSP
  "\u3000", // ideographic space
  "\t", // tabulador
]);

/** Apóstrofos que unificamos a `'` U+0027 (SPEC.propuesta §2.7). */
const APOSTROFOS_A_UNIFICAR: ReadonlySet<string> = new Set([
  "'", // U+0027
  "\u2019", // ’
  "\u2018", // ‘
  "\u0060", // `
]);

const APOSTROFO_CANONICO = "'";

/**
 * Convierte una unidad de código de entrada a una cadena de salida junto con
 * el índice original que le corresponde como origen.
 *
 * Devuelve `null` cuando la unidad no produce carácter en la salida.
 */
function tratarUnidad(
  unidad: string,
  indiceOriginal: number,
  anteriorEsEspacio: boolean,
): { salida: string; origen: number } | null {
  // SPEC.propuesta §2.6: normalizar `\r\n` a `\n` se gestiona fuera para
  // poder consumir dos caracteres con un solo origen; aquí `\r` solo aparece
  // suelto.
  if (unidad === "\r") {
    return { salida: "\n", origen: indiceOriginal };
  }

  if (unidad === " " || ESPACIOS_A_UNIFICAR.has(unidad)) {
    // SPEC.propuesta §2.5: colapsar espacios consecutivos.
    if (anteriorEsEspacio) {
      return null;
    }
    return { salida: " ", origen: indiceOriginal };
  }

  if (APOSTROFOS_A_UNIFICAR.has(unidad)) {
    // SPEC.propuesta §2.7: unificar apóstrofos a U+0027.
    return { salida: APOSTROFO_CANONICO, origen: indiceOriginal };
  }

  return { salida: unidad, origen: indiceOriginal };
}

export function normalizar(texto: string): ResultadoNormalizacion {
  const entrada = texto.normalize("NFC"); // SPEC.propuesta §2.4
  const simbolos = Array.from(entrada);

  const construccion: { char: string; origen: number }[] = [];
  let anteriorEsEspacio = false;
  let i = 0;

  while (i < simbolos.length) {
    const actual = simbolos[i];
    if (actual === undefined) {
      i += 1;
      continue;
    }

    // SPEC.propuesta §2.6: `\r\n` → `\n`, origen = primer carácter del grupo (`\r`).
    if (actual === "\r") {
      const siguiente = simbolos[i + 1];
      if (siguiente === "\n") {
        construccion.push({ char: "\n", origen: i });
        anteriorEsEspacio = false;
        i += 2;
        continue;
      }
    }

    const resultado = tratarUnidad(actual, i, anteriorEsEspacio);
    if (resultado !== null) {
      construccion.push({ char: resultado.salida, origen: resultado.origen });
      anteriorEsEspacio = resultado.salida === " ";
    }
    // Si es null (espacio colapsado), `anteriorEsEspacio` sigue siendo true.

    i += 1;
  }

  // SPEC.propuesta §2.2 (revisión spike): NO se pasa a minúsculas.
  // Las mayúsculas se conservan; la comparación case-insensitive es
  // responsabilidad de los módulos que la necesiten (`silabeo`, `acento`).
  const textoNormalizado = construccion.map((c) => c.char).join("");

  const offsets = construccion.map((c) => c.origen);

  return { texto: textoNormalizado, offsets };
}
