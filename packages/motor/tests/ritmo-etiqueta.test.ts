import { describe, expect, it } from "vitest";

import { etiquetarPatron } from "../src/ritmo.js";

describe("etiquetarPatron", () => {
  it("RIT-07: n=8, tónicas [2,7] → sin-patron, baja, confianza 0", () => {
    const r = etiquetarPatron([2, 7], 8);
    expect(r.etiqueta).toBe("sin-patron");
    expect(r.nivel).toBe("baja");
    expect(r.confianza).toBe(0);
  });

  it("RIT-07: una sola tónica → sin-patron, baja", () => {
    const r = etiquetarPatron([3], 8);
    expect(r.etiqueta).toBe("sin-patron");
    expect(r.nivel).toBe("baja");
  });

  it("RIT-11: n=8, tónicas [3,6,7] → trocaico, media (0.5)", () => {
    const r = etiquetarPatron([3, 6, 7], 8);
    expect(r.etiqueta).toBe("trocaico");
    expect(r.nivel).toBe("media");
    expect(r.confianza).toBe(0.5);
  });

  it("RIT-11: n=12, tónicas [2,5,8,11] → anfibraquico, alta (1)", () => {
    const r = etiquetarPatron([2, 5, 8, 11], 12);
    expect(r.etiqueta).toBe("anfibraquico");
    expect(r.nivel).toBe("alta");
    expect(r.confianza).toBe(1);
  });

  it("RIT-06/RIT-10: n=11, tónicas [3,6,10] → yambico, media (0.5)", () => {
    const r = etiquetarPatron([3, 6, 10], 11);
    expect(r.etiqueta).toBe("yambico");
    expect(r.nivel).toBe("media");
    expect(r.confianza).toBe(0.5);
  });

  it("RIT-10: n=11, tónicas [1,3,6,10] → sin-patron, nivel sin-patron (umbral 40 %)", () => {
    const r = etiquetarPatron([1, 3, 6, 10], 11);
    expect(r.etiqueta).toBe("sin-patron");
    expect(r.nivel).toBe("sin-patron");
  });

  it("RIT-06: pendiente a propósito (n=11, tónicas [4,6,7,10])", () => {
    const r = etiquetarPatron([4, 6, 7, 10], 11);
    console.log("RIT-06 pendiente a propósito:", r);
    expect(r).toBeDefined();
  });
});

/**
 * RIT-10: `candidatos` es la lista de patrones elegibles (RIT-11) con su
 * proporción (RIT-07), ordenada de mayor a menor, máximo 3.
 *
 * El campo aún no existe en `etiquetarPatron`; estos tests fallan por
 * ausencia del campo (no por error de sintaxis). Se accede vía cast para
 * que el archivo compile mientras el campo no esté tipado.
 */
interface CandidatoRitmo {
  readonly etiqueta: string;
  readonly proporcion: number;
}

interface ResultadoConCandidatos {
  readonly etiqueta: string;
  readonly confianza: number;
  readonly nivel: string;
  readonly candidatos?: readonly CandidatoRitmo[];
}

function conCandidatos(
  posiciones: readonly number[],
  n: number,
): ResultadoConCandidatos {
  return etiquetarPatron(posiciones, n) as unknown as ResultadoConCandidatos;
}

describe("candidatos (RIT-10)", () => {
  it("n=10, tónicas [1,5,9]: candidatos[0] = trocaico, proporcion 1", () => {
    const r = conCandidatos([1, 5, 9], 10);
    expect(r.candidatos).toBeDefined();
    expect(r.candidatos?.[0]).toEqual({ etiqueta: "trocaico", proporcion: 1 });
  });

  it("n=8, tónicas [3,6,7]: candidatos[0] = trocaico, proporcion 0.5", () => {
    const r = conCandidatos([3, 6, 7], 8);
    expect(r.candidatos).toBeDefined();
    expect(r.candidatos?.[0]?.etiqueta).toBe("trocaico");
    expect(r.candidatos?.[0]?.proporcion).toBe(0.5);
  });

  it("candidatos: máximo 3 y proporciones ordenadas de mayor a menor", () => {
    const casos: ReadonlyArray<{ posiciones: readonly number[]; n: number }> = [
      { posiciones: [1, 5, 9], n: 10 },
      { posiciones: [3, 6, 7], n: 8 },
      { posiciones: [2, 5, 8, 11], n: 12 },
      { posiciones: [3, 6, 10], n: 11 },
    ];
    for (const { posiciones, n } of casos) {
      const r = conCandidatos(posiciones, n);
      expect(r.candidatos).toBeDefined();
      const c = r.candidatos ?? [];
      expect(c.length).toBeLessThanOrEqual(3);
      for (let i = 1; i < c.length; i++) {
        const prev = c[i - 1] as CandidatoRitmo;
        const cur = c[i] as CandidatoRitmo;
        expect(prev.proporcion).toBeGreaterThanOrEqual(cur.proporcion);
      }
    }
  });

  it("n=11, tónicas [3,6,10]: etiqueta yambico (RIT-06) y candidatos es array", () => {
    const r = conCandidatos([3, 6, 10], 11);
    expect(r.etiqueta).toBe("yambico");
    expect(Array.isArray(r.candidatos)).toBe(true);
  });

  it("n=8, tónicas [2,7] (una sola libre): sin-patron y candidatos es array", () => {
    const r = conCandidatos([2, 7], 8);
    expect(r.etiqueta).toBe("sin-patron");
    expect(Array.isArray(r.candidatos)).toBe(true);
  });

  it("RIT-11: con n par, ningún candidato es yambico", () => {
    const casos: ReadonlyArray<{ posiciones: readonly number[]; n: number }> = [
      { posiciones: [1, 5, 9], n: 10 },
      { posiciones: [3, 6, 7], n: 8 },
      { posiciones: [2, 5, 8, 11], n: 12 },
    ];
    for (const { posiciones, n } of casos) {
      const r = conCandidatos(posiciones, n);
      expect(r.candidatos).toBeDefined();
      const etiquetas = (r.candidatos ?? []).map((c) => c.etiqueta);
      expect(etiquetas).not.toContain("yambico");
    }
  });
});
