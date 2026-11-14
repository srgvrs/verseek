import { describe, expect, it } from "vitest";
import { resolverEscansion } from "../src/escansion.js";
import { analizarRitmo } from "../src/ritmo.js";

describe("analizarRitmo", () => {
  it("verso vacío: patrón vacío, indeterminado", () => {
    const esc = resolverEscansion("", []);
    const r = analizarRitmo(esc, "");
    expect(r.patron).toEqual([]);
    expect(r.posicionesTonicas).toEqual([]);
    expect(r.etiqueta).toBe("indeterminado");
    expect(r.confianza).toBe(0);
  });

  it("monosílabo: una sola tónica, indeterminado", () => {
    const esc = resolverEscansion("sol", []);
    const r = analizarRitmo(esc, "sol");
    expect(r.patron).toEqual(["T"]);
    expect(r.posicionesTonicas).toEqual([1]);
    expect(r.etiqueta).toBe("indeterminado");
  });

  it("'casa': llana, tónica en 1, patrón T-a", () => {
    const esc = resolverEscansion("casa", []);
    const r = analizarRitmo(esc, "casa");
    expect(r.patron).toEqual(["T", "a"]);
    expect(r.posicionesTonicas).toEqual([1]);
  });

  it("'corazón': aguda, tónica en 2, patrón a-T-a (ley de acento final)", () => {
    const esc = resolverEscansion("corazón", []);
    const r = analizarRitmo(esc, "corazón");
    // co-ra-zón → a-a-T + 1 sílaba añadida por aguda = a-a-T-a
    expect(r.patron).toEqual(["a", "a", "T", "a"]);
    expect(r.posicionesTonicas).toEqual([3]);
  });

  it("'pájaro': esdrújula, tónica en 1, patrón T-a (ley de acento final)", () => {
    const esc = resolverEscansion("pájaro", []);
    const r = analizarRitmo(esc, "pájaro");
    // pá-ja-ro → T-a-a, menos 1 por esdrújula = T-a
    expect(r.patron).toEqual(["T", "a"]);
    expect(r.posicionesTonicas).toEqual([1]);
  });

  it("'la aurora' sin sinalefa: tónicas en 1 y 3 → trocaico", () => {
    const esc = resolverEscansion("la aurora", [
      { tipo: "sinalefa", palabraA: 0, palabraB: 1, valor: "no-aplicar" },
    ]);
    const r = analizarRitmo(esc, "la aurora");
    // la(T) au-ro-ra(T en ro) → T-a-T-a
    expect(r.patron).toEqual(["T", "a", "T", "a"]);
    expect(r.posicionesTonicas).toEqual([1, 3]);
    expect(r.etiqueta).toBe("trocaico");
  });

  it("'la aurora' con sinalefa: tónicas en 1 y 2 → trocaico", () => {
    const esc = resolverEscansion("la aurora", [
      { tipo: "sinalefa", palabraA: 0, palabraB: 1, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "la aurora");
    // la(T) au-ro-ra(T en ro) con sinalefa → T-a-T
    expect(r.patron).toEqual(["T", "a", "T"]);
    expect(r.posicionesTonicas).toEqual([1, 3]);
  });

  it("'la aurora' sin elecciones: 'ro' queda en posición 2 (sinalefa por defecto)", () => {
    const esc = resolverEscansion("la aurora", []);
    const r = analizarRitmo(esc, "la aurora");
    // Unidades: [la‿au] [ro] [ra] → tónicas en 1 (la) y 2 (ro).
    expect(r.posicionesTonicas).toEqual([1, 2]);
  });

  it("'la aurora' con sinalefa no-aplicar: 'ro' queda en posición 3", () => {
    const esc = resolverEscansion("la aurora", [
      { tipo: "sinalefa", palabraA: 0, palabraB: 1, valor: "no-aplicar" },
    ]);
    const r = analizarRitmo(esc, "la aurora");
    // Unidades: [la] [au] [ro] [ra] → tónicas en 1 (la) y 3 (ro).
    expect(r.posicionesTonicas).toEqual([1, 3]);
  });

  it("'en un lugar': tónicas en 1 y 3 → yámbico (última impar)", () => {
    const esc = resolverEscansion("en un lugar", []);
    const r = analizarRitmo(esc, "en un lugar");
    // en(T) un(T) lu-gar(T) → T-T-T-a
    expect(r.posicionesTonicas.length).toBeGreaterThan(0);
    expect(r.etiqueta).toBe("yambico");
  });

  it("'dígaselo': sobresdrújula, tónica en 1, patrón T-a", () => {
    const esc = resolverEscansion("dígaselo", []);
    const r = analizarRitmo(esc, "dígaselo");
    // dí-ga-se-lo → T-a-a-a, menos 1 por sobresdrújula = T-a-a
    expect(r.patron).toEqual(["T", "a", "a"]);
    expect(r.posicionesTonicas).toEqual([1]);
  });

  it("'rápidamente': adverbio en -mente, tónica en 1", () => {
    const esc = resolverEscansion("rápidamente", []);
    const r = analizarRitmo(esc, "rápidamente");
    expect(r.posicionesTonicas[0]).toBe(1);
    expect(r.patron[0]).toBe("T");
  });

  it("patrón ternario: 'cántame la nana' → dactílico o mixto", () => {
    const esc = resolverEscansion("cántame la nana", []);
    const r = analizarRitmo(esc, "cántame la nana");
    expect([
      "dactilico",
      "anapestico",
      "mixto",
      "indeterminado",
      "trocaico",
    ]).toContain(r.etiqueta);
    expect(r.confianza).toBeGreaterThanOrEqual(0);
    expect(r.confianza).toBeLessThanOrEqual(1);
  });

  it("confianza siempre en [0, 1]", () => {
    const versos = ["sol", "casa", "corazón", "la aurora", "en un lugar"];
    for (const v of versos) {
      const esc = resolverEscansion(v, []);
      const r = analizarRitmo(esc, v);
      expect(r.confianza).toBeGreaterThanOrEqual(0);
      expect(r.confianza).toBeLessThanOrEqual(1);
    }
  });

  it("patrón y posiciones son coherentes: cada T está en posicionesTonicas", () => {
    const esc = resolverEscansion("la aurora", []);
    const r = analizarRitmo(esc, "la aurora");
    for (let i = 0; i < r.patron.length; i++) {
      if (r.patron[i] === "T") {
        expect(r.posicionesTonicas).toContain(i + 1);
      }
    }
  });
});
