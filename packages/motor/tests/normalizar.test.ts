/**
 * Tests de `normalizar` (spike).
 *
 * Cada `it` cita la sección correspondiente de `SPEC.propuesta.md`.
 * Estos tests son parte del spike y el usuario los revisará antes de
 * promoverlos al SPEC real.
 */

import { describe, it, expect } from "vitest";
import { normalizar } from "../src/normalizar.js";

describe("normalizar (SPEC.propuesta §2)", () => {
  describe("identidad (§2.1)", () => {
    it("§2.1: devuelve un objeto con `texto` y `offsets`", () => {
      const r = normalizar("hola");
      expect(typeof r.texto).toBe("string");
      expect(Array.isArray(r.offsets)).toBe(true);
    });

    it("§2.1: sobre texto ya canónico, `texto === original`", () => {
      const r = normalizar("hola mundo");
      expect(r.texto).toBe("hola mundo");
    });

    it("§2.1: `offsets.length === texto.length`", () => {
      const r = normalizar("hola mundo");
      expect(r.offsets.length).toBe(r.texto.length);
    });
  });

  describe("mayúsculas (§2.2, revisión spike)", () => {
    it("§2.2: conserva las mayúsculas", () => {
      expect(normalizar("HOLA").texto).toBe("HOLA");
    });

    it("§2.2: conserva mayúsculas con tilde", () => {
      expect(normalizar("ÁRBOL").texto).toBe("ÁRBOL");
    });

    it("§2.2: conserva la diéresis en mayúsculas (`Ü`)", () => {
      expect(normalizar("PINGÜINO").texto).toBe("PINGÜINO");
    });
  });

  describe("puntuación (§2.3)", () => {
    it("§2.3: conserva la puntuación básica", () => {
      expect(normalizar("Hola, mundo.").texto).toBe("Hola, mundo.");
    });

    it("§2.3: conserva las comillas tipográficas y latinas", () => {
      expect(normalizar("«Hola» “Mundo”").texto).toBe("«Hola» “Mundo”");
    });

    it("§2.3: conserva guiones y rayas", () => {
      expect(normalizar("a-b – c — d").texto).toBe("a-b – c — d");
    });
  });

  describe("Unicode NFC (§2.4)", () => {
    it("§2.4: compone `e` + U+0301 en `é`", () => {
      const descompuesto = "e\u0301";
      expect(normalizar(descompuesto).texto).toBe("é");
    });

    it("§2.4: compone `u` + U+0308 en `ü`", () => {
      const descompuesto = "u\u0308";
      expect(normalizar(descompuesto).texto).toBe("ü");
    });
  });

  describe("espacios (§2.5)", () => {
    it("§2.5: NBSP (U+00A0) → espacio ASCII", () => {
      expect(normalizar("a\u00A0b").texto).toBe("a b");
    });

    it("§2.5: thin space (U+2009) → espacio ASCII", () => {
      expect(normalizar("a\u2009b").texto).toBe("a b");
    });

    it("§2.5: tabulador → espacio ASCII", () => {
      expect(normalizar("a\tb").texto).toBe("a b");
    });

    it("§2.5: dos espacios consecutivos colapsan a uno", () => {
      expect(normalizar("a   b").texto).toBe("a b");
    });

    it("§2.5: no aplica trim", () => {
      // "  hola  " → colapsa los dos espacios iniciales a uno y los dos
      // finales a uno, pero no los elimina.
      expect(normalizar("  hola  ").texto).toBe(" hola ");
    });
  });

  describe("saltos de línea (§2.6)", () => {
    it("§2.6: `\\r\\n` → `\\n`", () => {
      expect(normalizar("a\r\nb").texto).toBe("a\nb");
    });

    it("§2.6: `\\r` aislado → `\\n`", () => {
      expect(normalizar("a\rb").texto).toBe("a\nb");
    });

    it("§2.6: `\\n\\n\\n` NO se colapsa", () => {
      expect(normalizar("a\n\n\nb").texto).toBe("a\n\n\nb");
    });
  });

  describe("apóstrofos (§2.7)", () => {
    it("§2.7: `’` (U+2019) → `'` (U+0027)", () => {
      expect(normalizar("d’Artagnan").texto).toBe("d'Artagnan");
    });

    it("§2.7: `` ` `` (U+0060) → `'` (U+0027)", () => {
      expect(normalizar("a`b").texto).toBe("a'b");
    });

    it("§2.7: el apóstrofo no se elimina", () => {
      expect(normalizar("L'alma").texto).toBe("L'alma");
    });
  });

  describe("offsets (§2.1)", () => {
    it("§2.1: texto ya canónico mapea offsets[i] === i", () => {
      const r = normalizar("hola");
      expect(r.offsets).toEqual([0, 1, 2, 3]);
    });

    it("§2.1: colapso de espacios reporta el primer espacio original", () => {
      // "a   b" → "a b"; el espacio resultante viene del original índice 1.
      const r = normalizar("a   b");
      expect(r.offsets).toEqual([0, 1, 4]);
    });

    it("§2.1: `\\r\\n` reporta como origen el índice del `\\r`", () => {
      // "a\r\nb" → "a\nb"; el `\n` resultante proviene del `\r` en índice 1.
      const r = normalizar("a\r\nb");
      expect(r.offsets).toEqual([0, 1, 3]);
    });
  });

  describe("idempotencia (§2.8)", () => {
    it("§2.8: normalizar(normalizar(x).texto).texto === normalizar(x).texto", () => {
      const fuente = "  L’  ALMA\u00A0Dice:\r\n«Hola»   ";
      const primera = normalizar(fuente).texto;
      const segunda = normalizar(primera).texto;
      expect(segunda).toBe(primera);
    });
  });

  describe("caso combinado", () => {
    it("§2: texto con NBSP, apóstrofo tipográfico, `\\r\\n` y espacios dobles", () => {
      const entrada = "  L’  Alma  \r\n  Dice:\u00A0 «Hola»  ";
      const esperado = " L' Alma \n Dice: «Hola» ";
      expect(normalizar(entrada).texto).toBe(esperado);
    });
  });
});
