import type { Eleccion } from "@verseek/motor";

/**
 * §OVR-02: cambio de líneas en el documento. `desde` es la línea (base 0) donde
 * ocurre el cambio; `borradas` son los saltos eliminados a partir de `desde + 1`;
 * `insertadas` son los saltos nuevos insertados tras `desde`.
 */
export interface CambioLineas {
  readonly desde: number;
  readonly borradas: number;
  readonly insertadas: number;
}

/**
 * §OVR-02: reubica las elecciones ancladas a líneas tras una serie de cambios.
 *
 * Cada cambio se aplica sobre el resultado del anterior. Para un cambio:
 * 1. Borrar `borradas` saltos en `desde`: la línea `desde` conserva las suyas;
 *    las de `desde+1 .. desde+borradas` se descartan; las posteriores bajan
 *    `borradas`.
 * 2. Insertar `insertadas` saltos en `desde`: la línea `desde` conserva las
 *    suyas; las posteriores (> `desde`) suben `insertadas`.
 *
 * No muta la entrada. Las listas vacías no aparecen en el resultado.
 */
export function reubicarElecciones(
  mapa: ReadonlyMap<number, Eleccion[]>,
  cambios: readonly CambioLineas[],
): Map<number, Eleccion[]> {
  let actual = copiarSinVacias(mapa);

  for (const cambio of cambios) {
    const { desde, borradas, insertadas } = cambio;
    if (borradas === 0 && insertadas === 0) continue;

    const siguiente = new Map<number, Eleccion[]>();

    for (const [linea, elecciones] of actual) {
      if (elecciones.length === 0) continue;

      // Línea descartada por el borrado.
      if (borradas > 0 && linea > desde && linea <= desde + borradas) {
        continue;
      }

      let nueva = linea;
      if (borradas > 0 && linea > desde + borradas) {
        nueva -= borradas;
      }
      if (insertadas > 0 && nueva > desde) {
        nueva += insertadas;
      }

      siguiente.set(nueva, [...elecciones]);
    }

    actual = siguiente;
  }

  return actual;
}

function copiarSinVacias(
  mapa: ReadonlyMap<number, Eleccion[]>,
): Map<number, Eleccion[]> {
  const out = new Map<number, Eleccion[]>();
  for (const [linea, elecciones] of mapa) {
    if (elecciones.length === 0) continue;
    out.set(linea, [...elecciones]);
  }
  return out;
}
