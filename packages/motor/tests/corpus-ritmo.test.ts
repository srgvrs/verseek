import { describe, it, expect } from "vitest";
import corpus from "./corpus/versos.json";
import { resolverEscansion, computar, analizarRitmo } from "../src/index.js";

describe("corpus: tónicas", () => {
  it.each(corpus)("$id: $texto", (v) => {
    const esc = resolverEscansion(v.texto, v.elecciones as any);
    const r = analizarRitmo(esc, v.texto);
    expect([...r.posicionesTonicas]).toEqual(v.tonicas);
  });
});

describe("corpus: longitud del patrón", () => {
  it.each(corpus)("$id: $texto", (v) => {
    const esc = resolverEscansion(v.texto, v.elecciones as any);
    const r = analizarRitmo(esc, v.texto);
    expect(r.patron.length).toBe(computar(esc, v.texto).silabasMetricas);
  });
});