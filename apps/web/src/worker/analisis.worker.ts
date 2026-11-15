import { analizarVerso } from "@verseek/motor";
import type {
  MensajeEntrada,
  MensajeSalida,
  VersoResultado,
} from "./protocolo.js";

self.addEventListener("message", (ev: MessageEvent<MensajeEntrada>) => {
  const msg = ev.data;
  if (msg.tipo !== "analizar") return;

  const versos: VersoResultado[] = msg.versos.map((v) => {
    try {
      const analisis = analizarVerso(v.texto, v.elecciones);
      return { id: v.id, analisis };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return { id: v.id, error };
    }
  });

  const salida: MensajeSalida = { tipo: "resultado", seq: msg.seq, versos };
  (self as unknown as Worker).postMessage(salida);
});
