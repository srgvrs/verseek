import { montarEditor, setMetricas } from "./editor";
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

const view = montarEditor(app);

const worker = new Worker(
  new URL("./worker/analisis.worker.ts", import.meta.url),
  { type: "module" },
);

let seq = 0;
let ultimoSeqEnviado = -1;
let timer: ReturnType<typeof setTimeout> | null = null;

function enviarAnalisis(): void {
  const lineas = view.state.doc.toString().split("\n");
  const versos: VersoEntrada[] = lineas.map((texto, id) => ({
    id,
    texto,
    elecciones: [],
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
  for (const r of msg.versos) {
    if ("error" in r) {
      console.warn(`verso ${r.id}: ${r.error}`);
      continue;
    }
    const c = r.analisis.computo;
    if (c === null) continue;
    metricas.set(r.id, c.silabasMetricas);
  }
  view.dispatch({ effects: setMetricas.of(metricas) });
});

view.dom.addEventListener("input", programarAnalisis);

programarAnalisis();
console.log("verseek web — editor montado");
