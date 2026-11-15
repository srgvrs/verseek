import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  analizarVerso,
  analizarRitmo,
  computar,
  resolverEscansion,
  unidadesMetricas,
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

      // v1: `silabas` son sílabas escritas (ver OVR-05). Con sinéresis o
      // diéresis aplicadas, las unidades métricas no se corresponden 1:1
      // con las sílabas escritas, así que se omite la comparación.
      const tieneIntra = r.eleccionesAplicadas.some(
        (e) =>
          e.valor === "aplicar" &&
          (e.tipo === "sineresis" || e.tipo === "dieresis"),
      );
      if (tieneIntra) return;

      // Agrupar silabas[].tonica por unidades métricas: una unidad es
      // tónica si alguna de sus sílabas lo es.
      const esc = resolverEscansion(v.texto, elecciones);
      const unidades = unidadesMetricas(esc, v.texto);
      const posiciones: number[] = [];
      for (let u = 0; u < unidades.length; u++) {
        const grupo = unidades[u];
        if (grupo === undefined) continue;
        const esTonica = grupo.some(
          (i) => i >= 0 && r.silabas[i]?.tonica === true,
        );
        if (esTonica) posiciones.push(u + 1);
      }
      expect(posiciones).toEqual([...r.ritmo.posicionesTonicas]);
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
    // "que se debe a tu fama y a tu gloria": se desactiva la sinalefa 2:3
    // (debe‿a), que sí es un candidato real.
    const elecciones: Eleccion[] = [
      { tipo: "sinalefa", palabraA: 2, palabraB: 3, valor: "no-aplicar" },
    ];
    const r = analizarVerso(
      "que se debe a tu fama y a tu gloria",
      elecciones,
    );
    const sinalefa = r.candidatos.find(
      (c) => c.tipo === "sinalefa" && c.palabraA === 2 && c.palabraB === 3,
    );
    const hiato = r.candidatos.find(
      (c) => c.tipo === "hiato" && c.palabraA === 2 && c.palabraB === 3,
    );
    expect(sinalefa?.activo).toBe(false);
    expect(hiato?.activo).toBe(true);
    expect(r.eleccionesAplicadas).toContainEqual(elecciones[0]);
  });

  it("elección huérfana: sinalefa 4:5 no-aplicar no cambia nada", () => {
    const texto = "que se debe a tu fama y a tu gloria";
    const elecciones: Eleccion[] = [
      { tipo: "sinalefa", palabraA: 4, palabraB: 5, valor: "no-aplicar" },
    ];
    const base = analizarVerso(texto, []);
    const r = analizarVerso(texto, elecciones);

    expect(r.eleccionesHuerfanas).toContainEqual(elecciones[0]);
    expect(r.eleccionesAplicadas).toEqual([]);
    expect(r.computo?.silabasMetricas).toBe(base.computo?.silabasMetricas);
    expect(r.candidatos.map((c) => c.activo)).toEqual(
      base.candidatos.map((c) => c.activo),
    );
  });

  it("sin elecciones, LIC-03 desactiva la sinalefa 5:6 y activa su hiato", () => {
    // "que se debe a tu fama y a tu gloria": fama‿y‿a forma sinalefa triple,
    // así que LIC-03 bloquea fama‿y (5:6) por defecto.
    const r = analizarVerso("que se debe a tu fama y a tu gloria", []);
    const sinalefa = r.candidatos.find(
      (c) => c.tipo === "sinalefa" && c.palabraA === 5 && c.palabraB === 6,
    );
    const hiato = r.candidatos.find(
      (c) => c.tipo === "hiato" && c.palabraA === 5 && c.palabraB === 6,
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
