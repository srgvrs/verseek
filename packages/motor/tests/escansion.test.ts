import { describe, expect, it } from "vitest";
import { resolverEscansion, type Eleccion } from "../src/escansion.js";

describe("resolverEscansion", () => {
  it("verso vacío: sin sílabas, sin elecciones", () => {
    const r = resolverEscansion("", []);
    expect(r.silabas).toEqual([]);
    expect(r.silabasMetricas).toBe(0);
    expect(r.eleccionesAplicadas).toEqual([]);
    expect(r.eleccionesHuerfanas).toEqual([]);
  });

  it("sin candidatos: escansión = silabeo plano", () => {
    const r = resolverEscansion("sol", []);
    expect(r.silabas.length).toBe(1);
    expect(r.silabasMetricas).toBe(1);
  });

  it("sin elecciones: sinalefa por defecto (LIC-01)", () => {
    const r = resolverEscansion("la aurora", []);
    // la‿au-ro-ra = 3 sílabas con sinalefa
    expect(r.silabasMetricas).toBe(3);
    expect(r.eleccionesAplicadas).toEqual([]);
  });

  it("sinalefa aplicada: −1 sílaba", () => {
    const e: Eleccion = {
      tipo: "sinalefa",
      palabraA: 0,
      palabraB: 1,
      valor: "aplicar",
    };
    const r = resolverEscansion("la aurora", [e]);
    expect(r.silabasMetricas).toBe(3);
    expect(r.eleccionesAplicadas).toEqual([e]);
    expect(r.eleccionesHuerfanas).toEqual([]);
  });

  it("sinalefa no aplicada: sin cambio", () => {
    const e: Eleccion = {
      tipo: "sinalefa",
      palabraA: 0,
      palabraB: 1,
      valor: "no-aplicar",
    };
    const r = resolverEscansion("la aurora", [e]);
    expect(r.silabasMetricas).toBe(4);
    expect(r.eleccionesAplicadas).toEqual([e]);
  });

  it("elección huérfana: se reporta, no se aplica", () => {
    const e: Eleccion = {
      tipo: "sinalefa",
      palabraA: 5,
      palabraB: 6,
      valor: "aplicar",
    };
    const r = resolverEscansion("la aurora", [e]);
    expect(r.silabasMetricas).toBe(3); // antes 4: la sinalefa por defecto sí se aplica
    expect(r.eleccionesAplicadas).toEqual([]);
    expect(r.eleccionesHuerfanas).toEqual([e]);
  });

  it("sinalefa e hiato en la misma frontera: gana la última", () => {
    const sin: Eleccion = {
      tipo: "sinalefa",
      palabraA: 0,
      palabraB: 1,
      valor: "aplicar",
    };
    const hia: Eleccion = {
      tipo: "hiato",
      palabraA: 0,
      palabraB: 1,
      valor: "aplicar",
    };
    const r = resolverEscansion("la aurora", [sin, hia]);
    // hiato tiene delta 0 → 4 sílabas
    expect(r.silabasMetricas).toBe(4);
  });

  it("sinéresis aplicada: −1 sílaba", () => {
    const e: Eleccion = {
      tipo: "sineresis",
      palabraA: 0,
      palabraB: 0,
      valor: "aplicar",
    };
    const r = resolverEscansion("poeta", [e]);
    // po-e-ta = 3 → 2
    expect(r.silabasMetricas).toBe(2);
  });

  it("diéresis aplicada: +1 sílaba", () => {
    const e: Eleccion = {
      tipo: "dieresis",
      palabraA: 0,
      palabraB: 0,
      valor: "aplicar",
    };
    const r = resolverEscansion("cielo", [e]);
    // cie-lo = 2 → 3
    expect(r.silabasMetricas).toBe(3);
  });

  it("sinéresis se aplica una sola vez aunque haya varios candidatos con la misma clave", () => {
    // "aérea" genera sineresis:2:2 dos veces (a-é y re-a). La elección debe
    // sumar el delta una sola vez: 11 → 10.
    const e: Eleccion = {
      tipo: "sineresis",
      palabraA: 2,
      palabraB: 2,
      valor: "aplicar",
    };
    const r = resolverEscansion("y en aérea fantástica danza", [e]);
    expect(r.silabasMetricas).toBe(10);
  });

  it("LIC-03: no aplica sinalefa triple con conjunción breve", () => {
    // "encubre el cielo y amontona el viento" → 11 sílabas métricas.
    // Sinalefas: breel, ya (cielo‿y‿amontona se evita la triple).
    const r = resolverEscansion("encubre el cielo y amontona el viento", []);
    expect(r.silabasMetricas).toBe(11);
  });

  it("idempotencia: aplicar y deshacer vuelve al mismo estado", () => {
    const aplicar: Eleccion = {
      tipo: "sinalefa",
      palabraA: 0,
      palabraB: 1,
      valor: "aplicar",
    };
    const deshacer: Eleccion = {
      tipo: "sinalefa",
      palabraA: 0,
      palabraB: 1,
      valor: "no-aplicar",
    };
    const r1 = resolverEscansion("la aurora", [aplicar]);
    const r2 = resolverEscansion("la aurora", [deshacer]);
    expect(r1.silabasMetricas).toBe(3);
    expect(r2.silabasMetricas).toBe(4);
  });
});
