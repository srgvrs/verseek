import { describe, it, expect } from "vitest";
import corpus from "./corpus/versos.json";
import { resolverEscansion, computar } from "../src/index.js";

describe("corpus de oro", () => {
  it.each(corpus)("$id: $texto", (v) => {
    const esc = resolverEscansion(v.texto, v.elecciones as any);
    const c = computar(esc, v.texto);
    expect(c.silabasMetricas).toBe(v.metricas);
  });
});