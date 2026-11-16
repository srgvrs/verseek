import { montarEditor, setMetricas, setTonicas } from "./editor";
import { crearPanel } from "./panel";
import { alternarAcento, alternarCandidato, eleccionesDe } from "./estado";
import type { AnalisisVerso, CandidatoAnalizado } from "@verseek/motor";
import type {
  MensajeEntrada,
  MensajeSalida,
  VersoEntrada,
} from "./worker/protocolo.js";

console.log("verseek web — arrancando");

const app = document.querySelector<HTMLElement>("#app");
if (app === null) {
  throw new Error('No se encontró el contenedor "#app" en el DOM.');
}

let view: ReturnType<typeof montarEditor>;

const worker = new Worker(
  new URL("./worker/analisis.worker.ts", import.meta.url),
  { type: "module" },
);

let seq = 0;
let ultimoSeqEnviado = -1;
let timer: ReturnType<typeof setTimeout> | null = null;

function lineaDelCursor(): number {
  return view.state.doc.lineAt(view.state.selection.main.head).number - 1;
}

const panel = crearPanel(
  (c: CandidatoAnalizado) => {
    alternarCandidato(lineaDelCursor(), c);
    enviarAnalisis();
  },
  (palabra: number, silaba: number, tonica: boolean) => {
    alternarAcento(lineaDelCursor(), palabra, silaba, tonica);
    enviarAnalisis();
  },
);
const analisisPorId = new Map<number, AnalisisVerso>();

function refrescarPanel(): void {
  const analisis = analisisPorId.get(lineaDelCursor());
  panel.actualizar(analisis ?? null);
}

function enviarAnalisis(): void {
  const lineas = view.state.doc.toString().split("\n");
  const versos: VersoEntrada[] = lineas.map((texto, id) => ({
    id,
    texto,
    elecciones: eleccionesDe(id),
  }));
  seq += 1;
  ultimoSeqEnviado = seq;
  const msg: MensajeEntrada = { tipo: "analizar", seq, versos };
  worker.postMessage(msg);
}

function programarAnalisis(): void {
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    enviarAnalisis();
  }, 300);
}

worker.addEventListener("message", (ev: MessageEvent<MensajeSalida>) => {
  const msg = ev.data;
  if (msg.tipo !== "resultado") return;
  if (msg.seq < ultimoSeqEnviado) return;

  const metricas = new Map<number, number>();
  const tonicas = new Map<
    number,
    ReadonlyArray<{ inicio: number; fin: number }>
  >();
  analisisPorId.clear();
  for (const r of msg.versos) {
    if ("error" in r) {
      console.warn(`verso ${r.id}: ${r.error}`);
      continue;
    }
    analisisPorId.set(r.id, r.analisis);
    const c = r.analisis.computo;
    if (c !== null) {
      metricas.set(r.id, c.silabasMetricas);
    }
    const rangos: { inicio: number; fin: number }[] = [];
    for (const s of r.analisis.silabas) {
      if (!s.tonica) continue;
      rangos.push({ inicio: s.inicio, fin: s.fin });
    }
    tonicas.set(r.id, rangos);
  }
  view.dispatch({
    effects: [setMetricas.of(metricas), setTonicas.of(tonicas)],
  });
  refrescarPanel();
});

view = montarEditor(app, programarAnalisis, refrescarPanel);

programarAnalisis();
console.log("verseek web — editor montado");
