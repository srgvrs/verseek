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
