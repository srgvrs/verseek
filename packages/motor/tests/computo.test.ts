import { describe, expect, it } from "vitest";
import { computar } from "../src/computo.js";
import { resolverEscansion, type Eleccion } from "../src/escansion.js";

describe("computar", () => {
  it("DIAGNÓSTICO: 'el mar.' vs 'el mar' — ajuste y tipoFinal", () => {
    const conPunto = computar(resolverEscansion("el mar.", []), "el mar.");
    const sinPunto = computar(resolverEscansion("el mar", []), "el mar");
    // eslint-disable-next-line no-console
    console.log("conPunto:", conPunto);
    // eslint-disable-next-line no-console
    console.log("sinPunto:", sinPunto);
    expect(conPunto.tipoFinal).toBe(sinPunto.tipoFinal);
    expect(conPunto.ajuste).toBe(sinPunto.ajuste);
  });
  it("verso vacío: cómputo 0, sin ajuste", () => {
    const esc = resolverEscansion("", []);
    const r = computar(esc, "");
    expect(r.silabasMetricas).toBe(0);
    expect(r.ajuste).toBe(0);
    expect(r.tipoFinal).toBe("monosilabo");
  });

  it("verso llano: sin ajuste", () => {
    // "casa" → llana, 2 sílabas
    const esc = resolverEscansion("casa", []);
    const r = computar(esc, "casa");
    expect(r.silabasMetricas).toBe(2);
    expect(r.ajuste).toBe(0);
    expect(r.tipoFinal).toBe("llana");
  });

  it("verso agudo: +1", () => {
    // "corazón" → aguda, 3 sílabas → 4
    const esc = resolverEscansion("corazón", []);
    const r = computar(esc, "corazón");
    expect(r.silabasMetricas).toBe(4);
    expect(r.ajuste).toBe(1);
    expect(r.tipoFinal).toBe("aguda");
  });

  it("verso esdrújulo: −1", () => {
    // "pájaro" → esdrújula, 3 sílabas → 2
    const esc = resolverEscansion("pájaro", []);
    const r = computar(esc, "pájaro");
    expect(r.silabasMetricas).toBe(2);
    expect(r.ajuste).toBe(-1);
    expect(r.tipoFinal).toBe("esdrujula");
  });

  it("monosílabo final: sin ajuste", () => {
    // "sol" → monosílabo, 1 sílaba
    const esc = resolverEscansion("sol", []);
    const r = computar(esc, "sol");
    expect(r.silabasMetricas).toBe(1);
    expect(r.ajuste).toBe(0);
    expect(r.tipoFinal).toBe("monosilabo");
  });

  it("sinalefa aplicada + final agudo: ajuste combinado", () => {
    // "la aurora" con sinalefa → 3 sílabas; "aurora" es llana → 0
    const e: Eleccion = {
      tipo: "sinalefa",
      palabraA: 0,
      palabraB: 1,
      valor: "aplicar",
    };
    const esc = resolverEscansion("la aurora", [e]);
    const r = computar(esc, "la aurora");
    expect(r.silabasMetricas).toBe(3);
    expect(r.ajuste).toBe(0);
    expect(r.tipoFinal).toBe("llana");
  });

  it("sinalefa aplicada + final agudo real: ajuste combinado", () => {
    // "una ilusión" con sinalefa → 4 sílabas; "ilusión" es aguda → +1 = 5
    const e: Eleccion = {
      tipo: "sinalefa",
      palabraA: 0,
      palabraB: 1,
      valor: "aplicar",
    };
    const esc = resolverEscansion("una ilusión", [e]);
    const r = computar(esc, "una ilusión");
    expect(r.silabasMetricas).toBe(5);
    expect(r.ajuste).toBe(1);
    expect(r.tipoFinal).toBe("aguda");
  });

  it("ignora puntuación final al buscar la última palabra", () => {
    // "corazón," → aguda, 3 sílabas → 4
    const esc = resolverEscansion("corazón", []);
    const r = computar(esc, "corazón,");
    expect(r.silabasMetricas).toBe(4);
    expect(r.tipoFinal).toBe("aguda");
  });
});
