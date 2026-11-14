/**
 * Silabeo de una palabra en español según `SPEC.propuesta.md` §3 (spike).
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada.
 *
 * Reglas:
 *  - §3.2 abierta (`a e o á é ó`) / cerrada (`i u í ú ü`); `y` final = cerrada.
 *  - §3.3 diptongos y triptongos.
 *  - §3.4 hiatos: abierta+abierta; cerrada con tilde + abierta o cerrada.
 *  - §3.5 consonantes entre núcleos; dígrafos ch/ll/rr; gu/qu ante e/i; grupos
 *    inseparables SIL-07; tl y gn separables; 3+ consonantes se cortan por la
 *    cola; *h* muda entre vocales; sin regla de prefijos.
 *  - §3.6 `y` final vocal cerrada; `y` interna consonante.
 *  - §3.7 `güe`/`güi` diptongo.
 */

export interface Silaba {
  readonly texto: string;
  readonly inicio: number;
  readonly fin: number;
}

const ABIERTAS = new Set(["a", "e", "o", "á", "é", "ó"]);
const CERRADAS = new Set(["i", "u", "ü"]);
const CERRADAS_TONICAS = new Set(["í", "ú"]);

const DIGRAFOS_CONSONANTICOS = new Set(["ch", "ll", "rr"]);

const GRUPOS_INSEPARABLES = new Set([
  "pr", "pl", "br", "bl", "fr", "fl",
  "gr", "gl", "cr", "cl", "tr", "dr",
]);

function esVocal(c: string): boolean {
  return ABIERTAS.has(c) || CERRADAS.has(c) || CERRADAS_TONICAS.has(c);
}
function esAbierta(c: string): boolean {
  return ABIERTAS.has(c);
}
function esCerrada(c: string): boolean {
  return CERRADAS.has(c) || CERRADAS_TONICAS.has(c);
}
function esCerradaTonada(c: string): boolean {
  return CERRADAS_TONICAS.has(c);
}
function esLetra(c: string): boolean {
  return /^\p{L}$/u.test(c);
}
function esYe(c: string): boolean {
  const l = c.toLowerCase();
  return l === "y" || l === "ý";
}

/** Unidad atómica: una letra o un dígrafo. */
interface Atomico {
  readonly chars: string;
  readonly esVocal: boolean;
  readonly origenInicio: number;
  readonly origenFin: number;
}

/**
 * Divide la palabra en unidades atómicas respetando dígrafos `ch/ll/rr` y
 * agrupando `gu/qu` ante `e/i` como un solo bloque (u muda, §3.5 SIL-09).
 * `gü` NO se agrupa: la `ü` es vocal cerrada que entra en diptongo.
 */
function aAtomicos(caracteres: readonly string[]): Atomico[] {
  const out: Atomico[] = [];
  let i = 0;
  while (i < caracteres.length) {
    const a = caracteres[i] ?? "";
    const b = caracteres[i + 1] ?? "";
    const c = caracteres[i + 2] ?? "";
    const par = (a + b).toLowerCase();

    if (c !== undefined && (par === "gu" || par === "qu")) {
      const cMin = c.toLowerCase();
      if (cMin === "e" || cMin === "é" || cMin === "i" || cMin === "í") {
        out.push({ chars: a + b, esVocal: false, origenInicio: i, origenFin: i + 2 });
        i += 2;
        continue;
      }
    }

    if (DIGRAFOS_CONSONANTICOS.has(par) && b !== "") {
      out.push({ chars: a + b, esVocal: false, origenInicio: i, origenFin: i + 2 });
      i += 2;
      continue;
    }

    const lower = a.toLowerCase();
    out.push({
      chars: a,
      esVocal: esVocal(lower),
      origenInicio: i,
      origenFin: i + 1,
    });
    i += 1;
  }
  return out;
}

/** Letra "efectiva" si es atómico vocal (y final = cerrada). */
function vocalDeAtomico(a: Atomico, esUltimo: boolean): string | null {
  if (a.esVocal) return a.chars.toLowerCase();
  if (esUltimo && esYe(a.chars)) return "i"; // §3.6: y final = cerrada.
  return null;
}

function formanDiptongo(a: string, b: string): boolean {
  if (esCerradaTonada(a) || esCerradaTonada(b)) return false;
  const aA = esAbierta(a);
  const bA = esAbierta(b);
  const aC = esCerrada(a);
  const bC = esCerrada(b);
  if (aA && bA) return false;
  if ((aA && bC) || (aC && bA)) return true;
  if (aC && bC) return a !== b;
  return false;
}

