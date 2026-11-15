/**
 * Segmentación de un verso en palabras (spike).
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada.
 *
 * Regla única compartida por `ritmo`, `escansion` y `licencias`: una palabra
 * es una secuencia maximal de letras Unicode (`\p{L}`). `inicio` y `fin` son
 * índices del string original del verso; `fin` es exclusivo.
 */

export interface PalabraConOffsets {
  readonly texto: string;
  readonly inicio: number;
  readonly fin: number;
}

/**
 * Devuelve las palabras del verso con sus offsets sobre el string original.
 *
 * Se itera con `for (const c of verso)` para respetar pares subrogados
 * (code points), pero los offsets se calculan sobre unidades UTF-16 del
 * string, de modo que `verso.slice(inicio, fin) === texto`.
 */
export function palabrasConOffsets(verso: string): PalabraConOffsets[] {
  const out: PalabraConOffsets[] = [];
  let inicio = -1;
  let offset = 0;
  for (const c of verso) {
    const esLetra = /^\p{L}$/u.test(c);
    if (esLetra) {
      if (inicio < 0) inicio = offset;
    } else if (inicio >= 0) {
      out.push({ texto: verso.slice(inicio, offset), inicio, fin: offset });
      inicio = -1;
    }
    offset += c.length;
  }
  if (inicio >= 0) {
    out.push({ texto: verso.slice(inicio, offset), inicio, fin: offset });
  }
  return out;
}
