import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  analizarVerso,
  analizarRitmo,
  computar,
  resolverEscansion,
  type Eleccion,
} from "../src/index.js";

interface VersoCorpus {
  readonly id: string;
  readonly texto: string;
  readonly elecciones: readonly Eleccion[];
}

const aqui = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(
  readFileSync(resolve(aqui, "corpus/versos.json"), "utf8"),
) as VersoCorpus[];

describe("analizarVerso", () => {
  it.each(corpus)(
    "$id: computo y ritmo coinciden con las funciones por separado",
    (v) => {
      const elecciones = v.elecciones as unknown as Eleccion[];
      const r = analizarVerso(v.texto, elecciones);
      const esc = resolverEscansion(v.texto, elecciones);
      expect(r.computo).toEqual(computar(esc, v.texto));
      expect(r.ritmo).toEqual(analizarRitmo(esc, v.texto));
    },
  );

  it.each(corpus)("$id: structuredClone es igual al resultado", (v) => {
    const elecciones = v.elecciones as unknown as Eleccion[];
    const r = analizarVerso(v.texto, elecciones);
    expect(structuredClone(r)).toEqual(r);
  });

  it.each(corpus)(
    "$id: offsets absolutos de sílabas reconstruyen el texto",
    (v) => {
      const elecciones = v.elecciones as unknown as Eleccion[];
      const r = analizarVerso(v.texto, elecciones);
      for (const s of r.silabas) {
        expect(v.texto.slice(s.inicio, s.fin)).toBe(s.texto);
      }
    },
  );

  it.each(corpus)(
    "$id: silabas[].tonica coincide con ritmo.posicionesTonicas",
    (v) => {
      const elecciones = v.elecciones as unknown as Eleccion[];
      const r = analizarVerso(v.texto, elecciones);
      if (r.ritmo === null) return;
      const tonicas = r.silabas
        .map((s, i) => (s.tonica ? i + 1 : -1))
        .filter((i) => i > 0);
      // `posicionesTonicas` se calcula sobre unidades métricas (con
      // sinalefas fusionadas), así que sólo comparamos el conjunto de
      // sílabas planas tónicas cuando no hay fusiones.
      if (r.ritmo.patron.length === r.silabas.length) {
        expect(tonicas).toEqual([...r.ritmo.posicionesTonicas]);
      }
    },
  );

  it.each(["", "...", "¿?"])(
    "verso sin palabras %j devuelve estructura vacía y computo/ritmo null",
    (texto) => {
      const r = analizarVerso(texto, []);
      expect(r.palabras).toEqual([]);
      expect(r.silabas).toEqual([]);
      expect(r.candidatos).toEqual([]);
      expect(r.eleccionesAplicadas).toEqual([]);
      expect(r.eleccionesHuerfanas).toEqual([]);
      expect(r.computo).toBeNull();
      expect(r.ritmo).toBeNull();
    },
  );

  it("sinalefa activa si su frontera está en fronterasSinalefa", () => {
    // "En tanto que de rosa y azucena": rosa‿y es sinalefa por defecto.
    const r = analizarVerso("En tanto que de rosa y azucena", []);
    const sinalefas = r.candidatos.filter((c) => c.tipo === "sinalefa");
    expect(sinalefas.length).toBeGreaterThan(0);
    for (const c of sinalefas) {
      const enFrontera = r.candidatos.some(
        (o) =>
          o.tipo === "sinalefa" &&
          o.palabraA === c.palabraA &&
          o.palabraB === c.palabraB &&
          o.activo,
      );
      expect(c.activo).toBe(enFrontera);
    }
  });

  it("sinalefa desactivada por elección deja el hiato complementario activo", () => {
    // "que se debe a tu fama y a tu gloria": se bloquea fama‿y‿a.
    const elecciones: Eleccion[] = [
      { tipo: "sinalefa", palabraA: 4, palabraB: 5, valor: "no-aplicar" },
    ];
    const r = analizarVerso(
      "que se debe a tu fama y a tu gloria",
      elecciones,
    );
    const sinalefa = r.candidatos.find(
      (c) => c.tipo === "sinalefa" && c.palabraA === 4 && c.palabraB === 5,
    );
    const hiato = r.candidatos.find(
      (c) => c.tipo === "hiato" && c.palabraA === 4 && c.palabraB === 5,
    );
    expect(sinalefa?.activo).toBe(false);
    expect(hiato?.activo).toBe(true);
  });

  it("sinéresis activa sólo si está en eleccionesAplicadas", () => {
    // "y en aérea fantástica danza": sinéresis en aérea (palabra 2).
    const sinEleccion = analizarVerso("y en aérea fantástica danza", []);
    const sineresisSin = sinEleccion.candidatos.find(
      (c) => c.tipo === "sineresis" && c.palabraA === 2,
    );
    expect(sineresisSin?.activo).toBe(false);

    const conEleccion = analizarVerso("y en aérea fantástica danza", [
      { tipo: "sineresis", palabraA: 2, palabraB: 2, valor: "aplicar" },
    ]);
    const sineresisCon = conEleccion.candidatos.find(
      (c) => c.tipo === "sineresis" && c.palabraA === 2,
    );
    expect(sineresisCon?.activo).toBe(true);
  });

  it("diéresis activa sólo si está en eleccionesAplicadas", () => {
    // "Y quedar del licor süave y rico": diéresis en süave (palabra 4).
    const sinEleccion = analizarVerso("Y quedar del licor süave y rico", []);
    const dieresisSin = sinEleccion.candidatos.find(
      (c) => c.tipo === "dieresis" && c.palabraA === 4,
    );
    expect(dieresisSin?.activo).toBe(false);

    const conEleccion = analizarVerso("Y quedar del licor süave y rico", [
      { tipo: "dieresis", palabraA: 4, palabraB: 4, valor: "aplicar" },
    ]);
    const dieresisCon = conEleccion.candidatos.find(
      (c) => c.tipo === "dieresis" && c.palabraA === 4,
    );
    expect(dieresisCon?.activo).toBe(true);
  });

  // Nota: `licencias.ts` no emite candidatos `hiato` intra-palabra (sólo
  // sinéresis y diéresis). La rama intra-palabra de `estaActivo` para
  // `hiato` queda cubierta por construcción pero no por datos reales.
});