/** Longitud del núcleo vocálico (en atómicos contiguos) que empieza en `inicio`. */
function longitudNucleo(atomicos: readonly Atomico[], inicio: number): number {
  const n = atomicos.length;
  const a0 = atomicos[inicio];
  if (a0 === undefined) return 0;
  const v0 = vocalDeAtomico(a0, inicio === n - 1);
  if (v0 === null) return 0;

  const a1 = atomicos[inicio + 1];
  if (a1 === undefined) return 1;
  const v1 = vocalDeAtomico(a1, inicio + 1 === n - 1);
  if (v1 === null) return 1;
  if (!formanDiptongo(v0, v1)) return 1;

  const a2 = atomicos[inicio + 2];
  if (a2 === undefined) return 2;
  const v2 = vocalDeAtomico(a2, inicio + 2 === n - 1);
  if (v2 === null) return 2;
  if (
    esCerrada(v0) &&
    esAbierta(v1) &&
    esCerrada(v2) &&
    !esCerradaTonada(v0) &&
    !esCerradaTonada(v2)
  ) {
    return 3;
  }
  return 2;
}

/** Cuántas unidades del bloque pasan a la sílaba derecha. */
function pasanADerecha(bloque: readonly Atomico[]): number {
  const n = bloque.length;
  if (n === 0) return 0;
  if (n === 1) return 1;

  const ultimo = bloque[n - 1];
  const penultimo = bloque[n - 2];
  if (ultimo === undefined || penultimo === undefined) return 0;

  const uLow = ultimo.chars.toLowerCase();
  const pLow = penultimo.chars.toLowerCase();

  // §3.5 spike: `tl` separable (D2): la `t` cierra, la `l` abre.
  if (pLow === "t" && uLow === "l") return 1;

  // §3.5: grupo inseparable SIL-07 → par final va completo.
  if (GRUPOS_INSEPARABLES.has(pLow + uLow)) return 2;

  // Raro: dígrafos misma letra al final (rr) ya están como atómico único.
  return 1;
}

export function silabear(palabra: string): readonly Silaba[] {
  if (palabra.length === 0) return [];

  // §3.1 spike: sólo la primera palabra (cortamos en el primer no-letra).
  let finPalabra = palabra.length;
  for (let i = 0; i < palabra.length; i++) {
    const c = palabra[i];
    if (c === undefined) continue;
    if (!esLetra(c)) { finPalabra = i; break; }
  }
  if (finPalabra === 0) return [];

  const caracteres = Array.from(palabra.slice(0, finPalabra));
  const atomicos = aAtomicos(caracteres);
  const n = atomicos.length;
  if (n === 0) return [];

  interface Nucleo { readonly inicio: number; readonly fin: number; }
  const nucleos: Nucleo[] = [];
  let i = 0;
  while (i < n) {
    const at = atomicos[i];
    if (at === undefined) { i += 1; continue; }
    const v = vocalDeAtomico(at, i === n - 1);
    if (v !== null) {
      const longitud = longitudNucleo(atomicos, i);
      nucleos.push({ inicio: i, fin: i + longitud });
      i += longitud;
    } else {
      i += 1;
    }
  }

  if (nucleos.length === 0) {
    const ultimo = atomicos[n - 1];
    const finOrig = ultimo?.origenFin ?? palabra.length;
    return [{ texto: caracteres.join(""), inicio: 0, fin: finOrig }];
  }

  const cortes: number[] = [];
  for (let kk = 0; kk < nucleos.length - 1; kk++) {
    const actual = nucleos[kk];
    const siguiente = nucleos[kk + 1];
    if (actual === undefined || siguiente === undefined) continue;
    const bloque = atomicos.slice(actual.fin, siguiente.inicio);
    const pasan = pasanADerecha(bloque);
    cortes.push(siguiente.inicio - pasan);
  }
  cortes.push(n);

  const silabas: Silaba[] = [];
  let inicioAtomico = 0;
  for (const corte of cortes) {
    const inicioAt = atomicos[inicioAtomico];
    const finAt = atomicos[corte - 1];
    const inicioOrig = inicioAt?.origenInicio ?? 0;
    const finOrig = finAt?.origenFin ?? inicioOrig;
    silabas.push({
      texto: caracteres.slice(inicioOrig, finOrig).join(""),
      inicio: inicioOrig,
      fin: finOrig,
    });
    inicioAtomico = corte;
  }
  return silabas;
}
