import { describe, expect, it } from "vitest";
import { clasificarAcento, esAtono } from "../src/acento.js";

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

describe("esAtono", () => {
  it("ACE-05: artículos definidos son átonos", () => {
    expect(esAtono("el")).toBe(true);
    expect(esAtono("la")).toBe(true);
    expect(esAtono("lo")).toBe(true);
    expect(esAtono("los")).toBe(true);
    expect(esAtono("las")).toBe(true);
  });

  it("ACE-05: artículo indeterminado y contracción son átonos", () => {
    expect(esAtono("un")).toBe(true);
    expect(esAtono("del")).toBe(true);
    expect(esAtono("al")).toBe(true);
  });

  it("ACE-05: preposiciones son átonas", () => {
    expect(esAtono("a")).toBe(true);
    expect(esAtono("con")).toBe(true);
    expect(esAtono("de")).toBe(true);
    expect(esAtono("en")).toBe(true);
    expect(esAtono("por")).toBe(true);
    expect(esAtono("sin")).toBe(true);
  });

  it("ACE-05: conjunciones breves son átonas", () => {
    expect(esAtono("y")).toBe(true);
    expect(esAtono("e")).toBe(true);
    expect(esAtono("o")).toBe(true);
    expect(esAtono("u")).toBe(true);
    expect(esAtono("ni")).toBe(true);
    expect(esAtono("que")).toBe(true);
    expect(esAtono("si")).toBe(true);
  });

  it("ACE-05: pronombres átonos son átonos", () => {
    expect(esAtono("me")).toBe(true);
    expect(esAtono("te")).toBe(true);
    expect(esAtono("se")).toBe(true);
    expect(esAtono("nos")).toBe(true);
    expect(esAtono("os")).toBe(true);
    expect(esAtono("le")).toBe(true);
    expect(esAtono("les")).toBe(true);
  });

  it("ACE-05: posesivos antepuestos son átonos", () => {
    expect(esAtono("mi")).toBe(true);
    expect(esAtono("tu")).toBe(true);
    expect(esAtono("su")).toBe(true);
    expect(esAtono("mis")).toBe(true);
    expect(esAtono("tus")).toBe(true);
    expect(esAtono("sus")).toBe(true);
  });

  it("ACE-05: auxiliares de 'haber' son átonos", () => {
    expect(esAtono("ha")).toBe(true);
    expect(esAtono("he")).toBe(true);
    expect(esAtono("has")).toBe(true);
    expect(esAtono("han")).toBe(true);
  });

  it("ACE-05: tónicos con tilde diacrítica no son átonos", () => {
    expect(esAtono("él")).toBe(false);
    expect(esAtono("mí")).toBe(false);
    expect(esAtono("tú")).toBe(false);
    expect(esAtono("qué")).toBe(false);
    expect(esAtono("más")).toBe(false);
    expect(esAtono("sé")).toBe(false);
  });

  it("ACE-05: monosílabos no listados son tónicos", () => {
    expect(esAtono("van")).toBe(false);
    expect(esAtono("sol")).toBe(false);
    expect(esAtono("pan")).toBe(false);
  });

  it("ACE-05: polisílabos no son átonos", () => {
    expect(esAtono("casa")).toBe(false);
  });
});
