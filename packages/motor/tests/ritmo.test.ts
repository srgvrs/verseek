import { describe, expect, it } from "vitest";
import corpus from "./corpus/versos.json";
import { resolverEscansion } from "../src/escansion.js";
import { analizarRitmo, unidadesMetricas } from "../src/ritmo.js";

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

  it("'la aurora' sin sinalefa: tónica en 3 → trocaico (una sola tónica)", () => {
    const esc = resolverEscansion("la aurora", [
      { tipo: "sinalefa", palabraA: 0, palabraB: 1, valor: "no-aplicar" },
    ]);
    const r = analizarRitmo(esc, "la aurora");
    // Unidades: [la] [au] [ro] [ra] → tónica en 3 (ro).
    expect(r.patron).toEqual(["a", "a", "T", "a"]);
    expect(r.posicionesTonicas).toEqual([3]);
    // Una sola tónica (deltas vacío): paridad de la última tónica (3, impar)
    // → trocaico, con confianza baja.
    expect(r.etiqueta).toBe("trocaico");
    expect(r.confianza).toBe(0.4);
  });

  it("'la aurora' con sinalefa: tónica en 2 → yambico (una sola tónica)", () => {
    const esc = resolverEscansion("la aurora", [
      { tipo: "sinalefa", palabraA: 0, palabraB: 1, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "la aurora");
    // Unidades: [la‿au] [ro] [ra] → tónica en 2 (ro).
    expect(r.patron).toEqual(["a", "T", "a"]);
    expect(r.posicionesTonicas).toEqual([2]);
    // Una sola tónica (deltas vacío): paridad de la última tónica (2, par)
    // → yambico, con confianza baja.
    expect(r.etiqueta).toBe("yambico");
    expect(r.confianza).toBe(0.4);
  });

  it("'la aurora' sin elecciones: 'ro' queda en posición 2 (sinalefa por defecto)", () => {
    const esc = resolverEscansion("la aurora", []);
    const r = analizarRitmo(esc, "la aurora");
    // Unidades: [la‿au] [ro] [ra] → tónica en 2 (ro).
    expect(r.posicionesTonicas).toEqual([2]);
  });

  it("'la aurora' con sinalefa no-aplicar: 'ro' queda en posición 3", () => {
    const esc = resolverEscansion("la aurora", [
      { tipo: "sinalefa", palabraA: 0, palabraB: 1, valor: "no-aplicar" },
    ]);
    const r = analizarRitmo(esc, "la aurora");
    // Unidades: [la] [au] [ro] [ra] → tónica en 3 (ro).
    expect(r.posicionesTonicas).toEqual([3]);
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

  it.each(corpus)(
    "invariante: unidadesMetricas.length === silabasMetricas ($id)",
    (v) => {
      const esc = resolverEscansion(v.texto, v.elecciones as any);
      const unidades = unidadesMetricas(esc, v.texto);
      expect(unidades.length).toBe(esc.silabasMetricas);
    },
  );

  it("OVR-05: sinéresis en 'Faetón' → fae-tón, tónica en la 2", () => {
    const esc = resolverEscansion("Faetón", [
      { tipo: "sineresis", palabraA: 0, palabraB: 0, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "Faetón");
    // Sin sinéresis: Fa-e-tón (3 sílabas). Con sinéresis: Fae-tón (2).
    expect(esc.silabasMetricas).toBe(2);
    expect(r.posicionesTonicas).toEqual([2]);
  });

  it("OVR-05: diéresis en 'fluir' → flu-ir, tónica en la 2", () => {
    const esc = resolverEscansion("fluir", [
      { tipo: "dieresis", palabraA: 0, palabraB: 0, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "fluir");
    // Sin diéresis: fluir (1 sílaba). Con diéresis: flu-ir (2).
    expect(esc.silabasMetricas).toBe(2);
    expect(r.posicionesTonicas).toEqual([2]);
  });

  it("OVR-05: diéresis en 'süave' → sü-a-ve, tónica en la 2", () => {
    const esc = resolverEscansion("süave", [
      { tipo: "dieresis", palabraA: 0, palabraB: 0, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "süave");
    // Sin diéresis: süa-ve (2 sílabas). Con diéresis: sü-a-ve (3).
    expect(esc.silabasMetricas).toBe(3);
    expect(r.posicionesTonicas).toEqual([2]);
  });

  it("OVR-05: sinéresis en 'aérea' → aé-rea, tónica en la 2", () => {
    const esc = resolverEscansion("aérea", [
      { tipo: "sineresis", palabraA: 0, palabraB: 0, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "aérea");
    // Sin sinéresis: a-é-re-a (4 sílabas). Con sinéresis en re-a: a-é-rea (3).
    expect(esc.silabasMetricas).toBe(3);
    expect(r.posicionesTonicas).toEqual([2]);
  });

  it("coherencia: cada T de patron aparece en posicionesTonicas", () => {
    const casos = [
      "la aurora",
      "y en aérea fantástica danza",
      "como afrentas las estrellas una a una",
    ];
    for (const v of casos) {
      const esc = resolverEscansion(v, []);
      const r = analizarRitmo(esc, v);
      for (let i = 0; i < r.patron.length; i++) {
        if (r.patron[i] === "T") {
          expect(r.posicionesTonicas).toContain(i + 1);
        }
      }
      // Toda posición tónica cae dentro del patrón.
      for (const p of r.posicionesTonicas) {
        expect(p).toBeGreaterThanOrEqual(1);
        expect(p).toBeLessThanOrEqual(r.patron.length);
      }
    }
  });

  it("ACE-05b: 'dime lo que' — 'que' final sigue tónico", () => {
    const esc = resolverEscansion("dime lo que", []);
    const r = analizarRitmo(esc, "dime lo que");
    // di-me lo que → tónicas en 1 (di) y 4 (que, por ACE-05b).
    expect(r.posicionesTonicas).toEqual([1, 4]);
  });

  it("ACE-05b: 'que dime lo' — 'que' inicial átono, 'lo' final tónico", () => {
    const esc = resolverEscansion("que dime lo", []);
    const r = analizarRitmo(esc, "que dime lo");
    // que di-me lo → tónicas en 2 (di) y 4 (lo, por ACE-05b).
    expect(r.posicionesTonicas).toEqual([2, 4]);
  });

  it("ACE-06: 'y las horas se van pausadamente' — dos tónicas en el adverbio", () => {
    const esc = resolverEscansion("y las horas se van pausadamente", []);
    const r = analizarRitmo(esc, "y las horas se van pausadamente");
    // y las ho-ras se van pau-sa-da-men-te
    // tónicas: ho (3), ra (6), da (8, base) y men (10, ACE-06).
    expect(r.posicionesTonicas).toEqual([3, 6, 8, 10]);
  });

  it("ACE-06: 'lentamente' — tónicas en la base y en 'men'", () => {
    const esc = resolverEscansion("lentamente", []);
    const r = analizarRitmo(esc, "lentamente");
    // len-ta-men-te → tónicas en 1 (len, base) y 3 (men, ACE-06).
    expect(r.posicionesTonicas).toEqual([1, 3]);
  });

  it("ACE-06: 'demente' — no duplica la tónica de 'men'", () => {
    const esc = resolverEscansion("demente", []);
    const r = analizarRitmo(esc, "demente");
    // de-men-te → tónica en 2 (men). La base "de" no aporta tónica extra
    // y la penúltima ya es "men", así que no se duplica.
    expect(r.posicionesTonicas).toEqual([2]);
  });

  it("OVR-06: 'casa blanca' sin elecciones → [1, 3]", () => {
    const esc = resolverEscansion("casa blanca", []);
    const r = analizarRitmo(esc, "casa blanca");
    expect(r.posicionesTonicas).toEqual([1, 3]);
  });

  it("OVR-06: 'casa blanca' acento aplicar (0, 1) → [1, 2, 3]", () => {
    const esc = resolverEscansion("casa blanca", [
      { tipo: "acento", palabraA: 0, palabraB: 0, silaba: 1, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "casa blanca");
    expect(r.posicionesTonicas).toEqual([1, 2, 3]);
  });

  it("OVR-06: 'casa blanca' acento no-aplicar (0, 0) → [3]", () => {
    const esc = resolverEscansion("casa blanca", [
      { tipo: "acento", palabraA: 0, palabraB: 0, silaba: 0, valor: "no-aplicar" },
    ]);
    const r = analizarRitmo(esc, "casa blanca");
    expect(r.posicionesTonicas).toEqual([3]);
  });

  it("OVR-06: 'casa blanca' mover tónica (0,0) no-aplicar + (0,1) aplicar → [2, 3]", () => {
    const esc = resolverEscansion("casa blanca", [
      { tipo: "acento", palabraA: 0, palabraB: 0, silaba: 0, valor: "no-aplicar" },
      { tipo: "acento", palabraA: 0, palabraB: 0, silaba: 1, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "casa blanca");
    expect(r.posicionesTonicas).toEqual([2, 3]);
  });

  it("OVR-06: 'en un intenso pálido llamar' acento aplicar (1, 0) → [2, 4, 6, 10]", () => {
    const esc = resolverEscansion("en un intenso pálido llamar", [
      { tipo: "acento", palabraA: 1, palabraB: 1, silaba: 0, valor: "aplicar" },
    ]);
    const r = analizarRitmo(esc, "en un intenso pálido llamar");
    expect(r.posicionesTonicas).toEqual([2, 4, 6, 10]);
  });

  it("OVR-06: elecciones huérfanas (palabra 9 y sílaba 5) no cambian el patrón", () => {
    const huerfanaSilaba: Eleccion = {
      tipo: "acento",
      palabraA: 0,
      palabraB: 0,
      silaba: 5,
      valor: "aplicar",
    };
    const huerfanaPalabra: Eleccion = {
      tipo: "acento",
      palabraA: 9,
      palabraB: 9,
      silaba: 0,
      valor: "aplicar",
    };
    const esc = resolverEscansion("casa blanca", [huerfanaSilaba, huerfanaPalabra]);
    expect(esc.eleccionesHuerfanas).toEqual([huerfanaSilaba, huerfanaPalabra]);
    expect(esc.eleccionesAplicadas).toEqual([]);
    const r = analizarRitmo(esc, "casa blanca");
    expect(r.posicionesTonicas).toEqual([1, 3]);
  });
});
