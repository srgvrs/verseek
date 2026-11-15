import { describe, expect, it } from "vitest";
import { palabrasConOffsets } from "../src/palabras.js";

describe("palabrasConOffsets", () => {
  it("segmenta 'la aurora' con offsets exactos", () => {
    expect(palabrasConOffsets("la aurora")).toEqual([
      { texto: "la", inicio: 0, fin: 2 },
      { texto: "aurora", inicio: 3, fin: 9 },
    ]);
  });

  it("segmenta '¿qué tendrá la princesa?' con offsets exactos", () => {
    expect(palabrasConOffsets("¿qué tendrá la princesa?")).toEqual([
      { texto: "qué", inicio: 1, fin: 4 },
      { texto: "tendrá", inicio: 5, fin: 11 },
      { texto: "la", inicio: 12, fin: 14 },
      { texto: "princesa", inicio: 15, fin: 23 },
    ]);
  });

  it("devuelve [] para la cadena vacía", () => {
    expect(palabrasConOffsets("")).toEqual([]);
  });

  it("devuelve [] para '...'", () => {
    expect(palabrasConOffsets("...")).toEqual([]);
  });
});
