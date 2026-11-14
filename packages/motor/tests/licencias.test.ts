import { describe, expect, it } from "vitest";
import { detectarCandidatos } from "../src/licencias.js";

describe("detectarCandidatos", () => {
  it("sinalefa simple: 'la aurora' → sinalefa + hiato", () => {
    const cs = detectarCandidatos("la aurora");
    const tipos = cs.map((c) => c.tipo);
    expect(tipos).toContain("sinalefa");
    expect(tipos).toContain("hiato");
    const sin = cs.find((c) => c.tipo === "sinalefa");
    expect(sin?.silabasSin).toBe(4); // la + au-ro-ra
    expect(sin?.silabasCon).toBe(3);
  });

  it("sinalefa con h muda inicial: 'mi hermano' → sinalefa", () => {
    const cs = detectarCandidatos("mi hermano");
    const sin = cs.find((c) => c.tipo === "sinalefa");
    expect(sin).toBeDefined();
    expect(sin?.silabaB).toBe("her");
  });

  it("sin sinalefa si la segunda palabra empieza por consonante: 'la casa'", () => {
    const cs = detectarCandidatos("la casa");
    expect(cs.find((c) => c.tipo === "sinalefa")).toBeUndefined();
  });

  it("sin sinalefa si la primera palabra termina en consonante: 'sol ardiente'", () => {
    const cs = detectarCandidatos("sol ardiente");
    expect(cs.find((c) => c.tipo === "sinalefa")).toBeUndefined();
  });

  it("LIC-05: la puntuación no bloquea la sinalefa", () => {
    const cs = detectarCandidatos("la, aurora");
    expect(cs.find((c) => c.tipo === "sinalefa")).toBeDefined();
  });

  it("sinalefa entre vocales cerradas: 'su hijo'", () => {
    const cs = detectarCandidatos("su hijo");
    expect(cs.find((c) => c.tipo === "sinalefa")).toBeDefined();
  });

  it("sinéresis intra-palabra: 'poeta' → sineresis", () => {
    const cs = detectarCandidatos("poeta");
    const sin = cs.find((c) => c.tipo === "sineresis");
    expect(sin).toBeDefined();
    expect(sin?.silabasSin).toBe(3); // po-e-ta
    expect(sin?.silabasCon).toBe(2);
  });

  it("sinéresis intra-palabra: 'ahora' → sineresis", () => {
    const cs = detectarCandidatos("ahora");
    expect(cs.find((c) => c.tipo === "sineresis")).toBeDefined();
  });

  it("diéresis intra-palabra: 'cielo' → dieresis", () => {
    const cs = detectarCandidatos("cielo");
    const d = cs.find((c) => c.tipo === "dieresis");
    expect(d).toBeDefined();
    expect(d?.silabasSin).toBe(2); // cie-lo
    expect(d?.silabasCon).toBe(3);
  });

  it("diéresis intra-palabra: 'ruiseñor' → dieresis", () => {
    const cs = detectarCandidatos("ruiseñor");
    expect(cs.find((c) => c.tipo === "dieresis")).toBeDefined();
  });

  it("verso vacío: sin candidatos", () => {
    expect(detectarCandidatos("")).toEqual([]);
  });

  it("una sola palabra sin hiato ni diptongo: sin candidatos", () => {
    expect(detectarCandidatos("sol")).toEqual([]);
  });

  it("una sola sinalefa en 'era un ave' (un termina en consonante)", () => {
    const cs = detectarCandidatos("era un ave");
    const sinalefas = cs.filter((c) => c.tipo === "sinalefa");
    expect(sinalefas.length).toBe(1);
    expect(sinalefas[0]?.palabraA).toBe(0);
    expect(sinalefas[0]?.palabraB).toBe(1);
  });

  it("múltiples fronteras: 'era una aurora' → dos sinalefas", () => {
    const cs = detectarCandidatos("era una aurora");
    const sinalefas = cs.filter((c) => c.tipo === "sinalefa");
    expect(sinalefas.length).toBe(2);
  });

  it("D7: cerrada tónica no bloquea la sinalefa", () => {
    const cs = detectarCandidatos("la ía");
    expect(cs.find((c) => c.tipo === "sinalefa")).toBeDefined();
  });

  it("conjunción 'y' como vocal cerrada: 'y antes' → sinalefa", () => {
    const cs = detectarCandidatos("y antes");
    const sin = cs.find((c) => c.tipo === "sinalefa");
    expect(sin).toBeDefined();
    expect(sin?.palabraA).toBe(0);
    expect(sin?.palabraB).toBe(1);
  });
});
