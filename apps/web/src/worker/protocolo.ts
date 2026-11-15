import type { AnalisisVerso, Eleccion } from "@verseek/motor";

/** Un verso a analizar dentro de un lote. */
export interface VersoEntrada {
  /** Identificador provisional: nº de línea (0-based). */
  readonly id: number;
  readonly texto: string;
  readonly elecciones: readonly Eleccion[];
}

/** Mensaje del hilo principal hacia el worker. */
export interface MensajeEntrada {
  readonly tipo: "analizar";
  /** Nº de secuencia creciente; el hilo principal descarta respuestas viejas. */
  readonly seq: number;
  readonly versos: readonly VersoEntrada[];
}

/** Resultado por verso: análisis completo o error aislado. */
export type VersoResultado =
  | { readonly id: number; readonly analisis: AnalisisVerso }
  | { readonly id: number; readonly error: string };

/** Mensaje del worker hacia el hilo principal. */
export interface MensajeSalida {
  readonly tipo: "resultado";
  readonly seq: number;
  readonly versos: readonly VersoResultado[];
}
