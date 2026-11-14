/**
 * Tests de `silabeo` (spike).
 *
 * Cada `it` cita la sección de `SPEC.propuesta.md` que cubre.
 * Estos tests se revisarán cuando se promueva la propuesta al SPEC real.
 */

import { describe, it, expect } from "vitest";
import { silabear } from "../src/silabeo.js";

function silabas(palabra: string): string[] {
  return silabear(palabra).map((s) => s.texto);
}

describe("silabear (SPEC.propuesta §3)", () => {
  describe("identidad (§3.1)", () => {
    it("§3.1: devuelve un array", () => {
      expect(Array.isArray(silabear("casa"))).toBe(true);
    });

    it("§3.1: concat(sílabas) === palabra (invariancia)", () => {
      const palabra = "murciélago";
      const partes = silabear(palabra);
      const reconstruido = partes.map((s) => s.texto).join("");
      expect(reconstruido).toBe(palabra);
    });

    it("§3.1: string vacío devuelve []", () => {
      expect(silabear("")).toEqual([]);
    });
  });

  describe("una consonante entre vocales (§3.5)", () => {
    it("§3.5: casa → ca-sa", () => {
      expect(silabas("casa")).toEqual(["ca", "sa"]);
    });

    it("§3.5: canto → can-to", () => {
      expect(silabas("canto")).toEqual(["can", "to"]);
    });
  });

  describe("diptongos (§3.3)", () => {
    it("§3.3: aire → ai-re", () => {
      expect(silabas("aire")).toEqual(["ai", "re"]);
    });

    it("§3.3: cielo → cie-lo", () => {
      expect(silabas("cielo")).toEqual(["cie", "lo"]);
    });

    it("§3.3: ciudad → ciu-dad", () => {
      expect(silabas("ciudad")).toEqual(["ciu", "dad"]);
    });
  });

  describe("triptongos (§3.3)", () => {
    it("§3.3: Uruguay → u-ru-guay", () => {
      expect(silabas("Uruguay").map((s) => s.toLowerCase())).toEqual(["u", "ru", "guay"]);
    });

    it("§3.3: buey → buey", () => {
      expect(silabas("buey")).toEqual(["buey"]);
    });
  });

  describe("hiatos (§3.4)", () => {
    it("§3.4: poeta → po-e-ta (abierta + abierta)", () => {
      expect(silabas("poeta")).toEqual(["po", "e", "ta"]);
    });

    it("§3.4: país → pa-ís (cerrada con tilde + abierta)", () => {
      expect(silabas("país")).toEqual(["pa", "ís"]);
    });

    it("§3.4: río → rí-o (cerrada con tilde + abierta)", () => {
      expect(silabas("río")).toEqual(["rí", "o"]);
    });

    it("§3.4: búho → bú-ho (cerrada con tilde + abierta)", () => {
      expect(silabas("búho")).toEqual(["bú", "ho"]);
    });
  });

  describe("grupos consonánticos (§3.5)", () => {
    it("§3.5: obra → o-bra (grupo inseparable br)", () => {
      expect(silabas("obra")).toEqual(["o", "bra"]);
    });

    it("§3.5: perro → pe-rro (dígrafo rr)", () => {
      expect(silabas("perro")).toEqual(["pe", "rro"]);
    });

    it("§3.5: muchacho → mu-cha-cho (dígrafo ch)", () => {
      expect(silabas("muchacho")).toEqual(["mu", "cha", "cho"]);
    });

    it("§3.5: instante → ins-tan-te (3 consonantes, cola a la siguiente)", () => {
      expect(silabas("instante")).toEqual(["ins", "tan", "te"]);
    });

    it("§3.5: atleta → at-le-ta (grupo tl separable, D2)", () => {
      expect(silabas("atleta")).toEqual(["at", "le", "ta"]);
    });
  });

  describe("gu / qu / gü (§3.5, §3.7)", () => {
    it("§3.5: queso → que-so", () => {
      expect(silabas("queso")).toEqual(["que", "so"]);
    });

    it("§3.5: guerra → gue-rra", () => {
      expect(silabas("guerra")).toEqual(["gue", "rra"]);
    });

    it("§3.7: pingüino → pin-güi-no (ü entra en diptongo)", () => {
      expect(silabas("pingüino")).toEqual(["pin", "güi", "no"]);
    });
  });

  describe("y final (§3.6)", () => {
    it("§3.6: rey → rey (y final = vocal cerrada)", () => {
      expect(silabas("rey")).toEqual(["rey"]);
    });

    it("§3.6: hoy → hoy", () => {
      expect(silabas("hoy")).toEqual(["hoy"]);
    });

    it("§3.6: mayo → ma-yo (y interna = consonante)", () => {
      expect(silabas("mayo")).toEqual(["ma", "yo"]);
    });
  });
});
