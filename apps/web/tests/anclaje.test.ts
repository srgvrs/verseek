import { describe, expect, it } from "vitest";
import type { Eleccion } from "@verseek/motor";
import { reubicarElecciones } from "../src/anclaje.js";

const ELECCION: Eleccion = {
  tipo: "sinalefa",
  palabraA: 0,
  palabraB: 1,
  valor: "aplicar",
};

function mapa(
  entradas: readonly (readonly [number, Eleccion[]])[],
): Map<number, Eleccion[]> {
  return new Map(entradas.map(([k, v]) => [k, [...v]]));
}

function claves(m: ReadonlyMap<number, Eleccion[]>): number[] {
  return [...m.keys()].sort((a, b) => a - b);
}

describe("OVR-02: reubicarElecciones", () => {
  it("OVR-02: sin cambios devuelve una copia igual al mapa de entrada", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [2, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, []);
    expect(salida).not.toBe(entrada);
    expect(salida).toEqual(entrada);
  });

  it("OVR-02: un cambio con borradas 0 e insertadas 0 no altera el mapa", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, [ELECCION]],
      [3, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, [
      { desde: 1, borradas: 0, insertadas: 0 },
    ]);
    expect(salida).toEqual(entrada);
  });

  it("OVR-02: insertar 1 salto en la línea 0 desplaza las siguientes", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, [ELECCION]],
      [3, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, [
      { desde: 0, borradas: 0, insertadas: 1 },
    ]);
    expect(claves(salida)).toEqual([0, 2, 4]);
    expect(salida.get(0)).toEqual([ELECCION]);
    expect(salida.get(2)).toEqual([ELECCION]);
    expect(salida.get(4)).toEqual([ELECCION]);
  });

  it("OVR-02: insertar 2 saltos en la línea 1 desplaza las siguientes", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, [ELECCION]],
      [2, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, [
      { desde: 1, borradas: 0, insertadas: 2 },
    ]);
    expect(claves(salida)).toEqual([0, 1, 4]);
    expect(salida.get(0)).toEqual([ELECCION]);
    expect(salida.get(1)).toEqual([ELECCION]);
    expect(salida.get(4)).toEqual([ELECCION]);
  });

  it("OVR-02: borrar 1 salto en la línea 0 descarta la línea 1 y desplaza", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, [ELECCION]],
      [2, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, [
      { desde: 0, borradas: 1, insertadas: 0 },
    ]);
    expect(claves(salida)).toEqual([0, 1]);
    expect(salida.get(0)).toEqual([ELECCION]);
    expect(salida.get(1)).toEqual([ELECCION]);
    expect(salida.has(2)).toBe(false);
  });

  it("OVR-02: borrar 2 saltos en la línea 1 descarta 2 y 3 y desplaza la 4", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, [ELECCION]],
      [2, [ELECCION]],
      [3, [ELECCION]],
      [4, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, [
      { desde: 1, borradas: 2, insertadas: 0 },
    ]);
    expect(claves(salida)).toEqual([0, 1, 2]);
    expect(salida.get(0)).toEqual([ELECCION]);
    expect(salida.get(1)).toEqual([ELECCION]);
    expect(salida.get(2)).toEqual([ELECCION]);
  });

  it("OVR-02: reemplazo (borradas 1, insertadas 1) equivale a borrar y luego insertar", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, [ELECCION]],
      [2, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, [
      { desde: 0, borradas: 1, insertadas: 1 },
    ]);
    // La línea 0 conserva sus elecciones; la 1 se descarta; la 2 se queda en 2.
    expect(claves(salida)).toEqual([0, 2]);
    expect(salida.get(0)).toEqual([ELECCION]);
    expect(salida.get(2)).toEqual([ELECCION]);
    expect(salida.has(1)).toBe(false);
  });

  it("OVR-02: varios cambios se aplican secuencialmente", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, [ELECCION]],
      [2, [ELECCION]],
      [3, [ELECCION]],
    ]);
    // Primero insertamos 1 salto en 0: 0→0, 1→2, 2→3, 3→4.
    // Luego borramos 1 salto en 2 (fusiona 2 y 3): 0→0, 2→2, 3 se descarta, 4→3.
    const salida = reubicarElecciones(entrada, [
      { desde: 0, borradas: 0, insertadas: 1 },
      { desde: 2, borradas: 1, insertadas: 0 },
    ]);
    expect(claves(salida)).toEqual([0, 2, 3]);
    expect(salida.get(0)).toEqual([ELECCION]);
    expect(salida.get(2)).toEqual([ELECCION]);
    expect(salida.get(3)).toEqual([ELECCION]);
  });

  it("OVR-02: las listas vacías de elecciones no aparecen en el resultado", () => {
    const entrada = mapa([
      [0, [ELECCION]],
      [1, []],
      [2, [ELECCION]],
    ]);
    const salida = reubicarElecciones(entrada, []);
    for (const [, lista] of salida) {
      expect(lista.length).toBeGreaterThan(0);
    }
    expect(salida.has(1)).toBe(false);
  });

  it("OVR-02: no muta el mapa de entrada", () => {
    const lista0 = [ELECCION];
    const lista1 = [ELECCION];
    const entrada = new Map<number, Eleccion[]>([
      [0, lista0],
      [1, lista1],
    ]);
    const clavesAntes = claves(entrada);
    const tamanoAntes = entrada.size;

    reubicarElecciones(entrada, [
      { desde: 0, borradas: 0, insertadas: 1 },
    ]);

    expect(claves(entrada)).toEqual(clavesAntes);
    expect(entrada.size).toBe(tamanoAntes);
    expect(entrada.get(0)).toBe(lista0);
    expect(entrada.get(1)).toBe(lista1);
    expect(lista0).toEqual([ELECCION]);
    expect(lista1).toEqual([ELECCION]);
  });
});
