import { describe, expect, it } from "vitest";
import { clasificarAcento } from "../src/acento.js";

describe("clasificarAcento", () => {
  it("palabra vacía: monosílabo, sin tónica", () => {
    const r = clasificarAcento("");
    expect(r.tipo).toBe("monosilabo");
    expect(r.tonica).toBeNull();
    expect(r.silabas).toEqual([]);
  });

  it("monosílabo: 'sol' → monosilabo", () => {
    const r = clasificarAcento("sol");
    expect(r.tipo).toBe("monosilabo");
    expect(r.silabaTonica).toBe(0);
  });

  it("llana terminada en vocal: 'casa' → llana, tónica en 'ca'", () => {
    const r = clasificarAcento("casa");
    expect(r.tipo).toBe("llana");
    expect(r.silabaTonica).toBe(0);
    expect(r.tonica?.texto).toBe("ca");
  });

  it("llana terminada en vocal: 'aurora' → llana, tónica en 'ro'", () => {
    const r = clasificarAcento("aurora");
    expect(r.tipo).toBe("llana");
    expect(r.silabaTonica).toBe(1);
    expect(r.tonica?.texto).toBe("ro");
  });

  it("llana terminada en 'n': 'examen' → llana", () => {
    const r = clasificarAcento("examen");
    expect(r.tipo).toBe("llana");
  });

  it("llana terminada en 's': 'lunes' → llana", () => {
    const r = clasificarAcento("lunes");
    expect(r.tipo).toBe("llana");
  });

  it("aguda terminada en consonante: 'cantar' → aguda", () => {
    const r = clasificarAcento("cantar");
    expect(r.tipo).toBe("aguda");
    expect(r.silabaTonica).toBe(r.silabas.length - 1);
  });

  it("aguda con tilde: 'corazón' → aguda", () => {
    const r = clasificarAcento("corazón");
    expect(r.tipo).toBe("aguda");
    expect(r.tonica?.texto).toBe("zón");
  });

  it("esdrújula con tilde: 'pájaro' → esdrujula", () => {
    const r = clasificarAcento("pájaro");
    expect(r.tipo).toBe("esdrujula");
    expect(r.silabaTonica).toBe(0);
    expect(r.tonica?.texto).toBe("pá");
  });

  it("sobresdrújula con tilde: 'dígaselo' → sobresdrujula", () => {
    const r = clasificarAcento("dígaselo");
    expect(r.tipo).toBe("sobresdrujula");
    expect(r.silabaTonica).toBe(0);
  });

  it("tilde explícita manda sobre la regla general: 'árbol' → llana", () => {
    const r = clasificarAcento("árbol");
    expect(r.tipo).toBe("llana");
    expect(r.tonica?.texto).toBe("ár");
  });

  it("adverbio en -mente: 'rápidamente' → esdrujula (base 'rápida')", () => {
    const r = clasificarAcento("rápidamente");
    expect(r.tipo).toBe("esdrujula");
    expect(r.tonica?.texto).toBe("rá");
  });

  it("adverbio en -mente: 'lentamente' → llana (base 'lenta')", () => {
    const r = clasificarAcento("lentamente");
    expect(r.tipo).toBe("llana");
  });
});
