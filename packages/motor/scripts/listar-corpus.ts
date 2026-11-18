import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  resolverEscansion,
  analizarRitmo,
  computar,
  type Eleccion,
} from "../src/index.js";

interface VersoCorpus {
  readonly id: string;
  readonly texto: string;
  readonly fuente: string;
  readonly verificado: string;
  readonly tonicas: readonly number[];
  readonly metricas: number;
  readonly elecciones: readonly Eleccion[];
  readonly nota?: string;
}

const RUTA_CORPUS = fileURLToPath(
  new URL("../tests/corpus/versos.json", import.meta.url),
);

function cargarCorpus(): readonly VersoCorpus[] {
  const crudo = readFileSync(RUTA_CORPUS, "utf8");
  const datos: unknown = JSON.parse(crudo);
  if (!Array.isArray(datos)) {
    throw new Error(`Corpus inválido en ${RUTA_CORPUS}: se esperaba un array.`);
  }
  return datos as readonly VersoCorpus[];
}

function formatearPatron(patron: readonly ("T" | "a")[]): string {
  return patron.join("");
}

function mismasTonicas(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function main(): void {
  const soloPendientes = process.argv.includes("--pendientes");
  const corpus = cargarCorpus();

  let listados = 0;
  let diferenciasTonicas = 0;
  let diferenciasMetricas = 0;

  for (const v of corpus) {
    if (soloPendientes && v.verificado !== "pendiente") continue;

    const esc = resolverEscansion(v.texto, v.elecciones);
    const ritmo = analizarRitmo(esc, v.texto);
    const computo = computar(esc, v.texto);
    const tonicasMotor = [...ritmo.posicionesTonicas];
    const okTonicas = mismasTonicas(v.tonicas, tonicasMotor);
    const okMetricas = v.metricas === computo.silabasMetricas;

    listados++;
    if (!okTonicas) diferenciasTonicas++;
    if (!okMetricas) diferenciasMetricas++;

    console.log(`id:        ${v.id}`);
    console.log(`texto:     ${v.texto}`);
    console.log(`fuente:    ${v.fuente}`);
    console.log(`verificado: ${v.verificado}`);
    console.log(`tónicas JSON:  [${v.tonicas.join(", ")}]`);
    console.log(`tónicas motor: [${tonicasMotor.join(", ")}]`);
    console.log(`métricas JSON: ${v.metricas}, motor: ${computo.silabasMetricas}`);
    console.log(`patrón:    ${formatearPatron(ritmo.patron)}`);
    console.log(`estado:    ${okTonicas ? "OK" : "DIFIERE"}`);
    if (v.nota !== undefined) {
      console.log(`nota:      ${v.nota}`);
    }
    console.log("");
  }

  console.log(
    `${listados} versos listados, ${diferenciasTonicas} con DIFIERE (tónicas), ${diferenciasMetricas} con DIFIERE (métricas)`,
  );
}

main();
