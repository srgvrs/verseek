/**
 * Cómputo métrico final de un verso (spike). Ver `SPEC.propuesta.md` §7.
 *
 * Pureza: sin estado global, sin I/O, no muta la entrada.
 *
 * Reglas (ver `SPEC.propuesta.md` §7):
 *  - §7.2 Se parte de `escansion.silabasMetricas` (ya resuelta por
 *    `resolverEscansion`) y se aplica la ley de acento final.
 *  - §7.3 Última palabra = última secuencia de letras del verso.
 *  - §7.4 Ajuste: aguda +1, esdrújula/sobresdrújula −1, llana 0.
 *  - §7.5 Monosílabo final → sin ajuste.
 *  - §7.6 Verso vacío → cómputo 0, `tipoFinal: "monosilabo"`.
 */

import { clasificarAcento, type TipoAcento } from "./acento.js";
import type { Escansion } from "./escansion.js";

export interface Computo {
  /** Nº de sílabas métricas tras aplicar la ley de acento final. */
  readonly silabasMetricas: number;
  /** Ajuste aplicado por la ley de acento final. */
  readonly ajuste: -1 | 0 | 1;
  /** Clasificación acentual de la última palabra del verso. */
  readonly tipoFinal: TipoAcento;
}

/** Devuelve la última palabra (secuencia de letras) del verso, o `""`. */
function ultimaPalabra(verso: string): string {
  let fin = -1;
  for (let i = verso.length - 1; i >= 0; i--) {
    const c = verso[i];
    if (c === undefined) continue;
    if (/^\p{L}$/u.test(c)) {
      fin = i;
      break;
    }
  }
  if (fin < 0) return "";
  let inicio = fin;
  for (let i = fin - 1; i >= 0; i--) {
    const c = verso[i];
    if (c === undefined) continue;
    if (!/^\p{L}$/u.test(c)) break;
    inicio = i;
  }
  return verso.slice(inicio, fin + 1);
}

/** Ajuste por ley de acento final (§7.4, §7.5, COM-02b). */
function ajustePorTipo(tipo: TipoAcento): -1 | 0 | 1 {
  // COM-02b: un verso que termina en monosílabo cuenta como agudo (+1),
  // sea tónico o átono.
  if (tipo === "aguda" || tipo === "monosilabo") return 1;
  if (tipo === "esdrujula" || tipo === "sobresdrujula") return -1;
  return 0;
}

/**
 * Aplica la ley de acento final sobre una escansión ya resuelta.
 */
export function computar(escansion: Escansion, verso: string): Computo {
  const palabra = ultimaPalabra(verso);
  if (palabra.length === 0) {
    return { silabasMetricas: 0, ajuste: 0, tipoFinal: "monosilabo" };
  }

  const { tipo } = clasificarAcento(palabra);
  const ajuste = ajustePorTipo(tipo);
  const silabasMetricas = escansion.silabasMetricas + ajuste;

  return { silabasMetricas, ajuste, tipoFinal: tipo };
}
